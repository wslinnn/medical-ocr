/**
 * 医疗病例 OCR 识别系统 Pro - 记录表格模块
 * Medical OCR Pro - Records Table Module
 */

// ============================================================================
// RECORDS TABLE RENDERING
// ============================================================================
function renderRecords() {
    const tbody = dom.recordsBody;
    const statusFilter = dom.filterStatus ? dom.filterStatus.value : '';

    let filteredRecords = state.records;
    if (statusFilter) {
        filteredRecords = state.records.filter(r => r.status === statusFilter);
    }

    const searchTerm = dom.searchInput ? dom.searchInput.value.toLowerCase() : '';
    if (searchTerm) {
        filteredRecords = filteredRecords.filter(r =>
            r.name.toLowerCase().includes(searchTerm) ||
            r.diagnosis.toLowerCase().includes(searchTerm)
        );
    }

    if (state.pagination.currentPage > Math.ceil(filteredRecords.length / state.pagination.pageSize)) {
        state.pagination.currentPage = 1;
    }

    // Show appropriate empty state message
    if (filteredRecords.length === 0) {
        let emptyMessage = '暂无记录';
        let emptyHint = '';

        if (state.records.length === 0) {
            emptyMessage = '暂无记录';
            emptyHint = '请先上传文件进行识别';
        } else if (searchTerm) {
            emptyMessage = '未找到匹配的记录';
            emptyHint = `搜索关键词: "${dom.searchInput.value}"`;
        } else if (statusFilter) {
            const statusNames = { pending: '待审核', reviewed: '已审核', flagged: '需复核' };
            emptyMessage = `没有${statusNames[statusFilter]}的记录`;
            emptyHint = '尝试切换其他筛选条件';
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-12">
                    <div class="flex flex-col items-center">
                        <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p class="text-gray-400 font-medium">${emptyMessage}</p>
                        ${emptyHint ? `<p class="text-sm text-gray-400 mt-1">${emptyHint}</p>` : ''}
                    </div>
                </td>
            </tr>
        `;
        updatePaginationUI(0);
        return;
    }

    const totalPages = Math.ceil(filteredRecords.length / state.pagination.pageSize);
    const start = (state.pagination.currentPage - 1) * state.pagination.pageSize;
    const end = Math.min(start + state.pagination.pageSize, filteredRecords.length);
    const paginatedRecords = filteredRecords.slice(start, end);

    const statusBadges = {
        pending: '<span class="status-badge pending">待审核</span>',
        reviewed: '<span class="status-badge reviewed">已审核</span>',
        flagged: '<span class="status-badge flagged">需复核</span>'
    };

    tbody.innerHTML = paginatedRecords.map(r => `
        <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0">
            <td class="px-4 py-3 text-center"><input type="checkbox" class="record-checkbox w-4 h-4" data-id="${r.id}"></td>
            <td class="px-4 py-3 text-gray-600">${r.gender}</td>
            <td class="px-4 py-3 text-gray-600">${r.age}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs truncate" title="${r.diagnosis}">${r.diagnosis}</td>
            <td class="px-4 py-3 text-gray-600">${r.stage}</td>
            <td class="px-4 py-3">${statusBadges[r.status]}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${new Date(r.createdAt).toLocaleString('zh-CN')}</td>
            <td class="px-4 py-3">
                <button class="text-primary hover:text-cyan-700 font-medium" onclick="viewRecord(${r.id})">查看</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.record-checkbox').forEach(cb => {
        cb.onchange = updateSelectedCount;
    });

    updatePaginationUI(filteredRecords.length);
}

// ============================================================================
// PAGINATION UI
// ============================================================================
function updatePaginationUI(totalRecords) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    if (totalRecords === 0) {
        paginationContainer.classList.add('hidden');
        return;
    }

    paginationContainer.classList.remove('hidden');

    const totalPages = Math.ceil(totalRecords / state.pagination.pageSize);
    const currentPage = state.pagination.currentPage;
    const start = (currentPage - 1) * state.pagination.pageSize + 1;
    const end = Math.min(currentPage * state.pagination.pageSize, totalRecords);

    document.getElementById('pagination-start').textContent = start;
    document.getElementById('pagination-end').textContent = end;
    document.getElementById('pagination-total').textContent = totalRecords;
    document.getElementById('pagination-total-pages').textContent = totalPages;
    document.getElementById('page-jump').value = currentPage;
    document.getElementById('page-jump').max = totalPages;

    document.getElementById('btn-page-first').disabled = currentPage === 1;
    document.getElementById('btn-page-prev').disabled = currentPage === 1;
    document.getElementById('btn-page-next').disabled = currentPage === totalPages;
    document.getElementById('btn-page-last').disabled = currentPage === totalPages;
}

function updateSelectedCount() {
    const allCheckboxes = document.querySelectorAll('.record-checkbox');
    const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
    const selectedCount = checkedBoxes.length;
    const totalCount = allCheckboxes.length;

    const batchBar = document.getElementById('batch-actions-bar');
    const countEl = document.getElementById('selected-count');
    const selectAllCheckbox = dom.selectAll;

    if (selectedCount > 0) {
        batchBar.classList.remove('hidden');
        countEl.textContent = `已选择 ${selectedCount} 项`;
    } else {
        batchBar.classList.add('hidden');
    }

    // Sync select all checkbox state
    if (totalCount > 0) {
        if (selectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === totalCount) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}
