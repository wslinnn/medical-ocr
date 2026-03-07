/**
 * 医疗病例 OCR 识别系统 Pro - 批量操作事件
 * Medical OCR Pro - Batch Operation Events
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getSelectedRecordIds() {
    return Array.from(document.querySelectorAll('.record-checkbox:checked'))
        .map(cb => Number(cb.dataset.id));
}

// ============================================================================
// EXPORT BUTTON
// ============================================================================
document.getElementById('btn-export-all').onclick = exportToExcel;

// ============================================================================
// BATCH REVIEW
// ============================================================================
document.getElementById('btn-batch-review').onclick = () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    ids.forEach(id => {
        const record = state.records.find(r => r.id === id);
        if (record) record.status = 'reviewed';
    });

    saveRecords();
    renderRecords();
    updateSelectedCount();
    dom.selectAll.checked = false;
    showToast(`已审核 ${ids.length} 条记录`);
};

// ============================================================================
// BATCH FLAG
// ============================================================================
document.getElementById('btn-batch-flag').onclick = () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    ids.forEach(id => {
        const record = state.records.find(r => r.id === id);
        if (record) record.status = 'flagged';
    });

    saveRecords();
    renderRecords();
    updateSelectedCount();
    dom.selectAll.checked = false;
    showToast(`已标记 ${ids.length} 条记录为需复核`);
};

// ============================================================================
// BATCH EXPORT
// ============================================================================
document.getElementById('btn-batch-export').onclick = () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    const selectedRecords = state.records.filter(r => ids.includes(r.id));

    pendingExportRecords = selectedRecords;
    pendingExportFilename = `医疗病例识别_选中_${ids.length}条`;
    document.getElementById('export-count').textContent = selectedRecords.length;

    // Clear selection before opening modal
    dom.selectAll.checked = false;
    dom.selectAll.indeterminate = false;
    updateSelectedCount();

    // Open modal
    if (window.openModalWithFocus) {
        openModalWithFocus('export-modal');
    } else {
        document.getElementById('export-modal').classList.add('active');
    }
};

// ============================================================================
// BATCH DELETE
// ============================================================================
document.getElementById('btn-batch-delete').onclick = async () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    if (confirm(`确定要删除选中的 ${ids.length} 条记录吗？此操作不可恢复。`)) {
        try {
            // Delete from IndexedDB first
            for (const id of ids) {
                await db.delete(id);
            }

            // Then update memory
            state.records = state.records.filter(r => !ids.includes(r.id));

            renderRecords();
            updateRecentResults();
            updateSelectedCount();
            dom.selectAll.checked = false;
            showToast(`已删除 ${ids.length} 条记录`);
        } catch (error) {
            console.error('删除记录失败:', error);
            showToast('删除记录失败: ' + error.message, 'error');
        }
    }
};
