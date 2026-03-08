/**
 * 医疗病例 AI 识别系统 Pro - 图片拖拽模块
 * Medical AI Pro - Image Drag Module
 */

// ============================================================================
// IMAGE DRAG FUNCTIONS
// ============================================================================
function startImageDrag(e) {
    if (state.imageZoom <= 100) return;
    state.isDragging = true;
    state.dragStartX = e.clientX - state.imageOffsetX;
    state.dragStartY = e.clientY - state.imageOffsetY;
    const img = e.target;
    if (img.tagName === 'IMG') img.style.cursor = 'grabbing';
    e.preventDefault();
}

function stopImageDrag(e) {
    if (state.isDragging) {
        state.isDragging = false;
        const img = document.getElementById('compare-image');
        if (img) img.style.cursor = state.imageZoom > 100 ? 'grab' : 'default';
    }
}

// Reset drag state when mouse leaves the window
document.addEventListener('blur', () => {
    if (state.isDragging) {
        state.isDragging = false;
        const img = document.getElementById('compare-image');
        if (img) img.style.cursor = state.imageZoom > 100 ? 'grab' : 'default';
    }
});

// Also reset when mouse leaves the document
document.addEventListener('mouseleave', () => {
    if (state.isDragging) {
        state.isDragging = false;
        const img = document.getElementById('compare-image');
        if (img) img.style.cursor = state.imageZoom > 100 ? 'grab' : 'default';
    }
});

function dragImage(e) {
    if (!state.isDragging) return;

    // Calculate new offsets
    let newOffsetX = e.clientX - state.dragStartX;
    let newOffsetY = e.clientY - state.dragStartY;

    // Get container and image dimensions for boundary checks
    const container = document.getElementById('image-container');
    const img = document.getElementById('compare-image');
    if (!container || !img) return;

    const containerRect = container.getBoundingClientRect();
    const zoom = state.imageZoom / 100;
    const rotation = state.imageRotation;

    // Calculate image dimensions after zoom
    const imgWidth = img.naturalWidth * zoom;
    const imgHeight = img.naturalHeight * zoom;

    // For rotation, use the larger dimension
    const isRotated = Math.abs(rotation % 180) === 90;
    const effectiveImgWidth = isRotated ? imgHeight : imgWidth;
    const effectiveImgHeight = isRotated ? imgWidth : imgHeight;

    // Calculate intelligent boundary limits
    // When image is smaller than container: allow some movement but keep centered
    // When image is larger than container: keep at least 20% of image visible
    let minOffsetX, maxOffsetX, minOffsetY, maxOffsetY;

    if (effectiveImgWidth <= containerRect.width) {
        // Image fits horizontally - limit movement to keep mostly centered
        const slack = (containerRect.width - effectiveImgWidth) / 2;
        minOffsetX = -slack;
        maxOffsetX = slack;
    } else {
        // Image larger than container - keep at least 20% visible on each side
        const maxVisibleOffset = (effectiveImgWidth - containerRect.width) / 2 + containerRect.width * 0.8;
        minOffsetX = -maxVisibleOffset;
        maxOffsetX = maxVisibleOffset;
    }

    if (effectiveImgHeight <= containerRect.height) {
        // Image fits vertically - limit movement to keep mostly centered
        const slack = (containerRect.height - effectiveImgHeight) / 2;
        minOffsetY = -slack;
        maxOffsetY = slack;
    } else {
        // Image larger than container - keep at least 20% visible on each side
        const maxVisibleOffset = (effectiveImgHeight - containerRect.height) / 2 + containerRect.height * 0.8;
        minOffsetY = -maxVisibleOffset;
        maxOffsetY = maxVisibleOffset;
    }

    // Clamp offsets within bounds
    state.imageOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, newOffsetX));
    state.imageOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, newOffsetY));

    // Apply transform
    const transform = `translate(${state.imageOffsetX}px, ${state.imageOffsetY}px) rotate(${rotation}deg) scale(${zoom})`;
    img.style.transform = transform;
}

function resetImageDrag() {
    state.imageOffsetX = 0;
    state.imageOffsetY = 0;
}

// Make functions global for inline event handlers
window.startImageDrag = startImageDrag;
window.dragImage = dragImage;
window.stopImageDrag = stopImageDrag;
