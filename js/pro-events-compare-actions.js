/**
 * 医疗病例 OCR 识别系统 Pro - 对比视图操作按钮事件
 * Medical OCR Pro - Compare View Action Button Events
 */

document.getElementById('btn-compare-flag').onclick = () => {
    const record = getCurrentCompareRecord();
    if (record) {
        record.status = 'flagged';
        saveRecords();

        const filtered = getFilteredRecordsForCompare();
        if (state.compareIndex < filtered.length - 1) {
            state.compareIndex++;
        }

        updateCompareView();
        showToast('已标记为需复核', 'info');
    }
};

document.getElementById('btn-compare-review').onclick = () => {
    const record = getCurrentCompareRecord();
    if (record) {
        record.status = 'reviewed';
        saveRecords();

        const filtered = getFilteredRecordsForCompare();
        if (state.compareIndex < filtered.length - 1) {
            state.compareIndex++;
        }

        updateCompareView();
        showToast('已确认审核');
    }
};
