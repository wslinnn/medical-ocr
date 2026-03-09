/**
 * 医疗病例 AI 识别系统 Pro - 选择框事件
 * Medical AI Pro - Selection Events
 */

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (dom.selectAll) {
        dom.selectAll.onchange = (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('.record-checkbox:not(#select-all)').forEach(cb => cb.checked = checked);
            // Clear indeterminate state after user interaction
            e.target.indeterminate = false;
            updateSelectedCount();
        };
    }
});
