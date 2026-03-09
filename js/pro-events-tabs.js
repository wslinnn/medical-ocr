/**
 * 医疗病例 AI 识别系统 Pro - 标签页导航事件
 * Medical AI Pro - Tab Navigation Events
 */

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const tabUpload = document.getElementById('tab-upload');
    const tabCompare = document.getElementById('tab-compare');

    if (tabUpload) {
        tabUpload.onclick = () => switchTab('upload');
    }

    if (tabCompare) {
        tabCompare.onclick = () => {
            // 点击对比审核按钮，进入审核模式，刷新数据
            state.viewRecordMode = false;
            switchTab('compare');
        };
    }

    console.log('Tab events initialized');
});
