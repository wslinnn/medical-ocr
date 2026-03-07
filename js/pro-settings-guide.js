/**
 * 医疗病例 OCR 识别系统 Pro - 设置和引导模块
 * Medical OCR Pro - Settings and Onboarding Module
 */

// ============================================================================
// SETTINGS MODAL
// ============================================================================
function openSettingsModal() {
    // Load current token into input
    const tokenInput = document.getElementById('settings-api-token');
    if (tokenInput && state.token) {
        tokenInput.value = state.token;
    }

    // Update token status
    updateTokenStatus();

    // Show modal
    if (window.openModalWithFocus) {
        openModalWithFocus('settings-modal');
    } else {
        document.getElementById('settings-modal').classList.add('active');
    }
}

function closeSettingsModal() {
    if (window.closeModalWithFocus) {
        closeModalWithFocus('settings-modal');
    } else {
        document.getElementById('settings-modal').classList.remove('active');
    }
}

function updateTokenStatus() {
    const statusEl = document.getElementById('token-status');
    if (!statusEl) return;

    if (state.token) {
        // Check if token looks valid (basic format check)
        const isValid = state.token.length >= 20;
        statusEl.innerHTML = `
            <span class="status-badge ${isValid ? 'reviewed' : 'flagged'}">${isValid ? '已配置' : '格式可能不正确'}</span>
            <span class="text-gray-500">${isValid ? 'Token 已保存' : '请检查 Token 格式'}</span>
        `;
    } else {
        statusEl.innerHTML = `
            <span class="status-badge pending">未配置</span>
            <span class="text-gray-500">请输入 Token 后点击保存</span>
        `;
    }
}

function saveTokenFromSettings() {
    const tokenInput = document.getElementById('settings-api-token');
    const newToken = tokenInput.value.trim();

    // Allow empty token (user can clear it)
    state.token = newToken;
    if (newToken) {
        localStorage.setItem('aistudio_token', newToken);
    } else {
        localStorage.removeItem('aistudio_token');
    }

    // Update API token in the upload view if visible
    const uploadTokenInput = document.getElementById('api-token');
    if (uploadTokenInput) {
        uploadTokenInput.value = newToken;
    }

    updateTokenStatus();
    showToast(newToken ? 'Token 已保存' : 'Token 已清空', newToken ? 'success' : 'info');
}

function clearTokenFromSettings() {
    // Clear token from state
    state.token = '';

    // Clear from localStorage
    localStorage.removeItem('aistudio_token');

    // Clear the input field
    const tokenInput = document.getElementById('settings-api-token');
    if (tokenInput) {
        tokenInput.value = '';
    }

    // Update API token in the upload view if visible
    const uploadTokenInput = document.getElementById('api-token');
    if (uploadTokenInput) {
        uploadTokenInput.value = '';
    }

    // Update status display
    updateTokenStatus();

    showToast('Token 已清空', 'info');
}

// Toggle token visibility
function toggleTokenVisibility() {
    const tokenInput = document.getElementById('settings-api-token');
    const toggleBtn = document.getElementById('btn-toggle-token-visibility');

    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        toggleBtn.innerHTML = `
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l4.242-4.242M9 12h.008"/>
            </svg>
        `;
    } else {
        tokenInput.type = 'password';
        toggleBtn.innerHTML = `
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7"/>
            </svg>
        `;
    }
}

// ============================================================================
// FIRST TIME USER GUIDE (ONBOARDING)
// ============================================================================
let currentGuideStep = 1;

// Check if user has seen the guide before
function hasSeenGuide() {
    return localStorage.getItem('has_seen_guide') === 'true';
}

// Mark guide as seen
function markGuideAsSeen() {
    localStorage.setItem('has_seen_guide', 'true');
}

// Should show guide?
function shouldShowGuide() {
    return !state.token && !hasSeenGuide();
}

