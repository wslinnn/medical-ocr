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

    // Load records from database first
    await loadRecords();

    // Load token
    if (dom.apiToken) dom.apiToken.value = state.token;

    // Update network status
    updateNetworkStatus();

    // Update model display
    updateModelDisplay();

    // Update table and results
    renderRecords();


    // Initialize tab
    switchTab('upload');

    console.log('Medical AI Pro - Initialized with SQLite');
}

// Initialize on load
window.onload = init;

// ============================================================================
// PAGE VISIBILITY - 页面可见性处理（减少后台内存占用）
// ============================================================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时：释放不必要的资源
        console.log('页面进入后台，释放资源...');
        // 清空图片缓存（如果有的话）
        state.imageOffsetX = 0;
        state.imageOffsetY = 0;
    } else {
        // 页面恢复时：恢复必要的状态
        console.log('页面恢复前台，重新加载数据...');
        // 刷新当前页数据
        loadRecords().then(renderRecords);
    }
});
