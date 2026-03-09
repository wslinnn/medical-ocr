/**
 * 医疗病例 AI 识别系统 Pro - 分页事件
 * Medical AI Pro - Pagination Events
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
    // 清除所有行的选择框
    document.querySelectorAll('.record-checkbox').forEach(cb => {
        cb.checked = false;
    });
    // 隐藏批量操作栏
    const batchBar = document.getElementById('batch-actions-bar');
    if (batchBar) {
        batchBar.classList.add('hidden');
    }
}

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnPageFirst = document.getElementById('btn-page-first');
    const btnPagePrev = document.getElementById('btn-page-prev');
    const btnPageNext = document.getElementById('btn-page-next');
    const btnPageLast = document.getElementById('btn-page-last');
    const pageJump = document.getElementById('page-jump');

    if (btnPageFirst) {
        btnPageFirst.onclick = () => {
            clearSelection();
            state.pagination.currentPage = 1;
            loadRecords().then(renderRecords);
        };
    }

    if (btnPagePrev) {
        btnPagePrev.onclick = () => {
            if (state.pagination.currentPage > 1) {
                clearSelection();
                state.pagination.currentPage--;
                loadRecords().then(renderRecords);
            }
        };
    }

    if (btnPageNext) {
        btnPageNext.onclick = () => {
            const totalPages = state.pagination.totalPages;
            if (totalPages > 0 && state.pagination.currentPage < totalPages) {
                clearSelection();
                state.pagination.currentPage++;
                loadRecords().then(renderRecords);
            }
        };
    }

    if (btnPageLast) {
        btnPageLast.onclick = () => {
            const totalPages = state.pagination.totalPages;
            if (totalPages > 0) {
                clearSelection();
                state.pagination.currentPage = totalPages;
                loadRecords().then(renderRecords);
            }
        };
    }

    if (pageJump) {
        pageJump.onchange = (e) => {
            let page = parseInt(e.target.value);
            const totalPages = state.pagination.totalPages;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            clearSelection();
            state.pagination.currentPage = page;
            loadRecords().then(renderRecords);
        };
    }

    console.log('Pagination events initialized');
});
