/**
 * 医疗病例 OCR 识别系统 Pro - 配置事件处理
 * Medical OCR Pro - Configuration Event Handlers
 */

// ============================================================================
// TOKEN CONFIG (Legacy - kept for compatibility with token-card)
// ============================================================================
dom.apiToken.value = state.token;

dom.apiToken.onblur = () => {
    const newToken = dom.apiToken.value.trim();
    if (newToken !== state.token) {
        state.token = newToken;
        localStorage.setItem('aistudio_token', newToken);
        showToast('Token 已保存');
        updateNetworkStatus();
    }
};

document.getElementById('save-token').onclick = () => {
    const newToken = dom.apiToken.value.trim();
    if (newToken) {
        state.token = newToken;
        localStorage.setItem('aistudio_token', newToken);
        showToast('Token 已保存');
        updateNetworkStatus();
    } else {
        showToast('请输入 Token', 'warning');
    }
};

// ============================================================================
// NETWORK STATUS (Updated for new header location)
// ============================================================================
function updateNetworkStatus() {
    const statusDot = document.getElementById('network-status-dot');
    const statusText = document.getElementById('network-status-text');

    if (!statusDot || !statusText) return;

    if (navigator.onLine) {
        statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
        statusText.textContent = '已连接';
        statusText.className = 'text-sm text-green-600';
    } else {
        statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
        statusText.textContent = '已断开';
        statusText.className = 'text-sm text-red-600';
    }
}

window.addEventListener('online', () => {
    updateNetworkStatus();
    showToast('网络已连接', 'success');
});

window.addEventListener('offline', () => {
    updateNetworkStatus();
    showToast('网络已断开', 'warning');
});

// Initialize network status on load
document.addEventListener('DOMContentLoaded', () => {
    updateNetworkStatus();
});
