/**
 * 医疗病例 AI 识别系统 Pro - 上传事件处理
 * Medical AI Pro - Upload Event Handlers
 */

// ============================================================================
// FILE SELECTION & DROP ZONE
// ============================================================================
dom.dropZone.onclick = async (e) => {
    if (window.electron && window.electron.dialog) {
        const result = await window.electron.dialog.showOpenDialog({
            title: '选择文件',
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png'] }]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const fs = window.fs;
            const path = window.path;
            const files = result.filePaths.map(p => ({
                path: p,
                name: path.basename(p),
                size: fs.statSync(p).size,
                type: getFileType(p, path)
            }));
            await addFilesToQueue(files);
        }
    } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = (e) => addFilesToQueue(Array.from(e.target.files));
        input.click();
    }
};

// Drag and drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    dom.dropZone.addEventListener(event, e => {
        e.preventDefault();
        e.stopPropagation();
    });
});

['dragenter', 'dragover'].forEach(event => {
    dom.dropZone.addEventListener(event, () => dom.dropZone.classList.add('drag-over'));
});

['dragleave', 'drop'].forEach(event => {
    dom.dropZone.addEventListener(event, () => dom.dropZone.classList.remove('drag-over'));
});

dom.dropZone.addEventListener('drop', async (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        await addFilesToQueue(Array.from(files));
    }
});

// ============================================================================
// FILE SELECTION BUTTONS
// ============================================================================
document.getElementById('btn-select-folder').onclick = selectFolder;
document.getElementById('btn-select-files').onclick = selectFiles;
document.getElementById('btn-start-all').onclick = processQueue;
document.getElementById('btn-clear-queue').onclick = () => {
    // Check if processing is in progress
    if (state.processing) {
        showToast('正在处理中，请等待处理完成后再清空', 'warning');
        return;
    }

    const queueLength = state.fileQueue.length;
    if (queueLength === 0) {
        showToast('队列为空，无需清空', 'info');
        return;
    }

    // Count items by status
    const completed = state.fileQueue.filter(f => f.status === 'completed').length;
    const failed = state.fileQueue.filter(f => f.status === 'failed').length;
    const pending = state.fileQueue.filter(f => f.status === 'pending').length;

    // Build message
    let message = `队列中共有 ${queueLength} 项:\n`;
    if (completed > 0) message += `- 已完成: ${completed} 项\n`;
    if (failed > 0) message += `- 失败: ${failed} 项\n`;
    if (pending > 0) message += `- 待处理: ${pending} 项`;

    showDeleteConfirmModal({
        title: '确认清空队列',
        message: message,
        warning: '所有项目将被从队列中移除'
    }, () => {
        state.fileQueue = [];
        updateQueueUI();
        showToast('队列已清空');
    });
};
