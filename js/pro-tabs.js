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
        // 使用分页查询，加载当前页数据
        state.pagination.currentPage = 1;
        await loadRecords();
        renderRecords();
        updateStatistics();
    }
    if (tabName === 'compare') {
        // 刷新数据，切换到对比审核页面
        try {
            // 确保数据库已初始化
            await db.init();

            // 重置任务块索引
            state.compareCurrentBlock = 0;
            state.compareIndex = 0;

            // 使用任务块模式查询，每块20条
            // pending: 待审核, flagged: 需复审, reviewed: 已审核
            const statusFilter = state.compareFilter || 'pending';
            const blockSize = state.compareBlockSize;

            const result = await db.getPaginatedWithImage({
                page: 1,
                pageSize: blockSize,
                search: '',
                status: statusFilter
            });

            // 更新分页状态
            state.comparePagination.total = result.total || 0;
            state.comparePagination.hasMore = result.records.length < result.total;

            state.records = result.records || [];
            state.totalRecords = result.total || 0;

            renderRecords();
            updateStatistics();

            // 如果查看指定记录，找到其索引
            if (state.viewRecordId) {
                const viewId = String(state.viewRecordId);
                const index = state.records.findIndex(r => String(r.id) === viewId);
                if (index >= 0) {
                    state.compareIndex = index;
                } else {
                    state.compareIndex = 0;
                }
                state.viewRecordId = null;
            } else if (state.records.length > 0) {
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
    state.compareFilter = 'pending'; // Default to pending filter
    state.viewRecordId = String(id); // Store the ID as string to find after data loads
    switchTab('compare');
};
