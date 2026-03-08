/**
 * 医疗病例 AI 识别系统 Pro - 对比视图筛选事件
 * Medical AI Pro - Compare View Filter Events
 */

document.getElementById('compare-filter-all').onclick = () => {
    state.compareFilter = 'all';
    state.compareIndex = 0;
    updateCompareView();
    updateCompareFilterButtons();
};

document.getElementById('compare-filter-flagged').onclick = () => {
    state.compareFilter = 'flagged';
    state.compareIndex = 0;
    updateCompareView();
    updateCompareFilterButtons();
};

document.getElementById('compare-filter-reviewed').onclick = () => {
    state.compareFilter = 'reviewed';
    state.compareIndex = 0;
    updateCompareView();
    updateCompareFilterButtons();
};

function updateCompareFilterButtons() {
    document.getElementById('compare-filter-all').className = 'filter-btn' + (state.compareFilter === 'all' ? ' active' : '');
    document.getElementById('compare-filter-flagged').className = 'filter-btn' + (state.compareFilter === 'flagged' ? ' active' : '');
    document.getElementById('compare-filter-reviewed').className = 'filter-btn' + (state.compareFilter === 'reviewed' ? ' active' : '');
}

function getFilteredRecordsForCompare() {
    let filtered = [...state.records];
    if (state.compareFilter === 'flagged') {
        filtered = state.records.filter(r => r.status === 'flagged' || r.status === 'pending');
    } else if (state.compareFilter === 'reviewed') {
        filtered = state.records.filter(r => r.status === 'reviewed');
    }
    return filtered;
}

function getCurrentCompareRecord() {
    const filtered = getFilteredRecordsForCompare();
    return filtered[state.compareIndex] || null;
}
