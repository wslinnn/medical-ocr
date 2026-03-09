/**
 * 医疗病例 AI 识别系统 Pro - 记录表格模块
 * Medical AI Pro - Records Table Module
 */

// ============================================================================
// RECORDS TABLE RENDERING
// ============================================================================
function renderRecords() {
    const tbody = dom.recordsBody;
    const filteredRecords = state.records;

    // Show appropriate empty state message
    if (filteredRecords.length === 0) {
        const statusFilter = dom.filterStatus ? dom.filterStatus.value : '';
        const searchTerm = dom.searchInput ? dom.searchInput.value : '';

        let emptyMessage = '暂无记录';
        let emptyHint = '';

        if (state.totalRecords === 0) {
            emptyMessage = '暂无记录';
            emptyHint = '请先上传文件进行识别';
        } else if (searchTerm) {
            emptyMessage = '未找到匹配的记录';
            emptyHint = `搜索关键词: "${searchTerm}"`;
        } else if (statusFilter) {
            const statusNames = { pending: '待审核', reviewed: '已审核', flagged: '需复核' };
            emptyMessage = `没有${statusNames[statusFilter]}的记录`;
            emptyHint = '尝试切换其他筛选条件';
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center py-12">
                    <div class="flex flex-col items-center">
                        <p class="text-gray-400 font-medium">${emptyMessage}</p>
                        ${emptyHint ? `<p class="text-sm text-gray-400 mt-1">${emptyHint}</p>` : ''}
                    </div>
                </td>
            </tr>
        `;
        updatePaginationUI(0);
        return;
    }

    const paginatedRecords = filteredRecords;

    const statusBadges = {
        pending: '<span class="status-badge pending">待审核</span>',
        reviewed: '<span class="status-badge reviewed">已审核</span>',
        flagged: '<span class="status-badge flagged">需复核</span>'
    };

    tbody.innerHTML = paginatedRecords.map(r => {
        // Format the parsing time
        const createdAt = r.createdAt ? new Date(r.createdAt) : null;
        const timeStr = createdAt ? createdAt.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';

        return `
        <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0">
            <td class="px-2 py-3 text-center"><input type="checkbox" class="record-checkbox w-4 h-4" data-id="${escapeHtml(r.id)}"></td>
            <td class="px-2 py-3 text-gray-600 font-medium truncate" title="${escapeHtml(r.name)}">${escapeHtml(r.name) || '-'}</td>
            <td class="px-2 py-3 text-gray-600 text-sm truncate" title="${escapeHtml(r.biopsyPathology)}">${escapeHtml(r.biopsyPathology) || '-'}</td>
            <td class="px-2 py-3 text-gray-600 text-sm truncate" title="${escapeHtml(r.tnmStage)}">${escapeHtml(r.tnmStage) || '-'}</td>
            <td class="px-2 py-3 text-gray-600 text-sm truncate" title="${escapeHtml(r.surgeryTime)}">${escapeHtml(r.surgeryTime) || '-'}</td>
            <td class="px-2 py-3 text-gray-600 text-sm truncate" title="${escapeHtml(r.postopPathology)}">${escapeHtml(r.postopPathology) || '-'}</td>
            <td class="px-2 py-3 text-gray-600 text-sm truncate" title="${escapeHtml(r.her2Status)}">${escapeHtml(r.her2Status) || '-'}</td>
            <td class="px-2 py-3 text-gray-600 text-sm truncate" title="${escapeHtml(r.erStatus)}">${escapeHtml(r.erStatus) || '-'}</td>
            <td class="px-2 py-3 text-gray-600 text-sm truncate" title="${escapeHtml(r.ki67)}">${escapeHtml(r.ki67) || '-'}</td>
            <td class="px-2 py-3 text-gray-500 text-xs truncate" title="${escapeHtml(timeStr)}">${escapeHtml(timeStr)}</td>
            <td class="px-2 py-3">${statusBadges[r.status]}</td>
            <td class="px-2 py-3">
                <div class="flex gap-1">
                    <button class="text-primary hover:text-cyan-700 font-medium text-sm" onclick="viewRecord('${escapeHtml(r.id)}')">查看</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.record-checkbox:not(#select-all)').forEach(cb => {
        // 使用 addEventListener 避免累积事件处理器
        cb.addEventListener('change', updateSelectedCount);
    });

    updatePaginationUI(state.totalRecords);
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
    const allCheckboxes = document.querySelectorAll('.record-checkbox:not(#select-all)');
    const checkedBoxes = document.querySelectorAll('.record-checkbox:checked:not(#select-all)');
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
