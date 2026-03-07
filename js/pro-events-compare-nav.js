/**
 * 医疗病例 OCR 识别系统 Pro - 对比视图导航事件
 * Medical OCR Pro - Compare View Navigation Events
 */

document.getElementById('btn-compare-prev').onclick = () => {
    if (state.compareIndex > 0) {
        state.compareIndex--;
        updateCompareView();
    }
};

document.getElementById('btn-compare-next').onclick = () => {
    const filtered = getFilteredRecordsForCompare();
    if (state.compareIndex < filtered.length - 1) {
        state.compareIndex++;
        updateCompareView();
    }
};
