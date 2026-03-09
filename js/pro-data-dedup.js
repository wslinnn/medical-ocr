/**
 * 医疗病例 AI 识别系统 Pro - 数据去重模块
 * Medical AI Pro - Data Deduplication Module
 */

// ============================================================================
// DEDUPLICATION STATE
// ============================================================================
let duplicateGroups = [];

// ============================================================================
// TEXT NORMALIZATION AND SIMILARITY
// ============================================================================
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, '');  // Remove special chars except Chinese
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
    str1 = normalizeText(str1);
    str2 = normalizeText(str2);
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    const matrix = [];
    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[len2][len1];
}

function calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
}

// ============================================================================
// FIND DUPLICATES
// ============================================================================
document.getElementById('btn-dedup-check').onclick = async () => {
    // Show loading state
    const btn = document.getElementById('btn-dedup-check');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <svg class="animate-spin w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在查重...
    `;

    try {
        // 从数据库查询重复记录（姓名+文件名相同）
        const duplicateRecords = await db.findDuplicates();

        if (!duplicateRecords || duplicateRecords.length === 0) {
            showToast('未发现重复记录', 'success');
            return;
        }

        // 按姓名+文件名分组
        const groupMap = new Map();
        duplicateRecords.forEach(record => {
            const key = `${(record.name || '').toLowerCase()}|${(record.fileName || '').toLowerCase()}`;
            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key).push(record);
        });

        // 转换为数组并按时间排序（最早的在前）
        duplicateGroups = Array.from(groupMap.values())
            .filter(group => group.length > 1)
            .map(group => {
                group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                return group;
            });

        if (duplicateGroups.length === 0) {
            showToast('未发现重复记录', 'success');
            return;
        }

        renderDuplicateGroups();

        const totalCount = duplicateGroups.reduce((sum, group) => sum + group.length, 0);
        document.getElementById('dedup-group-count').textContent = duplicateGroups.length;
        document.getElementById('dedup-total-count').textContent = totalCount;
        document.getElementById('dedup-summary').classList.remove('hidden');
        document.getElementById('dedup-modal').classList.add('active');
    } catch (e) {
        console.error('查重失败:', e);
        showToast('查重失败: ' + e.message, 'error');
    } finally {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

// ============================================================================
// RENDER DUPLICATE GROUPS
// ============================================================================
function renderDuplicateGroups() {
    const container = document.getElementById('dedup-results');
    container.innerHTML = '';

    duplicateGroups.forEach((group, groupIndex) => {
        const record = group[0];
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-50 rounded-lg';

        // Build display text using available fields
        const displayParts = [record.name];
        if (record.postopPathology && record.postopPathology !== '未检出') {
            displayParts.push(record.postopPathology.substring(0, 20));
        } else if (record.biopsyPathology && record.biopsyPathology !== '未检出') {
            displayParts.push(record.biopsyPathology.substring(0, 20));
        }
        const displayText = displayParts.join(' - ');

        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-900">${displayText}</span>
                <span class="text-sm text-gray-500">${group.length} 条重复</span>
            </div>
            <div class="space-y-1">
                ${group.map((r, i) => {
                    const isFirst = i === 0;
                    const isLast = i === group.length - 1;
                    const label = isFirst ? '★ 最旧 (推荐)' : isLast ? '最新' : '重复';
                    return `
                    <div class="flex items-center justify-between text-sm p-2 rounded ${isFirst ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}">
                        <div class="flex items-center gap-2">
                            <span class="${isFirst ? 'text-green-600' : 'text-gray-500'}">${label} - ${new Date(r.createdAt).toLocaleString('zh-CN')}</span>
                            ${r.imageData ? '<span class="text-xs text-blue-500">含图</span>' : ''}
                        </div>
                        <div class="flex gap-1">
                            ${isFirst ? '<span class="text-xs text-green-600">推荐保留</span>' : `
                                <button class="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded" onclick="removeDuplicateRecord(${groupIndex}, ${i})">删除</button>
                            `}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
        container.appendChild(div);
    });
}

// ============================================================================
// REMOVE DUPLICATE RECORD
// ============================================================================
window.removeDuplicateRecord = async function(groupIndex, recordIndex) {
    const group = duplicateGroups[groupIndex];
    const record = group[recordIndex];

    // Delete from database
    try {
        await db.delete(String(record.id));
    } catch (e) {
        console.error('删除记录失败:', e);
        showToast('删除失败', 'error');
        return;
    }

    // 从当前分组中移除
    group.splice(recordIndex, 1);

    // 如果只剩一条，从分组中移除
    if (group.length === 1) {
        duplicateGroups.splice(groupIndex, 1);
    }

    // 更新统计（删除会影响今日数量和状态数量）
    updateTodayCount();
    updateStatusCounts();

    if (duplicateGroups.length === 0) {
        document.getElementById('dedup-modal').classList.remove('active');
        showToast('所有重复记录已处理', 'success');
    } else {
        renderDuplicateGroups();
        const totalCount = duplicateGroups.reduce((sum, g) => sum + g.length, 0);
        document.getElementById('dedup-group-count').textContent = duplicateGroups.length;
        document.getElementById('dedup-total-count').textContent = totalCount;
    }
};

// ============================================================================
// BATCH DEDUP ACTIONS
// ============================================================================
// Keep newest (delete all except the last one in each group - sorted oldest to newest)
document.getElementById('btn-dedup-keep-newer').onclick = async () => {
    const idsToDelete = [];

    // Collect IDs to delete (all except the last/newest in each group)
    duplicateGroups.forEach(group => {
        for (let i = 0; i < group.length - 1; i++) {
            idsToDelete.push(String(group[i].id));
        }
    });

    if (idsToDelete.length === 0) {
        showToast('没有需要删除的记录');
        return;
    }

    // Delete from database (batch)
    try {
        await db.deleteMany(idsToDelete);
    } catch (e) {
        console.error('批量删除失败:', e);
        showToast('删除失败', 'error');
        return;
    }

    // 重新从数据库查询第一页
    await loadRecords();
    renderRecords();

    // 更新统计（删除会影响今日数量和状态数量）
    updateTodayCount();
    updateStatusCounts();

    document.getElementById('dedup-modal').classList.remove('active');
    showToast(`已删除 ${idsToDelete.length} 条重复记录，保留最新的记录`);
};

// Keep oldest (delete all except the first one in each group - sorted oldest to newest)
document.getElementById('btn-dedup-keep-older').onclick = async () => {
    const idsToDelete = [];

    // Collect IDs to delete (all except the first/oldest in each group)
    duplicateGroups.forEach(group => {
        for (let i = 1; i < group.length; i++) {
            idsToDelete.push(String(group[i].id));
        }
    });

    if (idsToDelete.length === 0) {
        showToast('没有需要删除的记录');
        return;
    }

    // Delete from database (batch)
    try {
        await db.deleteMany(idsToDelete);
    } catch (e) {
        console.error('批量删除失败:', e);
        showToast('删除失败', 'error');
        return;
    }

    // 重新从数据库查询第一页
    await loadRecords();
    renderRecords();

    // 更新统计（删除会影响今日数量和状态数量）
    updateTodayCount();
    updateStatusCounts();

    document.getElementById('dedup-modal').classList.remove('active');
    showToast(`已删除 ${idsToDelete.length} 条重复记录，保留最旧的记录`);
};

document.getElementById('btn-dedup-close').onclick = async () => {
    document.getElementById('dedup-modal').classList.remove('active');

    // 重新从数据库查询当前页数据
    await loadRecords();
    renderRecords();
};
