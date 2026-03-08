/**
 * 医疗病例 AI 识别系统 Pro - 对比视图导航事件
 * Medical AI Pro - Compare View Navigation Events
 */

document.getElementById('btn-compare-prev').onclick = () => {
    if (state.compareIndex > 0) {
        state.compareIndex--;
        updateCompareView();
    } else {
        showToast('已经是第一条记录了', 'info');
    }
};

document.getElementById('btn-compare-next').onclick = () => {
    const filtered = getFilteredRecordsForCompare();
    if (state.compareIndex < filtered.length - 1) {
        state.compareIndex++;
        updateCompareView();
    } else {
        showToast('没有更多记录了', 'info');
    }
};
