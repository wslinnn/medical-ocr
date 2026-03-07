/**
 * 医疗病例 OCR 识别系统 Pro - 标签页导航模块
 * Medical OCR Pro - Tab Navigation Module
 */

// ============================================================================
// TAB NAVIGATION
// ============================================================================
function switchTab(tabName) {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + tabName).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-primary', 'border-b-2', 'border-primary');
        btn.classList.add('text-gray-500');
    });
    const activeTab = document.getElementById('tab-' + tabName);
    activeTab.classList.add('text-primary', 'border-b-2', 'border-primary');
    activeTab.classList.remove('text-gray-500');

    // Records are now displayed in upload view (right panel)
    if (tabName === 'upload') {
        updateStatistics();
        renderRecords();
    }
    if (tabName === 'compare') initCompareView();
}

// Global viewRecord function
window.viewRecord = function(id) {
    const index = state.records.findIndex(r => r.id === id);
    if (index >= 0) {
        state.compareIndex = index;
        state.compareFilter = 'all';
        switchTab('compare');
    }
};
