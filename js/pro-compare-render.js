/**
 * 医疗病例 AI 识别系统 Pro - 对比视图渲染模块
 * Medical AI Pro - Compare View Rendering Module
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

// 查看模式下存储当前查看的记录
let currentViewRecord = null;

// ============================================================================
// COMPARE VIEW RENDERING
// ============================================================================
function updateCompareView() {
    const noDataView = document.getElementById('compare-no-data');
    const contentView = document.getElementById('compare-content');

    // 查看模式下使用预加载的记录
    const record = state.viewRecordMode ? currentViewRecord : getCurrentCompareRecord();

    // 更新按钮显示状态
    updateCompareButtonsVisibility();

    if (!record) {
        if (noDataView) noDataView.classList.remove('hidden');
        if (contentView) contentView.classList.add('hidden');
        dom.compareIndex.textContent = '';
        dom.compareStatus.textContent = '';
        return;
    }

    if (noDataView) noDataView.classList.add('hidden');
    if (contentView) contentView.classList.remove('hidden');

    // 查看模式下不显示分页信息
    if (state.viewRecordMode) {
        dom.compareIndex.textContent = '';
    } else {
        // 显示5个数字：块内位置、块内剩余（内存列表大小）、任务块数、总数
        const pg = state.comparePagination;
        const total = pg.total || state.totalRecords;
        const blockSize = state.compareBlockSize;
        const currentBlock = state.compareCurrentBlock;
        const totalBlocks = Math.ceil(total / blockSize);
        const currentPosition = state.compareIndex + 1;
        const remainingInBlock = state.records.length;

        // 格式：3/20，剩余 19，块 1/5，总数 85
        dom.compareIndex.textContent = `${currentPosition}/${remainingInBlock}，页数 ${currentBlock + 1}/${totalBlocks}，总数 ${total}`;
    }

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
    // 显示内容视图，隐藏无数据视图
    const noDataView = document.getElementById('compare-no-data');
    const contentView = document.getElementById('compare-content');
    if (noDataView) noDataView.classList.add('hidden');
    if (contentView) contentView.classList.remove('hidden');

    // Update Image
    const img = document.getElementById('compare-image');
    const imgError = document.getElementById('image-error');
    const imgNone = document.getElementById('image-none');
    const zoomLevel = document.getElementById('zoom-level');

    if (record.imageData) {
        // 如果是 Uint8Array (BLOB)，创建 Blob URL
        if (record.imageData instanceof Uint8Array) {
            const blob = new Blob([record.imageData], { type: 'image/jpeg' });
            img.src = URL.createObjectURL(blob);
        } else {
            // 兼容 base64 格式
            img.src = record.imageData;
        }
        img.onerror = () => {
            img.style.display = 'none';
            imgError.classList.remove('hidden');
        };
        img.style.display = 'block';
        img.style.transform = `translate(${state.imageOffsetX}px, ${state.imageOffsetY}px) rotate(${state.imageRotation}deg) scale(${state.imageZoom / 100})`;
        img.style.cursor = state.imageZoom > 100 ? 'grab' : 'default';
        imgNone.classList.add('hidden');
        imgError.classList.add('hidden');
    } else {
        img.style.display = 'none';
        imgNone.classList.remove('hidden');
        imgError.classList.add('hidden');
    }

    if (zoomLevel) {
        zoomLevel.textContent = `${state.imageZoom}%`;
    }

    // Update Index and Status display
    if (dom.compareStatus) {
        const statusNames = { pending: '待审核', reviewed: '已审核', flagged: '需复核' };
        dom.compareStatus.textContent = statusNames[record.status] || record.status || '-';
        // Update status badge class
        dom.compareStatus.className = 'status-badge ' + (record.status || 'pending');
    }

    // Update Form and Filename
    const filenameEl = document.getElementById('compare-filename');
    if (filenameEl) filenameEl.textContent = record.fileName || '';

    const originalTextEl = document.getElementById('compare-original-text');
    if (originalTextEl) originalTextEl.textContent = record.originalText || '无';

    const form = document.getElementById('compare-form');
    if (form) {
        form.querySelectorAll('.editable-cell').forEach(cell => {
            const field = cell.dataset.field;
            cell.textContent = record[field] || '';
        });
    }
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

        const blurHandler = async () => {
            const field = cell.dataset.field;
            // Trim whitespace and enforce maxlength
            let value = cell.textContent.trim();
            if (maxlength > 0 && value.length > maxlength) {
                value = value.substring(0, maxlength);
            }
            // 更新数据库
            try {
                await db.update(String(record.id), { [field]: value });
            } catch (e) {
                console.error('保存失败:', e);
                showToast('保存失败: ' + e.message, 'error');
                return;
            }

            // 查看模式下重新获取记录，审核模式下刷新当前块
            if (state.viewRecordMode && state.viewRecordId) {
                currentViewRecord = await db.getById(state.viewRecordId);
            } else {
                await refreshCurrentBlock();
            }
            updateCompareView();
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
