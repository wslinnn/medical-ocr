/**
 * 医疗病例 AI 识别系统 Pro - 导出入口模块
 * Medical AI Pro - Export Entry Points Module
 */

// 导出按钮事件绑定
document.getElementById('btn-export-all').onclick = exportToExcel;
document.getElementById('btn-export-reviewed').onclick = exportReviewedToExcel;

async function exportToExcel() {
    // 从数据库获取真实总数
    const totalCount = await db.getCount();
    if (totalCount === 0) {
        showToast('暂无数据可导出', 'error');
        return;
    }

    // 不加载全部记录到内存，只存储总数和标记为全部导出
    // 导出时使用分批查询
    pendingExportRecords = null;  // null 表示全部导出
    pendingExportFilename = '医疗病例识别_全部';
    pendingExportTotalCount = totalCount;  // 存储总数
    pendingExportStatus = '';  // 全部状态
    document.getElementById('export-count').textContent = totalCount;
    // Use focus management for modal
    if (window.openModalWithFocus) {
        openModalWithFocus('export-modal');
    } else {
        document.getElementById('export-modal').classList.add('active');
    }
}

async function exportReviewedToExcel() {
    // 获取已审核记录数量
    const statusCounts = await db.getStatusCounts();
    const reviewedCount = statusCounts.reviewed || 0;

    if (reviewedCount === 0) {
        showToast('暂无已审核数据可导出', 'error');
        return;
    }

    // 标记为导出已审核数据
    pendingExportRecords = null;
    pendingExportFilename = '医疗病例识别_已审核';
    pendingExportTotalCount = reviewedCount;
    pendingExportStatus = 'reviewed';  // 只导出已审核
    document.getElementById('export-count').textContent = reviewedCount;
    // Use focus management for modal
    if (window.openModalWithFocus) {
        openModalWithFocus('export-modal');
    } else {
        document.getElementById('export-modal').classList.add('active');
    }
}

function exportBatchRecords(recordIds) {
    const selectedRecords = state.records.filter(r => recordIds.includes(r.id));

    pendingExportRecords = selectedRecords;
    pendingExportFilename = `医疗病例识别_选中_${selectedRecords.length}条`;
    pendingExportTotalCount = selectedRecords.length;
    pendingExportStatus = '';  // 选中导出不使用状态过滤
    document.getElementById('export-count').textContent = selectedRecords.length;
    // Use focus management for modal
    if (window.openModalWithFocus) {
        openModalWithFocus('export-modal');
    } else {
        document.getElementById('export-modal').classList.add('active');
    }
}
