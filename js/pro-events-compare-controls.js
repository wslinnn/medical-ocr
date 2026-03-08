/**
 * 医疗病例 AI 识别系统 Pro - 对比视图图片控制事件
 * Medical AI Pro - Compare View Image Control Events
 */

document.getElementById('btn-zoom-out').onclick = () => {
    state.imageZoom = Math.max(25, state.imageZoom - 25);
    if (state.imageZoom <= 100) {
        state.imageOffsetX = 0;
        state.imageOffsetY = 0;
    }
    updateCompareView();
};

document.getElementById('btn-zoom-in').onclick = () => {
    state.imageZoom = Math.min(300, state.imageZoom + 25);
    updateCompareView();
};

document.getElementById('btn-rotate-left').onclick = () => {
    state.imageRotation -= 90;
    updateCompareView();
};

document.getElementById('btn-rotate-right').onclick = () => {
    state.imageRotation += 90;
    updateCompareView();
};

document.getElementById('btn-fit-window').onclick = () => {
    state.imageZoom = 100;
    state.imageRotation = 0;
    state.imageOffsetX = 0;
    state.imageOffsetY = 0;
    updateCompareView();
};

document.getElementById('btn-fit-actual').onclick = () => {
    state.imageZoom = 100;
    state.imageRotation = 0;
    state.imageOffsetX = 0;
    state.imageOffsetY = 0;
    updateCompareView();
};

if (dom.imageContainer) {
    dom.imageContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            state.imageZoom = Math.max(25, Math.min(300, state.imageZoom + delta));
            updateCompareView();
        }
    });
}
