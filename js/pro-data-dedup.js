/**
 * 医疗病例 OCR 识别系统 Pro - 数据去重模块
 * Medical OCR Pro - Data Deduplication Module
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
document.getElementById('btn-dedup-check').onclick = () => {
    if (state.records.length < 2) {
        showToast('记录少于2条，无需查重', 'info');
        return;
    }

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

    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            performDeduplication();
        } finally {
            // Restore button state
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }, 50);
};

function performDeduplication() {
    const processedRecords = new Set();
    duplicateGroups = [];

    for (let i = 0; i < state.records.length; i++) {
        if (processedRecords.has(i)) continue;

        const record1 = state.records[i];
        const group = [record1];
        processedRecords.add(i);

        // Compare with all other records
        for (let j = i + 1; j < state.records.length; j++) {
            if (processedRecords.has(j)) continue;

            const record2 = state.records[j];

            // Deduplication strategy: Filename + Name
            // Check if both filename and name match (exact match after normalization)
            const fileNameMatch = normalizeText(record1.fileName) === normalizeText(record2.fileName);
            const nameMatch = normalizeText(record1.name) === normalizeText(record2.name);

            // Records are considered duplicates if both filename and name match
            const isDuplicate = fileNameMatch && nameMatch;

            if (isDuplicate) {
                group.push(record2);
                processedRecords.add(j);
            }
        }

        if (group.length > 1) {
            // Sort with oldest first (ascending order) - oldest is the original record
            group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            duplicateGroups.push(group);
        }
    }

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

    // Delete from IndexedDB first
    try {
        await db.delete(record.id);
    } catch (e) {
        console.error('删除记录失败:', e);
        showToast('删除失败', 'error');
        return;
    }

    // Remove from memory
    state.records = state.records.filter(r => r.id !== record.id);
    group.splice(recordIndex, 1);

    if (group.length === 1) {
        duplicateGroups.splice(groupIndex, 1);
    }

    renderRecords();
    updateRecentResults();

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
    let removedCount = 0;
    const idsToDelete = [];

    // Collect IDs to delete (all except the last/newest in each group)
    duplicateGroups.forEach(group => {
        for (let i = 0; i < group.length - 1; i++) {
            idsToDelete.push(group[i].id);
            removedCount++;
        }
    });

    // Delete from IndexedDB
    try {
        for (const id of idsToDelete) {
            await db.delete(id);
        }
    } catch (e) {
        console.error('批量删除失败:', e);
        showToast('删除失败', 'error');
        return;
    }

    // Update memory
    state.records = state.records.filter(r => !idsToDelete.includes(r.id));
    renderRecords();
    updateRecentResults();
    document.getElementById('dedup-modal').classList.remove('active');
    showToast(`已删除 ${removedCount} 条重复记录，保留最新的记录`);
};

// Keep oldest (delete all except the first one in each group - sorted oldest to newest)
document.getElementById('btn-dedup-keep-older').onclick = async () => {
    let removedCount = 0;
    const idsToDelete = [];

    // Collect IDs to delete (all except the first/oldest in each group)
    duplicateGroups.forEach(group => {
        for (let i = 1; i < group.length; i++) {
            idsToDelete.push(group[i].id);
            removedCount++;
        }
    });

    // Delete from IndexedDB
    try {
        for (const id of idsToDelete) {
            await db.delete(id);
        }
    } catch (e) {
        console.error('批量删除失败:', e);
        showToast('删除失败', 'error');
        return;
    }

    // Update memory
    state.records = state.records.filter(r => !idsToDelete.includes(r.id));
    renderRecords();
    updateRecentResults();
    document.getElementById('dedup-modal').classList.remove('active');
    showToast(`已删除 ${removedCount} 条重复记录，保留最旧的记录`);
};

document.getElementById('btn-dedup-close').onclick = () => {
    document.getElementById('dedup-modal').classList.remove('active');
};
