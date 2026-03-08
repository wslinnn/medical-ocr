/**
 * 医疗病例 AI 识别系统 Pro - 配置事件处理
 * Medical AI Pro - Configuration Event Handlers
 */

// ============================================================================
// HELPER: Save settings to electron-store
// ============================================================================
async function saveTokenToStore(token) {
    if (!window.electronStore) {
        throw new Error('electron-store 不可用，请使用 Electron 环境运行');
    }
    state.token = token;
    await window.electronStore.set('token', token);
}

async function saveModelToStore(model) {
    if (!window.electronStore) {
        throw new Error('electron-store 不可用，请使用 Electron 环境运行');
    }
    state.model = model;
    await window.electronStore.set('model', model);
}

// ============================================================================
// TOKEN CONFIG (Legacy - kept for compatibility with token-card)
// ============================================================================
// Note: Token input has been moved to settings modal
// Check if legacy apiToken element exists before using it
if (dom.apiToken) {
    dom.apiToken.value = state.token;

    dom.apiToken.onblur = async () => {
        const newToken = dom.apiToken.value.trim();
        if (newToken !== state.token) {
            await saveTokenToStore(newToken);
            showToast('API Key 已保存');
            updateNetworkStatus();
        }
    };
}

// Legacy save-token button (if exists)
const saveTokenBtn = document.getElementById('save-token');
if (saveTokenBtn) {
    saveTokenBtn.onclick = async () => {
        if (dom.apiToken) {
            const newToken = dom.apiToken.value.trim();
            if (newToken) {
                await saveTokenToStore(newToken);
                showToast('API Key 已保存');
                updateNetworkStatus();
            } else {
                showToast('请输入 API Key', 'warning');
            }
        }
    };
}

// ============================================================================
// MODEL SELECTION CONFIG
// ============================================================================
const modelSelect = document.getElementById('settings-model');
if (modelSelect) {
    // Load saved model - state.model 已通过 initSettingsFromStore 加载
    if (state.model) {
        modelSelect.value = state.model;
    }

    // Save model on change
    modelSelect.onchange = async () => {
        const selectedModel = modelSelect.value;
        await saveModelToStore(selectedModel);
        updateModelDisplay();
        showToast('模型已切换为: ' + selectedModel);
    };
}

// Update model display in header
function updateModelDisplay() {
    const modelText = document.getElementById('model-display-text');
    if (modelText) {
        modelText.textContent = '模型: ' + (state.model || 'qwen3.5-plus');
    }
}

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
    updateModelDisplay();
});
