/**
 * 医疗病例 OCR 识别系统 Pro - 搜索与筛选事件
 * Medical OCR Pro - Search & Filter Events
 */

dom.searchInput.oninput = () => {
    state.pagination.currentPage = 1;
    renderRecords();
};

// ESC key to clear search
dom.searchInput.onkeydown = (e) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        if (dom.searchInput.value) {
            dom.searchInput.value = '';
            state.pagination.currentPage = 1;
            renderRecords();
            showToast('搜索已清除', 'info');
        }
    }
};

dom.filterStatus.onchange = () => {
    state.pagination.currentPage = 1;
    renderRecords();
};
