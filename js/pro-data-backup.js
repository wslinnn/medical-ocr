/**
 * 医疗病例 OCR 识别系统 Pro - 数据备份与导入模块
 * Medical OCR Pro - Data Backup & Import Module
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
// BACKUP
// ============================================================================
document.getElementById('btn-backup').onclick = () => {
    if (state.records.length === 0) {
        showToast('暂无数据可备份', 'warning');
        return;
    }

    const backupData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        recordCount: state.records.length,
        records: state.records.map(r => ({
            id: r.id,
            fileName: r.fileName,
            name: r.name || '未检出',
            biopsyPathology: r.biopsyPathology || '未检出',
            tnmStage: r.tnmStage || '待查',
            surgeryTime: r.surgeryTime || '未检出',
            postopPathology: r.postopPathology || '未检出',
            her2Status: r.her2Status || '待查',
            erStatus: r.erStatus || '待查',
            ki67: r.ki67 || '待查',
            originalText: r.originalText || '',
            status: r.status,
            createdAt: r.createdAt,
            // 导出所有有图片的记录，不限制状态
            imageData: r.imageData || null
        }))
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString();
    link.href = URL.createObjectURL(blob);
    link.download = `医疗病例识别_备份_${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast(`已备份 ${state.records.length} 条记录`);
};

// ============================================================================
// IMPORT
// ============================================================================
document.getElementById('btn-import').onclick = () => {
    document.getElementById('import-file-input').click();
};

document.getElementById('import-file-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Ensure database is initialized
    await db.init();

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (!data.records || !Array.isArray(data.records)) {
                throw new Error('无效的备份文件格式');
            }

            const importCount = data.records.length;

            // Always append mode - add new records that don't already exist
            const existingIds = new Set(state.records.map(r => r.id));
            const newRecords = data.records.filter(r => !existingIds.has(r.id));
            state.records = [...state.records, ...newRecords];

            // Save to IndexedDB
            await db.saveAll(newRecords);
            renderRecords();
            updateRecentResults();

            showToast(`成功导入 ${newRecords.length} 条记录（跳过 ${importCount - newRecords.length} 条重复）`);
        } catch (error) {
            console.error('导入失败:', error);
            showToast('导入失败: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);
    e.target.value = '';
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

// Backup first button
document.getElementById('btn-clear-backup-first').onclick = () => {
    // Close modal and trigger backup
    if (window.closeModalWithFocus) {
        closeModalWithFocus('clear-confirm-modal');
    } else {
        document.getElementById('clear-confirm-modal').classList.remove('active');
    }

    // Trigger backup
    setTimeout(() => {
        document.getElementById('btn-backup').click();
    }, 100);
};

// Confirm delete button
document.getElementById('btn-clear-confirm-delete').onclick = async () => {
    const count = state.records.length;

    try {
        // Clear IndexedDB storage
        await db.clear();

        // Clear all records in memory
        state.records = [];

        renderRecords();
        updateRecentResults();

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
