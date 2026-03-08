/**
 * 医疗病例 AI 识别系统 Pro - 状态管理
 * Medical AI Pro - State Management
 */

// ============================================================================
// STATE
// ============================================================================

// ============================================================================
// UNIQUE ID GENERATOR
// ============================================================================
// Use a combination of timestamp and counter to ensure uniqueness
let idCounter = 0;
let lastTimestamp = 0;

function generateUniqueId() {
    const timestamp = Date.now();
    if (timestamp !== lastTimestamp) {
        lastTimestamp = timestamp;
        idCounter = 0;
    }
    return timestamp * 10000 + (++idCounter);
}

const state = {
    token: '', // 异步加载，从 electron-store
    model: 'qwen3.5-plus', // 异步加载，从 electron-store
    customPrompt: '', // 异步加载，从 electron-store
    records: [], // 初始为空，从 IndexedDB 加载
    fileQueue: [],
    compareIndex: -1,
    imageZoom: 100,
    imageRotation: 0,
    imageFit: 'contain',
    processing: false,
    compareFilter: 'all', // all, flagged, reviewed
    // Pagination
    pagination: {
        currentPage: 1,
        pageSize: 20,
        get totalPages() {
            return Math.ceil(state.records.length / this.pageSize);
        }
    },
    // Image drag state
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    imageOffsetX: 0,
    imageOffsetY: 0,
    // Processing control
    shouldStopProcessing: false
};

// ============================================================================
// ELECTRON-STORE INITIALIZATION (Settings - auto-isolated by appId)
// ============================================================================
async function initSettingsFromStore() {
    if (!window.electronStore) {
        throw new Error('electron-store 不可用，请使用 Electron 环境运行');
    }

    const token = await window.electronStore.get('token');
    const model = await window.electronStore.get('model');
    const customPrompt = await window.electronStore.get('customPrompt');

    state.token = token || '';
    state.model = model || 'qwen3.5-plus';
    // customPrompt 为空时，getPrompt() 会返回 DEFAULT_PROMPT
    // 这里保持为空字符串，这样可以通过 state.customPrompt 是否为空来判断是否有自定义
    state.customPrompt = customPrompt || '';

    console.log('✅ 已从 electron-store 加载设置');
    console.log(`📁 用户数据目录: ${await window.electronStore.getUserDataPath()}`);
}

// ============================================================================
// PERSISTENCE (IndexedDB)
// ============================================================================
async function saveRecords() {
    try {
        await db.saveAll(state.records);
    } catch (e) {
        console.error('保存数据到 IndexedDB 失败:', e);
        showToast('数据保存失败', 'error');
    }
}

async function loadRecords() {
    try {
        await db.init();
        const records = await db.getAll();
        state.records = records || [];
    } catch (e) {
        console.error('初始化数据库失败:', e);
        showToast('数据库初始化失败', 'error');
    }
}

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const dom = {
    apiToken: document.getElementById('api-token'),
    dropZone: document.getElementById('drop-zone'),
    fileQueue: document.getElementById('file-queue'),
    queueCount: document.getElementById('queue-count'),
    queueProgress: document.getElementById('queue-progress'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    progressCounts: document.getElementById('progress-counts'),
    recordsBody: document.getElementById('records-body'),
    selectAll: document.getElementById('select-all'),
    searchInput: document.getElementById('search-input'),
    filterStatus: document.getElementById('filter-status'),
    imageContainer: document.getElementById('image-container'),
    compareForm: document.getElementById('compare-form'),
    compareIndex: document.getElementById('compare-index'),
    compareStatus: document.getElementById('compare-status'),
    zoomLevel: document.getElementById('zoom-level')
};

// ============================================================================
// UTILITIES
// ============================================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500' };
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.932-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.932 3z"/></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    toast.className = `toast ${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3`;
    toast.innerHTML = `${icons[type]}<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
