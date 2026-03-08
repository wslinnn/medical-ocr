/**
 * 医疗病例 AI 识别系统 Pro - 键盘快捷键事件处理
 * Medical AI Pro - Keyboard Shortcuts Event Handlers
 */

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

// Toggle shortcuts sidebar
function toggleShortcuts() {
    const sidebar = document.getElementById('shortcuts-sidebar');
    const overlay = document.getElementById('shortcuts-overlay');
    if (!sidebar) return;

    if (sidebar.classList.contains('translate-x-full')) {
        sidebar.classList.remove('translate-x-full');
        overlay?.classList.remove('hidden');
    } else {
        sidebar.classList.add('translate-x-full');
        overlay?.classList.add('hidden');
    }
}

// Add F1 to open shortcuts
document.addEventListener('keydown', (e) => {
    // F1 - Open shortcuts sidebar
    if (e.key === 'F1') {
        e.preventDefault();
        toggleShortcuts();
        return;
    }

    // Ignore other shortcuts when typing in input fields
    if (e.target.matches('input, textarea, [contenteditable]')) return;

    const currentTab = document.querySelector('.tab-btn.text-primary')?.id;

    // ============================================================================
    // ARROW KEYS - Compare View Navigation
    // ============================================================================
    if (e.key === 'ArrowLeft' && currentTab === 'tab-compare') {
        document.getElementById('btn-compare-prev').click();
        return;
    }

    if (e.key === 'ArrowRight' && currentTab === 'tab-compare') {
        document.getElementById('btn-compare-next').click();
        return;
    }

    // ============================================================================
    // ESC - Close Modals
    // ============================================================================
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        return;
    }

    // ============================================================================
    // CTRL+E - Export
    // ============================================================================
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportToExcel();
        return;
    }

    // ============================================================================
    // CTRL+F - Focus Search
    // ============================================================================
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        dom.searchInput.focus();
        return;
    }

    // ============================================================================
    // CTRL+1/2 - Switch Tabs
    // ============================================================================
    if (e.ctrlKey && e.key >= '1' && e.key <= '2') {
        e.preventDefault();
        const tabs = ['upload', 'compare'];
        switchTab(tabs[parseInt(e.key) - 1]);
        return;
    }

    // ============================================================================
    // CTRL+ENTER - Confirm Review (Compare View)
    // ============================================================================
    if (e.ctrlKey && e.key === 'Enter' && currentTab === 'tab-compare') {
        e.preventDefault();
        document.getElementById('btn-compare-review').click();
        return;
    }

    // ============================================================================
    // SHIFT+F - Flag for Review (Compare View)
    // ============================================================================
    if (e.shiftKey && e.key === 'F' && currentTab === 'tab-compare') {
        e.preventDefault();
        document.getElementById('btn-compare-flag').click();
        return;
    }

    // ============================================================================
    // DELETE - Delete Current Record (Compare View)
    // ============================================================================
    // Require Shift+Delete to prevent accidental deletion
    if (e.key === 'Delete' && currentTab === 'tab-compare') {
        e.preventDefault(); // Prevent browser's default behavior

        const record = getCurrentCompareRecord();
        if (!record) return;

        // Only allow deletion with Shift+Delete for safety
        if (!e.shiftKey) {
            showToast('提示: 按 Shift+Delete 可删除当前记录', 'info');
            return;
        }

        // Show detailed confirmation dialog
        const message = `⚠️ 危险操作：删除记录\n\n` +
                       `即将删除以下记录：\n` +
                       `• 姓名: ${record.name}\n` +
                       `• 诊断: ${record.diagnosis}\n` +
                       `• 日期: ${new Date(record.createdAt).toLocaleString('zh-CN')}\n\n` +
                       `此操作不可恢复！确定要删除吗？`;

        if (confirm(message)) {
            const filtered = getFilteredRecordsForCompare();
            state.records = state.records.filter(r => r.id !== record.id);

            // Adjust compareIndex if needed
            if (state.compareIndex >= filtered.length) {
                state.compareIndex = Math.max(0, filtered.length - 1);
            }

            saveRecords();
            updateCompareView();
            
            showToast('记录已永久删除', 'warning');
        }
        return;
    }

    // ============================================================================
    // CTRL+0 - Reset Zoom (Compare View)
    // ============================================================================
    if (e.ctrlKey && e.key === '0' && currentTab === 'tab-compare') {
        e.preventDefault();
        state.imageOffsetX = 0;
        state.imageOffsetY = 0;
        state.imageZoom = 100;
        state.imageRotation = 0;
        updateCompareView();
        return;
    }

    // ============================================================================
    // CTRL++ / CTRL+- - Zoom In/Out (Compare View)
    // ============================================================================
    if (e.ctrlKey && (e.key === '=' || e.key === '+') && currentTab === 'tab-compare') {
        e.preventDefault();
        state.imageZoom = Math.min(300, state.imageZoom + 25);
        updateCompareView();
        return;
    }

    if (e.ctrlKey && e.key === '-' && currentTab === 'tab-compare') {
        e.preventDefault();
        state.imageZoom = Math.max(25, state.imageZoom - 25);
        if (state.imageZoom <= 100) {
            state.imageOffsetX = 0;
            state.imageOffsetY = 0;
        }
        updateCompareView();
        return;
    }
});
