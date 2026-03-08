/**
 * 医疗病例 AI 识别系统 Pro - 队列操作模块
 * Medical AI Pro - Queue Operations Module
 */

async function addFilesToQueue(files) {
    if (!state.token) {
        showToast('请先保存 API Key', 'error');
        return;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    const duplicateFiles = [];

    for (const file of files) {
        const exists = state.fileQueue.find(q => q.file.name === file.name && q.file.size === file.size);
        if (!exists) {
            let thumbnail = null;
            if (file.type && file.type.startsWith('image/')) {
                if (file.path && window.fs) {
                    try {
                        const data = window.fs.readFileSync(file.path);
                        thumbnail = 'data:image/jpeg;base64,' + data.toString('base64');
                    } catch (e) {}
                } else {
                    thumbnail = await readFileAsDataURL(file);
                }
            }
            state.fileQueue.push({
                id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                file: file,
                thumbnail: thumbnail,
                status: 'pending'
            });
            addedCount++;
        } else {
            duplicateCount++;
            duplicateFiles.push(file.name);
        }
    }

    // Show feedback to user
    if (duplicateCount > 0) {
        if (duplicateCount === 1) {
            showToast(`"${duplicateFiles[0]}" 已存在队列中，跳过添加`, 'warning');
        } else {
            showToast(`已添加 ${addedCount} 个文件，${duplicateCount} 个文件已存在跳过`, 'warning');
        }
    } else if (addedCount > 0) {
        showToast(`已添加 ${addedCount} 个文件到队列`);
    }

    updateQueueUI();
}

function removeFromQueue(id) {
    state.fileQueue = state.fileQueue.filter(q => q.id !== id);
    updateQueueUI();
}

// Global functions for inline onclick handlers
window.cancelProcessing = function() {
    state.shouldStopProcessing = true;
    showToast('正在取消处理...', 'info');
};

window.retryItem = function(id) {
    const item = state.fileQueue.find(q => q.id === id);
    if (item && item.status === 'failed') {
        item.status = 'pending';
        item.error = null;
        updateQueueUI();
        showToast('已重新加入队列，可点击"开始识别"处理');
    }
};

window.removeFromQueue = removeFromQueue;

// ============================================================================
// CLEAR QUEUE FUNCTIONS
// ============================================================================
window.clearCompletedItems = function() {
    const beforeLength = state.fileQueue.length;
    state.fileQueue = state.fileQueue.filter(q => q.status !== 'completed');
    const cleared = beforeLength - state.fileQueue.length;
    if (cleared > 0) {
        updateQueueUI();
        showToast(`已清除 ${cleared} 个已完成项目`);
    } else {
        showToast('没有已完成的项目', 'info');
    }
};

window.clearFailedItems = function() {
    const beforeLength = state.fileQueue.length;
    state.fileQueue = state.fileQueue.filter(q => q.status !== 'failed');
    const cleared = beforeLength - state.fileQueue.length;
    if (cleared > 0) {
        updateQueueUI();
        showToast(`已清除 ${cleared} 个失败项目`);
    } else {
        showToast('没有失败的项目', 'info');
    }
};

window.clearQueue = function() {
    if (state.processing) {
        showToast('正在处理中，请等待处理完成后再清空', 'warning');
        return;
    }
    if (state.fileQueue.length === 0) {
        showToast('队列为空，无需清空', 'info');
        return;
    }
    showDeleteConfirmModal({
        title: '确认清空队列',
        message: `队列中共有 ${state.fileQueue.length} 项，确定要清空吗？`,
        warning: '所有项目将被从队列中移除'
    }, () => {
        state.fileQueue = [];
        updateQueueUI();
        showToast('队列已清空');
    });
};
