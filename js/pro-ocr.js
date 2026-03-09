/**
 * 医疗病例 AI 识别系统 Pro - AI API 调用模块
 * Medical AI Pro - AI API Module
 */

// ============================================================================
// AI API CONFIGURATION - 千问大模型
// ============================================================================
const OCR_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const OCR_TIMEOUT = 60000; // 60 seconds (VLM needs more time)
const MAX_IMAGE_SIZE = 7 * 1024 * 1024; // 7MB

// 默认提示词
const DEFAULT_PROMPT = '请识别图片内姓名、穿刺病理、TNM分期、手术时间、术后病理、HER2状态、ER状态、ki67这些分类的信息，按照不同分类输出，对于无法确定的就只输出无法确定。注意数据可能不止一侧。只单纯使用JSON格式输出上面原始分类内容，无需嵌套JSON和集合。';

// Get prompt (custom or default) - 从 state 读取（已在启动时加载）
function getPrompt() {
    return state.customPrompt || DEFAULT_PROMPT;
}

// ============================================================================
// QUEUE PROCESSING
// ============================================================================
async function processQueue() {
    if (state.processing) return;

    // Check token
    if (!state.token) {
        showToast('请先配置 API Key', 'error');
        dom.apiToken.focus();
        return;
    }

    // Check network connection
    if (!navigator.onLine) {
        showToast('网络已断开，请检查网络连接', 'error');
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
            // Check file size (only for images, not PDFs)
            const fileSize = currentItem.file.size || 0;
            if (currentItem.file.type && currentItem.file.type.includes('image') && fileSize > MAX_IMAGE_SIZE) {
                throw new Error(`图片过大 (${(fileSize / 1024 / 1024).toFixed(1)}MB)，请使用小于7MB的图片`);
            }

            // Read file as base64
            let fileData;
            let mimeType = currentItem.file.type || 'image/jpeg';

            if (currentItem.file.path) {
                fileData = window.fs.readFileSync(currentItem.file.path).toString('base64');
            } else {
                fileData = await readFileAsBase64(currentItem.file);
            }

            // Call AI API (千问大模型)
            const result = await callOCRAPI(fileData, mimeType);

            // Process result - 千问返回的是content中的文本
            // 简化判断：有响应+能解析到JSON=成功
            if (!result.choices || !result.choices[0] || !result.choices[0].message) {
                throw new Error('API 返回数据格式异常');
            }

            const content = result.choices[0].message.content;
            const parsed = parseQwenResponse(content); // JSON解析失败会抛出错误

            const record = {
                id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                fileName: currentItem.file.name,
                ...parsed,
                originalText: content,
                status: 'pending',
                createdAt: new Date().toISOString(),
                imageData: currentItem.file.type && currentItem.file.type.includes('image') ? await readFileAsDataURL(currentItem.file) : null
            };

            state.records.unshift(record);
            currentItem.status = 'completed';
            currentItem.record = record;
            successCount++;
        } catch (error) {
            console.error('识别失败:', error);

            // 简化判断：有响应=成功解析，无响应=请求失败
            let errorMessage = '识别失败';
            let errorDetails = error.message || '未知错误';

            // 检查是否是 API 返回的错误（千问返回的 error 对象）
            if (error.message && (error.message.includes('Invalid chat format') || error.message.includes('invalid_request_error'))) {
                // API 返回的业务错误，显示更详细的信息
                errorMessage = 'API 请求错误';
                errorDetails = error.message;
            } else if (error.message && error.message.includes('JSON')) {
                // 能解析到响应但JSON格式不对
                errorMessage = '解析失败';
            } else if (!error.message || error.message === '请求失败') {
                // 网络错误或其他
                errorMessage = '请求失败';
            }

            currentItem.status = 'failed';
            currentItem.error = errorMessage;
            currentItem.errorDetails = errorDetails;
            failCount++;
        }

        // 只保存记录，不加载全部数据
        if (currentItem.record) {
            const savedId = await db.save(currentItem.record);
            if (savedId) {
                currentItem.record.id = savedId;
            }
        }

        updateQueueUI();
    }

    state.processing = false;
    disableDataModifyingOperations(false);

    // 处理完成后统一刷新表格和统计
    state.pagination.currentPage = 1;
    await loadRecords();
    renderRecords();

    // 更新统计（今日识别 + 待审核）
    updateTodayCount();
    updateStatusCounts();

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
// AI API CALL - 千问大模型
// ============================================================================
async function callOCRAPI(fileData, mimeType) {
    const response = await fetch(OCR_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${state.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: state.model || 'qwen3.5-plus',
            enable_thinking: false,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${fileData}`
                            }
                        },
                        {
                            type: 'text',
                            text: getPrompt()
                        }
                    ]
                }
            ]
        }),
        signal: AbortSignal.timeout(OCR_TIMEOUT)
    });

    // 有响应 = 成功请求
    if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
    }

    const data = await response.json();

    // Handle business logic error codes in the response body
    if (data.error) {
        // 直接显示 API 返回的 type 和 message
        const errorType = data.error.type || 'error';
        const errorMsg = data.error.message || '未知错误';
        throw new Error(`[${errorType}] ${errorMsg}`);
    }

    return data;
}

// ============================================================================
// PARSE QWEN RESPONSE - 解析千问返回的JSON结果
// ============================================================================
function parseQwenResponse(content) {
    // 尝试从content中提取JSON
    let jsonStr = content;

    // 尝试找到JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }

    // 直接解析JSON，失败则抛出错误
    const parsed = JSON.parse(jsonStr);
    return {
        name: parsed.姓名 || '',
        biopsyPathology: parsed.穿刺病理 || '',
        tnmStage: parsed.TNM分期 || '',
        surgeryTime: parsed.手术时间 || '',
        postopPathology: parsed.术后病理 || '',
        her2Status: parsed.HER2状态 || '',
        erStatus: parsed.ER状态 || '',
        ki67: parsed.ki67 || ''
    };
}
