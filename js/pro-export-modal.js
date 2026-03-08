/**
 * 医疗病例 AI 识别系统 Pro - 导出选项模态框模块
 * Medical AI Pro - Export Modal Module
 */

// ============================================================================
// EXPORT MODAL STATE
// ============================================================================
let pendingExportRecords = null;
let pendingExportFilename = '';
let pendingExportTotalCount = 0;
let pendingExportStatus = '';  // 导出的状态筛选

// ============================================================================
// EXPORT MODAL EVENT HANDLERS
// ============================================================================
document.getElementById('btn-export-cancel').onclick = () => {
    // Use focus management for modal closing
    if (window.closeModalWithFocus) {
        closeModalWithFocus('export-modal');
    } else {
        document.getElementById('export-modal').classList.remove('active');
    }
    pendingExportRecords = null;
    pendingExportTotalCount = 0;
    pendingExportStatus = '';
};

document.getElementById('btn-export-confirm').onclick = async () => {
    const options = {
        includeFilename: document.getElementById('export-filename').checked,
        includeTime: document.getElementById('export-time').checked
    };

    document.getElementById('export-modal').classList.remove('active');

    if (pendingExportRecords) {
        // 选中导出 - 直接导出
        exportToCSV(pendingExportRecords, options);
    } else if (pendingExportTotalCount > 0) {
        // 全部导出 - 使用分批查询
        await exportAllToCSV(options);
    }

    pendingExportRecords = null;
    pendingExportTotalCount = 0;
    pendingExportStatus = '';
};

// 分批导出全部数据 - 直接流式生成CSV，避免一次性加载所有数据
async function exportAllToCSV(options) {
    showLoading('正在准备导出...');

    const pageSize = 1000;
    const totalCount = pendingExportTotalCount;
    const statusFilter = pendingExportStatus;

    // 生成文件名
    const getFilename = () => {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        if (statusFilter === 'reviewed') {
            return `医疗病例识别_已审核_${timestamp}.csv`;
        }
        return `医疗病例识别_全部_${timestamp}.csv`;
    };

    try {
        // BOM for UTF-8
        let csvContent = '\uFEFF';

        // Build header row
        let header = '姓名,穿刺病理,TNM分期,手术时间,术后病理,HER2状态,ER状态,ki67';
        if (options.includeFilename) header += ',原始文件名';
        if (options.includeTime) header += ',解析时间';
        csvContent += header + '\n';

        const escape = (str) => '"' + (str || '').toString().replace(/"/g, '""') + '"';

        // 分批获取并处理数据
        for (let page = 1; page <= Math.ceil(totalCount / pageSize); page++) {
            showLoading(`正在导出... ${Math.min(page * pageSize, totalCount)} / ${totalCount}`);

            const result = await db.getPaginated({
                page: page,
                pageSize: pageSize,
                search: '',
                status: statusFilter
            });

            if (result.records && result.records.length > 0) {
                // 直接将每行添加到CSV内容中，处理完立即释放
                result.records.forEach(r => {
                    let row = `${escape(r.name || '未检出')},${escape(r.biopsyPathology || '未检出')},${escape(r.tnmStage || '待查')},${escape(r.surgeryTime || '未检出')},${escape(r.postopPathology || '未检出')},${escape(r.her2Status || '待查')},${escape(r.erStatus || '待查')},${escape(r.ki67 || '待查')}`;
                    if (options.includeFilename) row += `,${escape(r.fileName || '')}`;

                    if (options.includeTime) {
                        let timeStr = '-';
                        if (r.createdAt) {
                            try {
                                const date = new Date(r.createdAt);
                                timeStr = date.toLocaleString('zh-CN', {
                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                                });
                            } catch (e) {
                                timeStr = r.createdAt;
                            }
                        }
                        row += `,${escape(timeStr)}`;
                    }

                    csvContent += row + '\n';
                });

                // 释放当前批次的数据引用
                result.records = null;
            }
        }

        hideLoading();

        if (csvContent.length > 0) {
            // 下载文件
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = getFilename();
            link.click();
            URL.revokeObjectURL(link.href);

            const optionsText = [
                options.includeFilename ? '文件名' : null,
                options.includeTime ? '解析时间' : null
            ].filter(Boolean).join('、');

            const statusText = statusFilter === 'reviewed' ? '已审核' : '';
            showToast(`成功导出 ${totalCount} 条记录${statusText ? '（' + statusText + '）' : ''} (CSV${optionsText ? ', 含' + optionsText : ''})`);
        } else {
            showToast('导出失败：无数据', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('导出失败:', error);
        showToast('导出失败: ' + error.message, 'error');
    }
}
