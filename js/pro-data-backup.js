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
        version: '1.0',
        exportedAt: new Date().toISOString(),
        recordCount: state.records.length,
        records: state.records.map(r => ({
            id: r.id,
            fileName: r.fileName,
            name: r.name,
            gender: r.gender,
            age: r.age,
            diagnosis: r.diagnosis,
            stage: r.stage,
            originalText: r.originalText,
            status: r.status,
            createdAt: r.createdAt,
            imageData: r.status === 'reviewed' ? r.imageData : null
        }))
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
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

document.getElementById('import-file-input').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (!data.records || !Array.isArray(data.records)) {
                throw new Error('无效的备份文件格式');
            }

            const importCount = data.records.length;
            const mode = confirm(
                `检测到备份文件包含 ${importCount} 条记录。\n\n` +
                `点击"确定"追加到现有数据，点击"取消"替换所有数据。`
            ) ? 'append' : 'replace';

            if (mode === 'replace') {
                state.records = data.records;
            } else {
                const existingIds = new Set(state.records.map(r => r.id));
                const newRecords = data.records.filter(r => !existingIds.has(r.id));
                state.records = [...state.records, ...newRecords];
            }

            saveRecords();
            renderRecords();
            updateRecentResults();

            showToast(`成功导入 ${mode === 'replace' ? importCount : newRecords.length} 条记录`);
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
document.getElementById('btn-clear-confirm-delete').onclick = () => {
    const count = state.records.length;

    // Clear all records
    state.records = [];
    saveRecords();
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
