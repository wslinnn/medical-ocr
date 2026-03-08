/**
 * 医疗病例 AI 识别系统 Pro - 导出选项模态框模块
 * Medical AI Pro - Export Modal Module
 */

// ============================================================================
// EXPORT MODAL STATE
// ============================================================================
let pendingExportRecords = null;
let pendingExportFilename = '';

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
};

document.getElementById('btn-export-confirm').onclick = () => {
    const options = {
        includeFilename: document.getElementById('export-filename').checked,
        includeTime: document.getElementById('export-time').checked
    };

    document.getElementById('export-modal').classList.remove('active');

    if (pendingExportRecords) {
        // 直接使用 CSV 导出
        exportToCSV(pendingExportRecords, options);
    }

    pendingExportRecords = null;
};
