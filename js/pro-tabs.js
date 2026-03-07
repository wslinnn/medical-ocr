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
    if (tabName === 'compare') {
        // Refresh data when switching to compare review page
        // Reload from IndexedDB to ensure we have the latest data
        loadRecords().then(() => {
            renderRecords();
            updateStatistics();
            initCompareView();
        });
    }
}

// Global viewRecord function
window.viewRecord = function(id) {
    state.compareFilter = 'all';
    state.viewRecordId = id; // Store the ID to find after data loads
    switchTab('compare');
};

// Make switchTab async for better control
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
                const index = state.records.findIndex(r => r.id === state.viewRecordId);
                if (index >= 0) {
                    state.compareIndex = index;
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
        }
    }
}
