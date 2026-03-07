/**
 * 医疗病例 OCR 识别系统 Pro - OCR API 调用模块
 * Medical OCR Pro - OCR API Module
 */

// ============================================================================
// OCR API CONFIGURATION
// ============================================================================
const OCR_API_URL = 'https://dcgdvdfb03f3d3jd.aistudio-app.com/layout-parsing';
const OCR_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// QUEUE PROCESSING
// ============================================================================
async function processQueue() {
    if (state.processing) return;

    // Check token
    if (!state.token) {
        showToast('请先配置 API Token', 'error');
        dom.apiToken.focus();
        return;
    }

    state.processing = true;
    state.shouldStopProcessing = false;
    state.processStartTime = Date.now(); // Track start time for ETA calculation
    let successCount = 0;
    let failCount = 0;

    // Create a snapshot of the queue to avoid concurrent modification issues
    const queueSnapshot = [...state.fileQueue];

    // Disable data-modifying operations during processing
    disableDataModifyingOperations(true);

    for (const item of queueSnapshot) {
        // Check if should stop
        if (state.shouldStopProcessing) {
            showToast('处理已取消', 'warning');
            break;
        }

        // Find the current item in the actual queue (it may have been modified)
        const currentItem = state.fileQueue.find(q => q.id === item.id);
        if (!currentItem || currentItem.status !== 'pending') continue;

        currentItem.status = 'processing';
        updateQueueUI();

        try {
            // Read file
            let fileData;
            if (currentItem.file.path) {
                fileData = window.fs.readFileSync(currentItem.file.path).toString('base64');
            } else {
                fileData = await readFileAsBase64(currentItem.file);
            }

            // Determine file type
            const fileType = currentItem.file.type && currentItem.file.type.includes('pdf') ? 0 : 1;

            // Call OCR API
            const result = await callOCRAPI(fileData, fileType);

            // Process result
            if (result.result && result.result.layoutParsingResults) {
                const text = result.result.layoutParsingResults[0]?.markdown?.text || '';
                const parsed = parseMarkdown(text);

                const record = {
                    id: generateUniqueId(), // Use the new unique ID generator
                    fileName: currentItem.file.name,
                    ...parsed,
                    originalText: text,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    imageData: currentItem.file.type && currentItem.file.type.includes('image') ? await readFileAsDataURL(currentItem.file) : null
                };

                state.records.unshift(record);
                currentItem.status = 'completed';
                currentItem.record = record;
                successCount++;
            } else {
                if (result.error) {
                    throw new Error(result.error.message || result.error);
                }
                throw new Error('API 返回数据格式异常');
            }
        } catch (error) {
            console.error('识别失败:', error);

            // Determine error type and provide helpful message
            let errorMessage = '识别失败';
            let errorDetails = '';

            if (error.message.includes('Token')) {
                errorMessage = 'Token 无效';
                errorDetails = 'API Token 已过期或无效，请检查配置';
            } else if (error.message.includes('频繁') || error.message.includes('429')) {
                errorMessage = '请求过于频繁';
                errorDetails = 'API 请求次数超限，请稍后重试';
            } else if (error.message.includes('不可用') || error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
                errorMessage = 'API 服务异常';
                errorDetails = 'API 服务暂时不可用，请稍后重试';
            } else if (error.message.includes('超时') || error.message.includes('timeout')) {
                errorMessage = '请求超时';
                errorDetails = '处理时间过长，可能是文件过大或网络问题';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = '网络错误';
                errorDetails = '无法连接到 API 服务器，请检查网络连接';
            } else if (error.message.includes('API 返回数据格式异常')) {
                errorMessage = '返回数据异常';
                errorDetails = 'API 返回的数据格式不正确，可能是文件格式不支持';
            } else {
                // Generic error with original message
                errorMessage = '识别失败';
                errorDetails = error.message || '未知错误';
            }

            currentItem.status = 'failed';
            currentItem.error = errorMessage;
            currentItem.errorDetails = errorDetails; // Store detailed error for display
            failCount++;
        }

        saveRecords();
        updateRecentResults();
        updateQueueUI();
    }

    state.processing = false;
    disableDataModifyingOperations(false);
    showToast(`处理完成: 成功 ${successCount} 条${failCount > 0 ? `, 失败 ${failCount} 条` : ''}`);
}

// ============================================================================
// PROCESSING LOCK - Disable data-modifying operations during processing
// ============================================================================
function disableDataModifyingOperations(disable) {
    // Disable batch operations
    const batchButtons = ['btn-batch-review', 'btn-batch-flag', 'btn-batch-delete', 'btn-batch-export'];
    batchButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = disable;
    });

    // Disable data management buttons
    const dataButtons = ['btn-import-data', 'btn-clear-data'];
    dataButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = disable;
    });

    // Show/hide processing indicator
    const processingIndicator = document.getElementById('processing-indicator');
    if (processingIndicator) {
        if (disable) {
            processingIndicator.classList.remove('hidden');
        } else {
            processingIndicator.classList.add('hidden');
        }
    }
}

// ============================================================================
// OCR API CALL
// ============================================================================
async function callOCRAPI(fileData, fileType) {
    const response = await fetch(OCR_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `token ${state.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file: fileData,
            fileType: fileType,
            useDocOrientationClassify: false,
            useDocUnwarping: false,
            useChartRecognition: false
        }),
        signal: AbortSignal.timeout(OCR_TIMEOUT)
    });

    // Handle specific HTTP status codes
    if (response.status === 401 || response.status === 403) {
        throw new Error('Token 无效或已过期，请重新配置');
    } else if (response.status === 429) {
        throw new Error('API 请求过于频繁，请稍后重试');
    } else if (response.status === 500 || response.status === 502 || response.status === 503) {
        throw new Error('API 服务暂时不可用，请稍后重试');
    } else if (!response.ok) {
        throw new Error(`API 请求失败 (状态码: ${response.status})`);
    }

    return await response.json();
}
