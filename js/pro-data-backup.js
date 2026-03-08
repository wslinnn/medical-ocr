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

        // 导入数据库
        const importResult = await window.sqliteDB.importDb(filePath);

        if (importResult.success) {
            // 重新加载数据
            await db.init();
            const records = await db.getAll();
            state.records = records || [];
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
    }

    // 关闭下拉菜单
    document.getElementById('data-menu-dropdown').classList.add('hidden');
};

// ============================================================================
// CLEAR ALL DATA
// ============================================================================
document.getElementById('btn-clear-all').onclick = () => {
    if (state.records.length === 0) {
        showToast('暂无数据可清空', 'warning');
        return;
    }

    const count = state.records.length;
    // Show custom confirmation modal
    showClearConfirmModal(count);
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

// Confirm delete button
document.getElementById('btn-clear-confirm-delete').onclick = async () => {
    const count = state.records.length;

    try {
        // Clear IndexedDB storage
        await db.clear();

        // Clear all records in memory
        state.records = [];

        renderRecords();

        // Close modal
        if (window.closeModalWithFocus) {
            closeModalWithFocus('clear-confirm-modal');
        } else {
            document.getElementById('clear-confirm-modal').classList.remove('active');
        }

        // Hide dropdown
        document.getElementById('data-menu-dropdown').classList.add('hidden');

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
