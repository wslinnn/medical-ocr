/**
 * 医疗病例 AI 识别系统 Pro - 分页事件
 * Medical AI Pro - Pagination Events
 */

document.getElementById('btn-page-first').onclick = () => {
    state.pagination.currentPage = 1;
    loadRecords().then(renderRecords);
};

document.getElementById('btn-page-prev').onclick = () => {
    if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        loadRecords().then(renderRecords);
    }
};

document.getElementById('btn-page-next').onclick = () => {
    const totalPages = state.pagination.totalPages;
    if (totalPages > 0 && state.pagination.currentPage < totalPages) {
        state.pagination.currentPage++;
        loadRecords().then(renderRecords);
    }
};

document.getElementById('btn-page-last').onclick = () => {
    const totalPages = state.pagination.totalPages;
    if (totalPages > 0) {
        state.pagination.currentPage = totalPages;
        loadRecords().then(renderRecords);
    }
};

document.getElementById('page-jump').onchange = (e) => {
    let page = parseInt(e.target.value);
    const totalPages = state.pagination.totalPages;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    state.pagination.currentPage = page;
    loadRecords().then(renderRecords);
};
