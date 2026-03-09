/**
 * 医疗病例 AI 识别系统 Pro - 数据管理模块
 * Medical AI Pro - Data Management Module
 */

// ============================================================================
// DATA MANAGEMENT MENU
// ============================================================================
const dataMenuDropdown = document.getElementById('data-menu-dropdown');

document.getElementById('btn-data-menu').onclick = (e) => {
    e.stopPropagation();
    dataMenuDropdown.classList.toggle('hidden');
};

document.addEventListener('click', () => {
    dataMenuDropdown.classList.add('hidden');
});

dataMenuDropdown.onclick = (e) => e.stopPropagation();

// ============================================================================
// IMPORT DATABASE
// ============================================================================
document.getElementById('btn-import-db').onclick = async () => {
    try {
        // 打开文件选择对话框
        const result = await window.sqliteDB.showOpenDialog({
            title: '选择数据库文件',
            filters: [{ name: 'SQLite Database', extensions: ['db'] }]
        });

        if (result.canceled || !result.filePaths.length) {
            return;
        }

        const filePath = result.filePaths[0];

        // 显示加载状态
        showLoading('正在导入数据...');

        // 导入数据库
        const importResult = await window.sqliteDB.importDb(filePath);

        if (importResult.success) {
            // 重新加载当前页数据（不分加载全部，避免内存问题）
            await db.init();
            state.pagination.currentPage = 1;
            await loadRecords();
            renderRecords();
            updateStatistics();

            if (importResult.count !== undefined && importResult.count > 0) {
                showToast(`成功导入 ${importResult.count} 条记录`);
            } else if (importResult.message) {
                showToast(importResult.message, 'info');
            } else {
                showToast('导入成功');
            }
        } else {
            showToast('导入失败: ' + importResult.error, 'error');
        }
    } catch (error) {
        console.error('导入数据库失败:', error);
        showToast('导入失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }

    // 关闭下拉菜单
    document.getElementById('data-menu-dropdown').classList.add('hidden');
};

// ============================================================================
// CLEAR ALL DATA
// ============================================================================
document.getElementById('btn-clear-all').onclick = async () => {
    // 从数据库获取真实总数
    const totalCount = await db.getCount();
    if (totalCount === 0) {
        showToast('暂无数据可清空', 'warning');
        return;
    }

    // 显示确认对话框，使用真实总数
    showClearConfirmModal(totalCount);
};

// ============================================================================
// CLEAR CONFIRMATION MODAL
// ============================================================================
function showClearConfirmModal(count) {
    // Update the count display
    document.getElementById('clear-record-count').textContent = count;

    // Show the modal
    if (window.openModalWithFocus) {
        openModalWithFocus('clear-confirm-modal');
    } else {
        document.getElementById('clear-confirm-modal').classList.add('active');
    }
}

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================
let pendingDeleteCallback = null;

function showDeleteConfirmModal(options, onConfirm) {
    const { title, message, warning, count } = options;

    // Update modal content
    if (title) document.getElementById('delete-confirm-title').textContent = title;
    if (message) document.getElementById('delete-confirm-message').textContent = message;
    if (warning) document.getElementById('delete-confirm-warning').textContent = warning;

    // Store callback
    pendingDeleteCallback = onConfirm;

    // Show modal
    if (window.openModalWithFocus) {
        openModalWithFocus('delete-confirm-modal');
    } else {
        document.getElementById('delete-confirm-modal').classList.add('active');
    }
}

// Cancel button
document.getElementById('btn-delete-cancel').onclick = () => {
    if (window.closeModalWithFocus) {
        closeModalWithFocus('delete-confirm-modal');
    } else {
        document.getElementById('delete-confirm-modal').classList.remove('active');
    }
    pendingDeleteCallback = null;
};

// Confirm delete button
document.getElementById('btn-delete-confirm').onclick = async () => {
    if (pendingDeleteCallback) {
        try {
            await pendingDeleteCallback();
        } catch (e) {
            console.error('删除失败:', e);
            showToast('删除失败: ' + e.message, 'error');
        }
    }

    if (window.closeModalWithFocus) {
        closeModalWithFocus('delete-confirm-modal');
    } else {
        document.getElementById('delete-confirm-modal').classList.remove('active');
    }
    pendingDeleteCallback = null;
};

// Confirm delete button
document.getElementById('btn-clear-confirm-delete').onclick = async () => {
    // 从页面显示的count获取（对话框中显示的数量）
    const countEl = document.getElementById('clear-record-count');
    const count = countEl ? parseInt(countEl.textContent) || 0 : 0;

    try {
        // Clear database storage
        await db.clear();

        // Clear all records in memory
        state.records = [];
        state.totalRecords = 0;
        state.pagination.currentPage = 1;
        state.pagination.total = 0;

        renderRecords();

        // Close modal
        if (window.closeModalWithFocus) {
            closeModalWithFocus('clear-confirm-modal');
        } else {
            document.getElementById('clear-confirm-modal').classList.remove('active');
        }

        // Hide dropdown
        document.getElementById('data-menu-dropdown').classList.add('hidden');

        // 更新统计（清空会影响所有数量）
        updateTodayCount();
        updateStatusCounts();

        showToast(`已清空 ${count} 条记录`, 'info');
    } catch (error) {
        console.error('清空数据失败:', error);
        showToast('清空数据失败: ' + error.message, 'error');
    }
};

// Cancel button
document.getElementById('btn-clear-cancel').onclick = () => {
    // Close modal
    if (window.closeModalWithFocus) {
        closeModalWithFocus('clear-confirm-modal');
    } else {
        document.getElementById('clear-confirm-modal').classList.remove('active');
    }
};

// Backup first button (no longer needed - just close modal)
document.getElementById('btn-clear-backup-first')?.remove();
