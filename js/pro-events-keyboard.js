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
document.addEventListener('keydown', async (e) => {
    // F1 - Open/close shortcuts sidebar
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
    // ESC - Close Modals and Shortcuts Sidebar
    // ============================================================================
    if (e.key === 'Escape') {
        // First close shortcuts sidebar if open
        const sidebar = document.getElementById('shortcuts-sidebar');
        if (sidebar && !sidebar.classList.contains('translate-x-full')) {
            e.preventDefault();
            toggleShortcuts();
            return;
        }
        // Then close any active modals
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

        const name = record.name || '未知';
        showDeleteConfirmModal({
            title: '确认删除',
            message: `确定要删除 "${name}" 吗？`,
            warning: '此操作不可恢复'
        }, async () => {
            // Delete from database
            try {
                await db.delete(String(record.id));

                // 从内存中删除当前记录
                state.records.splice(state.compareIndex, 1);
                state.comparePagination.total--;

                // 如果当前块已空且不是第一块，加载上一块
                if (state.records.length === 0 && state.compareCurrentBlock > 0) {
                    await loadPrevBlock();
                } else if (state.compareIndex >= state.records.length) {
                    // 如果索引超出范围，重置到最后一条
                    state.compareIndex = Math.max(0, state.records.length - 1);
                }

                updateCompareView();
                renderRecords();

                // 更新统计（删除会影响今日数量和状态数量）
                updateTodayCount();
                updateStatusCounts();

                showToast('记录已永久删除', 'warning');
            } catch (e) {
                console.error('删除记录失败:', e);
                showToast('删除失败: ' + e.message, 'error');
            }
        });
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
