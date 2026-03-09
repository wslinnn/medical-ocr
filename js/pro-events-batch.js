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
// INITIALIZE ON DOM READY
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Export button
    const btnExportAll = document.getElementById('btn-export-all');
    if (btnExportAll) {
        btnExportAll.onclick = exportToExcel;
    }

    // Batch Review
    const btnBatchReview = document.getElementById('btn-batch-review');
    if (btnBatchReview) {
        btnBatchReview.onclick = async () => {
            const ids = getSelectedRecordIds();
            if (ids.length === 0) {
                showToast('请先选择记录', 'warning');
                return;
            }

            showLoading('正在审核...');

            try {
                await db.updateStatusMany(ids, 'reviewed');

                await loadRecords();
                renderRecords();
                updateSelectedCount();
                dom.selectAll.checked = false;

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
    }

    // Batch Flag
    const btnBatchFlag = document.getElementById('btn-batch-flag');
    if (btnBatchFlag) {
        btnBatchFlag.onclick = async () => {
            const ids = getSelectedRecordIds();
            if (ids.length === 0) {
                showToast('请先选择记录', 'warning');
                return;
            }

            showLoading('正在标记...');

            try {
                await db.updateStatusMany(ids, 'flagged');

                await loadRecords();
                renderRecords();
                updateSelectedCount();
                dom.selectAll.checked = false;

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
    }

    // Batch Export
    const btnBatchExport = document.getElementById('btn-batch-export');
    if (btnBatchExport) {
        btnBatchExport.onclick = () => {
            const ids = getSelectedRecordIds();
            if (ids.length === 0) {
                showToast('请先选择记录', 'warning');
                return;
            }

            // Filter records by id
            const selectedRecords = state.records.filter(r => ids.includes(String(r.id)));

            pendingExportRecords = selectedRecords;
            pendingExportFilename = `医疗病例识别_选中_${ids.length}条`;
            document.getElementById('export-count').textContent = ids.length;

            // Clear selection before opening modal
            dom.selectAll.checked = false;
            dom.selectAll.indeterminate = false;
            document.querySelectorAll('.record-checkbox').forEach(cb => cb.checked = false);
            updateSelectedCount();

            // Open modal
            if (window.openModalWithFocus) {
                openModalWithFocus('export-modal');
            } else {
                document.getElementById('export-modal').classList.add('active');
            }
        };
    }

    // Batch Delete
    const btnBatchDelete = document.getElementById('btn-batch-delete');
    if (btnBatchDelete) {
        btnBatchDelete.onclick = () => {
            const ids = getSelectedRecordIds();
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
                    const result = await db.deleteMany(ids);

                    await loadRecords();
                    renderRecords();

                    updateSelectedCount();
                    dom.selectAll.checked = false;

                    updateTodayCount();
                    updateStatusCounts();

                    showToast(`已删除 ${ids.length} 条记录`);
                } catch (error) {
                    console.error('删除记录失败:', error);
                    showToast('删除记录失败: ' + error.message, 'error');
                }
            });
        };
    }
});