// Show guide modal
function showGuideModal() {
    if (window.openModalWithFocus) {
        openModalWithFocus('guide-modal');
    } else {
        document.getElementById('guide-modal').classList.add('active');
    }
    showGuideStep(1);
}

// Hide guide modal
function hideGuideModal() {
    if (window.closeModalWithFocus) {
        closeModalWithFocus('guide-modal');
    } else {
        document.getElementById('guide-modal').classList.remove('active');
    }
    markGuideAsSeen();
}

// Show specific guide step
function showGuideStep(stepNumber) {
    currentGuideStep = stepNumber;

    // Hide all steps
    document.querySelectorAll('.guide-content').forEach(el => el.classList.add('hidden'));

    // Show current step
    const stepEl = document.getElementById(`guide-step-${stepNumber}`);
    if (stepEl) {
        stepEl.classList.remove('hidden');
    }

    // Update step indicators
    document.querySelectorAll('.guide-step').forEach((el, index) => {
        const stepNum = index + 1;
        const circle = el.querySelector('div');
        const text = el.querySelector('.text-xs');

        if (stepNum < stepNumber) {
            // Completed steps
            circle.className = 'w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-medium';
            circle.innerHTML = '✓';
            text.className = 'text-xs text-center mt-1 text-green-600';
        } else if (stepNum === stepNumber) {
            // Current step
            circle.className = 'w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium';
            circle.textContent = stepNum;
            text.className = 'text-xs text-center mt-1 text-blue-600';
        } else {
            // Future steps
            circle.className = 'w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-medium';
            circle.textContent = stepNum;
            text.className = 'text-xs text-center mt-1 text-gray-500';
        }
    });
}

// Guide navigation
function nextGuideStep() {
    if (currentGuideStep < 3) {
        if (currentGuideStep === 2) {
            // Save token from guide
            const tokenInput = document.getElementById('guide-api-token');
            const newToken = tokenInput.value.trim();

            if (!newToken) {
                showToast('请输入 API Token', 'warning');
                return;
            }

            state.token = newToken;
            localStorage.setItem('aistudio_token', newToken);

            // Update settings modal input
            const settingsTokenInput = document.getElementById('settings-api-token');
            if (settingsTokenInput) {
                settingsTokenInput.value = newToken;
            }

            showToast('Token 已保存', 'success');
        }

        showGuideStep(currentGuideStep + 1);
    }
}

function prevGuideStep() {
    if (currentGuideStep > 1) {
        showGuideStep(currentGuideStep - 1);
    }
}

function skipGuide() {
    hideGuideModal();
    showToast('您可以随时点击右上角设置按钮配置 API Token', 'info');
}

function finishGuide() {
    hideGuideModal();
    showToast('开始使用医疗病例 OCR 识别系统！', 'success');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
// Settings button
document.getElementById('btn-settings').onclick = openSettingsModal;

// Settings modal close button
document.getElementById('btn-settings-close').onclick = closeSettingsModal;

// Save token button in settings
document.getElementById('btn-save-token').onclick = saveTokenFromSettings;

// Clear token button in settings
document.getElementById('btn-clear-token').onclick = clearTokenFromSettings;

// Toggle token visibility
document.getElementById('btn-toggle-token-visibility').onclick = toggleTokenVisibility;

// Guide modal buttons
document.getElementById('btn-guide-close').onclick = skipGuide;
document.getElementById('btn-guide-skip').onclick = skipGuide;
document.getElementById('btn-guide-next-1').onclick = nextGuideStep;
document.getElementById('btn-guide-back-2').onclick = prevGuideStep;
document.getElementById('btn-guide-next-2').onclick = nextGuideStep;
document.getElementById('btn-guide-finish').onclick = finishGuide;

// ============================================================================
// INITIALIZATION
// ============================================================================
// Show guide on first load if needed
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure everything is loaded
    setTimeout(() => {
        if (shouldShowGuide()) {
            showGuideModal();
        }
    }, 500);
});
