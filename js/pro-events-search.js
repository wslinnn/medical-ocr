/**
 * 医疗病例 AI 识别系统 Pro - 搜索与筛选事件
 * Medical AI Pro - Search & Filter Events
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// 清除选择状态
function clearSelection() {
    if (dom.selectAll) {
        dom.selectAll.checked = false;
        dom.selectAll.indeterminate = false;
    }
    document.querySelectorAll('.record-checkbox').forEach(cb => {
        cb.checked = false;
    });
    const batchBar = document.getElementById('batch-actions-bar');
    if (batchBar) {
        batchBar.classList.add('hidden');
    }
}

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (dom.searchInput) {
        dom.searchInput.oninput = () => {
            clearSelection();
            state.pagination.currentPage = 1;
            loadRecords().then(renderRecords);
        };

        // ESC key to clear search
        dom.searchInput.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (dom.searchInput.value) {
                    dom.searchInput.value = '';
                    clearSelection();
                    state.pagination.currentPage = 1;
                    loadRecords().then(renderRecords);
                    showToast('搜索已清除', 'info');
                }
            }
        };
    }

    if (dom.filterStatus) {
        dom.filterStatus.onchange = () => {
            clearSelection();
            state.pagination.currentPage = 1;
            loadRecords().then(renderRecords);
        };
    }

    console.log('Search events initialized');
});
