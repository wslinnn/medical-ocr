/**
 * 医疗病例 OCR 识别系统 Pro - 应用初始化模块
 * Medical OCR Pro - Application Initialization Module
 */

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================
function init() {
    // Load token
    dom.apiToken.value = state.token;

    // Update network status
    updateNetworkStatus();

    // Update recent results
    updateRecentResults();

    // Initialize tab
    switchTab('upload');

    console.log('Medical OCR Pro - Initialized');
}

// Initialize on load
window.onload = init;
