/**
 * 医疗病例 OCR 识别系统 Pro - 导出选项模态框模块
 * Medical OCR Pro - Export Modal Module
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
        includeFullText: document.getElementById('export-full-text').checked,
        includeImageNote: document.getElementById('export-image-note').checked,
        includeFilename: document.getElementById('export-filename').checked
    };

    document.getElementById('export-modal').classList.remove('active');

    if (pendingExportRecords) {
        if (typeof XLSX !== 'undefined' && XLSX.utils) {
            exportRecordsToExcel(pendingExportRecords, pendingExportFilename, options);
        } else {
            console.log('XLSX not available, using CSV export');
            exportToCSV(pendingExportRecords, options);
        }
    }

    pendingExportRecords = null;
};
