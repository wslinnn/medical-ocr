/**
 * 医疗病例 AI 识别系统 Pro - 队列UI渲染模块
 * Medical AI Pro - Queue UI Rendering Module
 */

function updateQueueUI() {
    dom.queueCount.textContent = `${state.fileQueue.length} 个文件`;
    const completed = state.fileQueue.filter(f => f.status === 'completed').length;
    const processing = state.fileQueue.filter(f => f.status === 'processing').length;
    const pending = state.fileQueue.filter(f => f.status === 'pending').length;
    const failed = state.fileQueue.filter(f => f.status === 'failed').length;

    // Find currently processing item
    const processingItem = state.fileQueue.find(f => f.status === 'processing');

    // Update progress bar
    if (completed + processing + pending > 0) {
        dom.queueProgress.classList.remove('hidden');
        dom.progressBar.style.width = ((completed + failed) / state.fileQueue.length * 100) + '%';

        // Show current processing file and progress
        if (processingItem) {
            dom.progressText.textContent = `正在处理: ${processingItem.file.name}`;
            dom.progressCounts.textContent = `已完成:${completed} | 处理中:${processing} | 待处理:${pending}${failed > 0 ? ' | 失败:' + failed : ''}`;
        } else {
            dom.progressText.textContent = failed > 0 ? '部分失败' : '已完成';
            dom.progressCounts.textContent = `已完成:${completed} | 待处理:${pending}${failed > 0 ? ' | 失败:' + failed : ''}`;
        }
    } else {
        dom.queueProgress.classList.add('hidden');
    }

    document.getElementById('btn-start-all').disabled = pending === 0;

    // Empty state
    if (state.fileQueue.length === 0) {
        dom.fileQueue.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-gray-400">队列中暂无文件</p>
                <p class="text-sm text-gray-400 mt-1">点击上方按钮选择文件或拖拽文件到此处</p>
            </div>
        `;
        return;
    }

    // Status configuration
    const statusConfig = {
        pending: { text: '等待中', icon: '⏱' },
        processing: { text: '处理中...', icon: '⏳' },
        completed: { text: '完成', icon: '✓' },
        failed: { text: '失败', icon: '✗' }
    };

    dom.fileQueue.innerHTML = state.fileQueue.map(item => {
        const statusClass = item.status;
        const statusInfo = statusConfig[item.status];
        const thumbnail = item.thumbnail
            ? `<img src="${item.thumbnail}" class="queue-thumbnail">`
            : '<svg class="queue-thumbnail" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" stroke="currentColor" class="w-6 h-6 text-gray-400" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>';

        // Action buttons based on status
        let actionButton = '';
        if (item.status === 'pending') {
            actionButton = `<button class="text-red-500 hover:text-red-700 p-1" onclick="removeFromQueue(${item.id})" title="移除">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>`;
        } else if (item.status === 'processing') {
            actionButton = `<button class="text-orange-500 hover:text-orange-700 p-1" onclick="cancelProcessing()" title="取消处理">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </button>`;
        } else if (item.status === 'failed') {
            actionButton = `<button class="text-blue-500 hover:text-blue-700 p-1" onclick="retryItem(${item.id})" title="重试">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
            </button>`;
        }

        // Highlight processing item
        const isProcessing = item.status === 'processing';
        const processingClass = isProcessing ? 'ring-2 ring-blue-500 bg-blue-50' : '';

        return `
            <div class="queue-item ${statusClass} ${processingClass}">
                ${thumbnail}
                <div class="flex-1 min-w-0">
                    <div class="truncate">${item.file.name}</div>
                    ${item.status === 'failed' ? `
                        <div class="text-xs text-red-500 font-medium">${item.error || '识别失败'}</div>
                        ${item.errorDetails ? `<div class="text-xs text-gray-500 mt-0.5">${item.errorDetails}</div>` : ''}
                    ` : ''}
                    ${isProcessing ? `<div class="text-xs text-blue-600 animate-pulse">正在识别...</div>` : ''}
                </div>
                <span class="status-badge ${statusClass}">${statusInfo.icon} ${statusInfo.text}</span>
                ${actionButton}
            </div>
        `;
    }).join('');
}
