/**
 * 医疗病例 OCR 识别系统 Pro - 分页事件
 * Medical OCR Pro - Pagination Events
 */

document.getElementById('btn-page-first').onclick = () => {
    state.pagination.currentPage = 1;
    renderRecords();
};

document.getElementById('btn-page-prev').onclick = () => {
    if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        renderRecords();
    }
};

document.getElementById('btn-page-next').onclick = () => {
    const totalPages = state.pagination.totalPages;
    if (totalPages > 0 && state.pagination.currentPage < totalPages) {
        state.pagination.currentPage++;
        renderRecords();
    }
};

document.getElementById('btn-page-last').onclick = () => {
    const totalPages = state.pagination.totalPages;
    if (totalPages > 0) {
        state.pagination.currentPage = totalPages;
        renderRecords();
    }
};

document.getElementById('page-jump').onchange = (e) => {
    let page = parseInt(e.target.value);
    const totalPages = state.pagination.totalPages;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    state.pagination.currentPage = page;
    renderRecords();
};
