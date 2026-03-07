/**
 * 医疗病例 OCR 识别系统 Pro - 对比视图操作按钮事件
 * Medical OCR Pro - Compare View Action Button Events
 */

// Helper to check if record would be removed from current filter after status change
function willRecordBeRemovedFromFilter(oldStatus, newStatus) {
    if (state.compareFilter === 'all') return false; // Never removed from "all"

    if (state.compareFilter === 'flagged') {
        // Filter shows: flagged OR pending
        // Record is removed if it becomes something else (e.g., reviewed)
        const wasInFilter = oldStatus === 'flagged' || oldStatus === 'pending';
        const isInFilter = newStatus === 'flagged' || newStatus === 'pending';
        return wasInFilter && !isInFilter;
    }

    if (state.compareFilter === 'reviewed') {
        // Filter shows: only reviewed
        // Record is removed if it becomes something else
        return oldStatus === 'reviewed' && newStatus !== 'reviewed';
    }

    return false;
}

document.getElementById('btn-compare-flag').onclick = () => {
    const record = getCurrentCompareRecord();
    if (record) {
        const oldStatus = record.status;
        record.status = 'flagged';
        saveRecords();

        // Refresh the records table in the background
        renderRecords();

        // Get the new filtered list after status change
        const filtered = getFilteredRecordsForCompare();

        // Only increment if record stays in current filter
        if (!willRecordBeRemovedFromFilter(oldStatus, 'flagged')) {
            if (state.compareIndex < filtered.length - 1) {
                state.compareIndex++;
            }
        } else {
            // Record was removed, list shifted, ensure index is valid
            if (state.compareIndex >= filtered.length) {
                state.compareIndex = Math.max(0, filtered.length - 1);
            }
        }

        updateCompareView();
        showToast('已标记为需复核', 'info');
    }
};

document.getElementById('btn-compare-review').onclick = () => {
    const record = getCurrentCompareRecord();
    if (record) {
        const oldStatus = record.status;
        record.status = 'reviewed';
        saveRecords();

        // Refresh the records table in the background
        renderRecords();

        // Get the new filtered list after status change
        const filtered = getFilteredRecordsForCompare();

        // Only increment if record stays in current filter
        if (!willRecordBeRemovedFromFilter(oldStatus, 'reviewed')) {
            if (state.compareIndex < filtered.length - 1) {
                state.compareIndex++;
            }
        } else {
            // Record was removed, list shifted, ensure index is valid
            if (state.compareIndex >= filtered.length) {
                state.compareIndex = Math.max(0, filtered.length - 1);
            }
        }

        updateCompareView();
        showToast('已确认审核');
    }
};
