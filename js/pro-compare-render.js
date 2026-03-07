/**
 * 医疗病例 OCR 识别系统 Pro - 对比视图渲染模块
 * Medical OCR Pro - Compare View Rendering Module
 */

// ============================================================================
// COMPARE VIEW INITIALIZATION
// ============================================================================
function initCompareView() {
    updateCompareView();
}

// ============================================================================
// EVENT LISTENER TRACKING
// ============================================================================
let wheelEventListener = null;
let compareEventListeners = [];

// Function to remove all tracked event listeners
function removeCompareEventListeners() {
    compareEventListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    compareEventListeners = [];
}

// Function to track and add event listener
function addCompareEventListener(element, event, handler) {
    // Remove existing listener for the same element and event
    const existingIndex = compareEventListeners.findIndex(
        e => e.element === element && e.event === event
    );
    if (existingIndex !== -1) {
        element.removeEventListener(event, compareEventListeners[existingIndex].handler);
        compareEventListeners.splice(existingIndex, 1);
    }

    // Add new listener and track it
    element.addEventListener(event, handler);
    compareEventListeners.push({ element, event, handler });
}

// ============================================================================
// COMPARE VIEW RENDERING
// ============================================================================
function updateCompareView() {
    const container = document.getElementById('compare-container');
    const record = getCurrentCompareRecord();

    if (!record) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-400">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0118.586 5H19a2 2 0 012 2v14a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="text-lg">暂无记录</p>
                    <p class="text-sm mt-2">请先上传文件进行识别</p>
                </div>
            </div>
        `;
        dom.compareIndex.textContent = '0 / 0';
        dom.compareStatus.textContent = '-';
        return;
    }

    const filtered = getFilteredRecordsForCompare();
    dom.compareIndex.textContent = `${state.compareIndex + 1} / ${filtered.length}`;

    const statusBadges = {
        pending: '<span class="status-badge pending">待审核</span>',
        reviewed: '<span class="status-badge reviewed">已审核</span>',
        flagged: '<span class="status-badge flagged">需复核</span>'
    };
    dom.compareStatus.innerHTML = statusBadges[record.status];

    renderCompareContent(record);
    attachCompareEventListeners(record);
}

function renderCompareContent(record) {
    const container = document.getElementById('compare-container');
    container.innerHTML = `
        <div class="split-view">
            <div class="split-panel">
                <div class="split-panel-header">
                    <span class="font-medium">原图预览</span>
                    <div class="flex items-center gap-2">
                        <button id="btn-zoom-out" class="p-1 hover:bg-gray-200 rounded" title="缩小 (Ctrl+-)">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                            </svg>
                        </button>
                        <span id="zoom-level">${state.imageZoom}%</span>
                        <button id="btn-zoom-in" class="p-1 hover:bg-gray-200 rounded" title="放大 (Ctrl++)">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                        </button>
                        <div class="w-px h-6 bg-gray-300"></div>
                        <button id="btn-rotate-left" class="p-1 hover:bg-gray-200 rounded" title="左旋转">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                            </svg>
                        </button>
                        <button id="btn-rotate-right" class="p-1 hover:bg-gray-200 rounded" title="右旋转">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 14h-10a8 8 0 00-8 8v-2M21 14l-6 6m6-6l-6-6"/>
                            </svg>
                        </button>
                        <div class="w-px h-6 bg-gray-300"></div>
                        <button id="btn-fit-window" class="p-1 hover:bg-gray-200 rounded text-sm" title="适应窗口 (Ctrl+0)">重置</button>
                    </div>
                </div>
                <div id="image-container" class="split-panel-content image-preview-container"
                    onmousedown="startImageDrag(event)"
                    onmousemove="dragImage(event)"
                    onmouseup="stopImageDrag(event)"
                    onmouseleave="stopImageDrag(event)">
                    ${record.imageData ? `
                        <img id="compare-image"
                            src="${record.imageData}"
                            class="image-preview"
                            onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';"
                            style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; transform: translate(${state.imageOffsetX}px, ${state.imageOffsetY}px) rotate(${state.imageRotation}deg) scale(${state.imageZoom / 100}); cursor: ${state.imageZoom > 100 ? 'grab' : 'default'};">
                        <div class="hidden items-center justify-center h-full text-center absolute inset-0" style="display: none;">
                            <div>
                                <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <p class="text-gray-400">图片加载失败</p>
                                <p class="text-sm text-gray-400 mt-1">原始图片可能已损坏</p>
                            </div>
                        </div>
                    ` : '<p class="text-gray-400">无图片</p>'}
                </div>
            </div>

            <div class="split-panel">
                <div class="split-panel-header">
                    <span class="font-medium">识别结果</span>
                    <span class="text-sm text-gray-500">${record.fileName || ''}</span>
                </div>
                <div class="split-panel-content">
                    <form id="compare-form">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                                <div class="editable-cell" contenteditable="true" data-field="name" maxlength="20">${record.name}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
                                <div class="editable-cell" contenteditable="true" data-field="gender" maxlength="10">${record.gender}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                                <div class="editable-cell" contenteditable="true" data-field="age" maxlength="10">${record.age}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">分期</label>
                                <div class="editable-cell" contenteditable="true" data-field="stage" maxlength="20">${record.stage}</div>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">诊断</label>
                                <div class="editable-cell" contenteditable="true" data-field="diagnosis" maxlength="200">${record.diagnosis}</div>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">原始文本</label>
                                <div class="text-sm text-gray-500 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded whitespace-pre-wrap">${record.originalText || '无原始文本'}</div>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4 border-t">
                            <button id="btn-compare-review" type="button" class="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                确认审核
                            </button>
                            <button id="btn-compare-flag" type="button" class="flex-1 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.932-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.932 3z"/>
                                </svg>
                                需复核
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function attachCompareEventListeners(record) {
    // Remove all old event listeners first
    removeCompareEventListeners();

    // Remove old wheel event listener if exists
    const imgContainer = document.getElementById('image-container');
    if (wheelEventListener && imgContainer) {
        imgContainer.removeEventListener('wheel', wheelEventListener);
        wheelEventListener = null;
    }

    // Edit listeners with input validation
    const form = document.getElementById('compare-form');
    form.querySelectorAll('.editable-cell').forEach(cell => {
        const maxlength = parseInt(cell.getAttribute('maxlength')) || 0;

        // Enforce maxlength on input
        const inputHandler = () => {
            if (maxlength > 0 && cell.textContent.length > maxlength) {
                cell.textContent = cell.textContent.substring(0, maxlength);
                // Move cursor to end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(cell);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        };

        const blurHandler = () => {
            const field = cell.dataset.field;
            // Trim whitespace and enforce maxlength
            let value = cell.textContent.trim();
            if (maxlength > 0 && value.length > maxlength) {
                value = value.substring(0, maxlength);
            }
            record[field] = value;
            saveRecords();
            renderRecords();
        };

        // Prevent paste from exceeding maxlength
        const pasteHandler = (e) => {
            if (maxlength > 0) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const currentText = cell.textContent;
                const remaining = maxlength - currentText.length;
                cell.textContent = currentText + paste.substring(0, remaining);
            }
        };

        // Use tracked event listeners
        addCompareEventListener(cell, 'input', inputHandler);
        addCompareEventListener(cell, 'blur', blurHandler);
        addCompareEventListener(cell, 'paste', pasteHandler);
    });

    // Zoom control buttons
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomInBtn = document.getElementById('btn-zoom-in');

    addCompareEventListener(zoomOutBtn, 'click', () => {
        state.imageZoom = Math.max(25, state.imageZoom - 25);
        if (state.imageZoom <= 100) resetImageDrag();
        updateCompareView();
    });

    addCompareEventListener(zoomInBtn, 'click', () => {
        state.imageZoom = Math.min(300, state.imageZoom + 25);
        updateCompareView();
    });

    // Rotation buttons
    const rotateLeftBtn = document.getElementById('btn-rotate-left');
    const rotateRightBtn = document.getElementById('btn-rotate-right');

    addCompareEventListener(rotateLeftBtn, 'click', () => {
        state.imageRotation -= 90;
        updateCompareView();
    });

    addCompareEventListener(rotateRightBtn, 'click', () => {
        state.imageRotation += 90;
        updateCompareView();
    });

    // Reset button
    const resetBtn = document.getElementById('btn-fit-window');
    addCompareEventListener(resetBtn, 'click', () => {
        state.imageZoom = 100;
        state.imageRotation = 0;
        resetImageDrag();
        updateCompareView();
    });

    // Mouse wheel zoom - with listener tracking
    if (imgContainer) {
        wheelEventListener = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10;
                state.imageZoom = Math.max(25, Math.min(300, state.imageZoom + delta));
                updateCompareView();
            }
        };
        imgContainer.addEventListener('wheel', wheelEventListener);
    }
}
