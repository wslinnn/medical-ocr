/**
 * 医疗病例 OCR 识别系统 Pro - 导出入口模块
 * Medical OCR Pro - Export Entry Points Module
 */

function exportToExcel() {
    if (state.records.length === 0) {
        showToast('暂无数据可导出', 'error');
        return;
    }

    pendingExportRecords = state.records;
    pendingExportFilename = '医疗病例识别_全部';
    document.getElementById('export-count').textContent = state.records.length;
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
    document.getElementById('export-count').textContent = selectedRecords.length;
    // Use focus management for modal
    if (window.openModalWithFocus) {
        openModalWithFocus('export-modal');
    } else {
        document.getElementById('export-modal').classList.add('active');
    }
}
