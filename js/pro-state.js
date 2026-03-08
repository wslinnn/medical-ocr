/**
 * 医疗病例 AI 识别系统 Pro - 状态管理
 * Medical AI Pro - State Management
 */

// ============================================================================
// STATE
// ============================================================================

const state = {
    token: '', // 异步加载，从 electron-store
    model: 'qwen3.5-plus', // 异步加载，从 electron-store
    customPrompt: '', // 异步加载，从 electron-store
    records: [], // 当前页的记录
    totalRecords: 0, // 记录总数
    fileQueue: [],
    compareIndex: -1,
    imageZoom: 100,
    imageRotation: 0,
    imageFit: 'contain',
    processing: false,
    compareFilter: 'pending', // pending, flagged, reviewed
    // 任务块模式（每块20条）
    compareBlockSize: 20,
    compareCurrentBlock: 0, // 当前块索引（从0开始）
    // Pagination (文件处理页面)
    pagination: {
        currentPage: 1,
        pageSize: 20,
        get totalPages() {
            return Math.ceil(state.totalRecords / this.pageSize);
        }
    },
    // 对比审核分页（流式加载）
    comparePagination: {
        currentPage: 1,
        pageSize: 20, // 每页加载20条
        total: 0,
        isLoading: false, // 是否正在加载
        hasMore: true, // 是否还有更多数据
        get totalPages() {
            return Math.ceil(this.total / this.pageSize);
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
// PERSISTENCE (SQLite)
// ============================================================================
async function saveRecords(record) {
    try {
        if (record) {
            // 保存单条记录
            await db.save(record);
        } else {
            // 保存内存中的所有记录（OCR完成后调用）
            if (state.records.length > 0) {
                // 只获取所有已有记录的ID，避免加载全部数据
                const allIds = await db.getAllIds();
                const existingIds = new Set(allIds);
                // 找出内存中新增的记录
                const newRecords = state.records.filter(r => !existingIds.has(r.id));
                // 批量保存新增记录
                if (newRecords.length > 0) {
                    await db.saveAll(newRecords);
                }
            }
        }
    } catch (e) {
        console.error('保存数据到数据库失败:', e);
        showToast('数据保存失败', 'error');
    }
}

async function loadRecords() {
    try {
        await db.init();
        const searchTerm = dom.searchInput ? dom.searchInput.value.trim() : '';
        const statusFilter = dom.filterStatus ? dom.filterStatus.value : '';

        // 使用分页查询
        const result = await db.getPaginated({
            page: state.pagination.currentPage,
            pageSize: state.pagination.pageSize,
            search: searchTerm,
            status: statusFilter
        });

        state.records = result.records || [];
        state.totalRecords = result.total || 0;

        // 如果当前页超出范围，重置到第一页
        if (state.pagination.currentPage > state.pagination.totalPages && state.pagination.totalPages > 0) {
            state.pagination.currentPage = 1;
            await loadRecords();
        }
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

// HTML 转义函数，防止 XSS 攻击
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ============================================================================
// LOADING STATE
// ============================================================================
let loadingOverlay = null;

function showLoading(message = '处理中...') {
    // Remove existing overlay if any
    hideLoading();

    // Create loading overlay
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[200]';
    loadingOverlay.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl p-6 flex items-center gap-4">
            <svg class="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-gray-700 font-medium">${message}</span>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.remove();
        loadingOverlay = null;
    }
}

// ============================================================================
// TOAST NOTIFICATIONS
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
