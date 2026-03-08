/**
 * 医疗病例 AI 识别系统 Pro - 批量操作事件
 * Medical AI Pro - Batch Operation Events
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getSelectedRecordIds() {
    return Array.from(document.querySelectorAll('.record-checkbox:checked:not(#select-all)'))
        .map(cb => String(cb.dataset.id));
}

// ============================================================================
// EXPORT BUTTON
// ============================================================================
document.getElementById('btn-export-all').onclick = exportToExcel;

// ============================================================================
// BATCH REVIEW
// ============================================================================
document.getElementById('btn-batch-review').onclick = async () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    showLoading('正在审核...');

    try {
        // 批量更新数据库状态（一次数据库操作）
        await db.updateStatusMany(ids, 'reviewed');

        // 重新加载当前页
        await loadRecords();
        renderRecords();
        updateSelectedCount();
        dom.selectAll.checked = false;

        // 更新状态统计
        updateStatusCounts();
        updateTodayCount();

        hideLoading();
        showToast(`已审核 ${ids.length} 条记录`);
    } catch (e) {
        hideLoading();
        console.error('Batch review error:', e);
        showToast('批量审核失败: ' + e.message, 'error');
    }
};

// ============================================================================
// BATCH FLAG
// ============================================================================
document.getElementById('btn-batch-flag').onclick = async () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    showLoading('正在标记...');

    try {
        // 批量更新数据库状态（一次数据库操作）
        await db.updateStatusMany(ids, 'flagged');

        // 重新加载当前页
        await loadRecords();
        renderRecords();
        updateSelectedCount();
        dom.selectAll.checked = false;

        // 更新状态统计
        updateStatusCounts();
        updateTodayCount();

        hideLoading();
        showToast(`已标记 ${ids.length} 条记录为需复核`);
    } catch (e) {
        hideLoading();
        console.error('Batch flag error:', e);
        showToast('批量标记失败: ' + e.message, 'error');
    }
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
document.getElementById('btn-batch-delete').onclick = () => {
    const ids = getSelectedRecordIds();
    console.log('Batch delete - IDs:', ids);
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    showDeleteConfirmModal({
        title: '确认批量删除',
        message: `确定要删除选中的 ${ids.length} 条记录吗？`,
        warning: '此操作不可恢复'
    }, async () => {
        try {
            // Delete from database
            const result = await db.deleteMany(ids);
            console.log('Batch delete result:', result);

            // Reload from DB
            await loadRecords();
            renderRecords();

            updateSelectedCount();
            dom.selectAll.checked = false;

            // 更新统计（删除会影响今日数量和状态数量）
            updateTodayCount();
            updateStatusCounts();

            showToast(`已删除 ${ids.length} 条记录`);
        } catch (error) {
            console.error('删除记录失败:', error);
            showToast('删除记录失败: ' + error.message, 'error');
        }
    })
};
