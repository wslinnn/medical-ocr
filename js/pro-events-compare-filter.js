/**
 * 医疗病例 AI 识别系统 Pro - 对比视图筛选事件
 * Medical AI Pro - Compare View Filter Events
 */

// 重新加载对比审核数据（任务块模式）
async function reloadCompareData() {
    showLoading('加载数据...');
    try {
        // 重置到第一块
        state.compareCurrentBlock = 0;
        state.compareIndex = 0;

        // pending: 待审核, flagged: 需复审, reviewed: 已审核
        const statusFilter = state.compareFilter;
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
        updateCompareView();
        updateCompareFilterButtons();
        updateCompareButtonsVisibility();
        updateStatistics();

        hideLoading();
    } catch (e) {
        console.error('重新加载对比数据失败:', e);
        hideLoading();
        showToast('加载数据失败: ' + e.message, 'error');
    }
}

document.getElementById('compare-filter-pending').onclick = async () => {
    state.compareFilter = 'pending';
    await reloadCompareData();
};

document.getElementById('compare-filter-flagged').onclick = async () => {
    state.compareFilter = 'flagged';
    await reloadCompareData();
};

document.getElementById('compare-filter-reviewed').onclick = async () => {
    state.compareFilter = 'reviewed';
    await reloadCompareData();
};

function updateCompareFilterButtons() {
    document.getElementById('compare-filter-pending').className = 'filter-btn' + (state.compareFilter === 'pending' ? ' active' : '');
    document.getElementById('compare-filter-flagged').className = 'filter-btn' + (state.compareFilter === 'flagged' ? ' active' : '');
    document.getElementById('compare-filter-reviewed').className = 'filter-btn' + (state.compareFilter === 'reviewed' ? ' active' : '');
}

function getCurrentCompareRecord() {
    return state.records[state.compareIndex] || null;
}
