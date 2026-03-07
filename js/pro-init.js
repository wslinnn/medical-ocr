/**
 * 医疗病例 OCR 识别系统 Pro - 应用初始化模块
 * Medical OCR Pro - Application Initialization Module
 */

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================
async function init() {
    // Load records from IndexedDB first
    await loadRecords();

    // Load token
    if (dom.apiToken) dom.apiToken.value = state.token;

    // Update network status
    updateNetworkStatus();

    // Update table and results
    renderRecords();
    updateRecentResults();

    // Initialize tab
    switchTab('upload');

    console.log('Medical OCR Pro - Initialized with IndexedDB');
}

// Initialize on load
window.onload = init;
