/**
 * 医疗病例 AI 识别系统 Pro - 标签页导航模块
 * Medical AI Pro - Tab Navigation Module
 */

// ============================================================================
// TAB NAVIGATION
// ============================================================================
async function switchTab(tabName) {
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
    if (tabName === 'compare') {
        // Refresh data when switching to compare review page
        try {
            // Ensure database is initialized
            await db.init();
            // Reload records from database to get latest data
            const records = await db.getAll();
            state.records = records || [];

            renderRecords();
            updateStatistics();

            // If viewing a specific record, find its index
            if (state.viewRecordId) {
                // Compare as strings to handle both string and number IDs
                const viewId = String(state.viewRecordId);
                const index = state.records.findIndex(r => String(r.id) === viewId);
                if (index >= 0) {
                    state.compareIndex = index;
                } else {
                    // Record not found, reset to first record
                    state.compareIndex = 0;
                }
                state.viewRecordId = null;
            } else if (state.records.length > 0) {
                // If no specific record requested and index is invalid, set to first record
                if (state.compareIndex < 0 || state.compareIndex >= state.records.length) {
                    state.compareIndex = 0;
                }
            }

            initCompareView();
        } catch (e) {
            console.error('切换到对比审核页时出错:', e);
            showToast('加载数据失败: ' + e.message, 'error');
        }
    }
}

// Global viewRecord function
window.viewRecord = function(id) {
    state.compareFilter = 'all';
    state.viewRecordId = String(id); // Store the ID as string to find after data loads
    switchTab('compare');
};
