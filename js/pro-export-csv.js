/**
 * 医疗病例 AI 识别系统 Pro - CSV导出模块
 * Medical AI Pro - CSV Export Module
 */

// ============================================================================
// FILENAME SANITIZATION
// ============================================================================
function sanitizeCSVFilename(filename) {
    // Remove or replace characters that are invalid in Windows filenames
    // Invalid: < > : " / \ | ? *
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid chars with underscore
        .replace(/\s+/g, '_')            // Replace spaces with underscores
        .replace(/_+/g, '_')             // Replace multiple underscores with single
        .replace(/^_|_$/g, '');          // Remove leading/trailing underscores
}

function exportToCSV(records, options = {}) {
    const {
        includeFilename = false,
        includeTime = false
    } = options;

    try {
        // BOM for UTF-8
        let csvContent = '\uFEFF';

        // Build header row
        let header = '姓名,穿刺病理,TNM分期,手术时间,术后病理,HER2状态,ER状态,ki67';
        if (includeFilename) header += ',原始文件名';
        if (includeTime) header += ',解析时间';
        csvContent += header + '\n';

        // Build data rows
        records.forEach(r => {
            const escape = (str) => '"' + (str || '').toString().replace(/"/g, '""') + '"';

            let row = `${escape(r.name || '未检出')},${escape(r.biopsyPathology || '未检出')},${escape(r.tnmStage || '待查')},${escape(r.surgeryTime || '未检出')},${escape(r.postopPathology || '未检出')},${escape(r.her2Status || '待查')},${escape(r.erStatus || '待查')},${escape(r.ki67 || '待查')}`;
            if (includeFilename) row += `,${escape(r.fileName || '')}`;

            // Format parsing time
            if (includeTime) {
                let timeStr = '-';
                if (r.createdAt) {
                    try {
                        const date = new Date(r.createdAt);
                        timeStr = date.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                    } catch (e) {
                        timeStr = r.createdAt;
                    }
                }
                row += `,${escape(timeStr)}`;
            }

            csvContent += row + '\n';
        });

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const timestamp = new Date().toISOString();
        const safeFilename = sanitizeCSVFilename('医疗病例识别');
        link.href = URL.createObjectURL(blob);
        link.download = `${safeFilename}_${timestamp}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        // Show success message
        const optionsText = [
            includeFilename ? '文件名' : null,
            includeTime ? '解析时间' : null
        ].filter(Boolean).join('、');

        showToast(`成功导出 ${records.length} 条记录 (CSV${optionsText ? ', 含' + optionsText : ''})`);
    } catch (error) {
        console.error('CSV导出失败:', error);
        showToast('导出失败: ' + error.message, 'error');
    }
}
