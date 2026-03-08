/**
 * 医疗病例 AI 识别系统 Pro - 应用初始化模块
 * Medical AI Pro - Application Initialization Module
 */

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================
async function init() {
    // 首先从 electron-store 加载设置（Token、Model 等）
    await initSettingsFromStore();

    // Load records from IndexedDB first
    await loadRecords();

    // Load token
    if (dom.apiToken) dom.apiToken.value = state.token;

    // Update network status
    updateNetworkStatus();

    // Update table and results
    renderRecords();
    

    // Initialize tab
    switchTab('upload');

    console.log('Medical AI Pro - Initialized with IndexedDB');
}

// Initialize on load
window.onload = init;
