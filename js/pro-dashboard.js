/**
 * 医疗病例 OCR 识别系统 Pro - 仪表板UI模块
 * Medical OCR Pro - Dashboard UI Module
 */

// ============================================================================
// RECENT RESULTS
// ============================================================================
function updateRecentResults() {
    const recent = state.records.slice(0, 5);
    if (recent.length === 0) {
        dom.recentResults.innerHTML = `
            <div class="text-center py-12">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-gray-400 font-medium">暂无识别结果</p>
                <p class="text-sm text-gray-400 mt-2">请先上传文件进行 OCR 识别</p>
            </div>
        `;
        return;
    }

    dom.recentResults.innerHTML = recent.map(r => `
        <div class="bg-gray-50 rounded-lg p-4 mb-3 hover:bg-gray-100 cursor-pointer" onclick="viewRecord(${r.id})">
            <div class="flex justify-between mb-2">
                <span class="font-medium">${r.name}</span>
                <span class="text-xs text-gray-500">${new Date(r.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            <div class="text-sm text-gray-600">${r.diagnosis}</div>
            <div class="mt-2">
                <span class="status-badge ${r.status}">${r.status === 'pending' ? '待审核' : r.status === 'reviewed' ? '已审核' : '需复核'}</span>
            </div>
        </div>
    `).join('');
}

// ============================================================================
// STATISTICS
// ============================================================================
function updateStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = state.records.filter(r => {
        const recordDate = new Date(r.createdAt);
        return recordDate >= today;
    });

    const pendingCount = state.records.filter(r => r.status === 'pending').length;
    const reviewedCount = state.records.filter(r => r.status === 'reviewed').length;
    const flaggedCount = state.records.filter(r => r.status === 'flagged').length;

    document.getElementById('today-count').textContent = todayRecords.length;
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('reviewed-count').textContent = reviewedCount;
    document.getElementById('flagged-count').textContent = flaggedCount;
}
