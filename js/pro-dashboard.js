/**
 * 医疗病例 AI 识别系统 Pro - 仪表板UI模块
 * Medical AI Pro - Dashboard UI Module
 */

// ============================================================================
// STATISTICS
// ============================================================================

// 更新今日识别数量（新增/删除记录时调用）
async function updateTodayCount() {
    try {
        const count = await db.getTodayCount();
        const todayCountEl = document.getElementById('today-count');
        if (todayCountEl) todayCountEl.textContent = count;
    } catch (e) {
        console.error('更新今日统计失败:', e);
    }
}

// 更新状态统计（状态修改/删除时调用）
async function updateStatusCounts() {
    try {
        const counts = await db.getStatusCounts();
        const pendingCountEl = document.getElementById('pending-count');
        const reviewedCountEl = document.getElementById('reviewed-count');
        const flaggedCountEl = document.getElementById('flagged-count');

        if (pendingCountEl) pendingCountEl.textContent = counts.pending || 0;
        if (reviewedCountEl) reviewedCountEl.textContent = counts.reviewed || 0;
        if (flaggedCountEl) flaggedCountEl.textContent = counts.flagged || 0;
    } catch (e) {
        console.error('更新状态统计失败:', e);
    }
}

// 完整的统计更新（初始化时使用）
async function updateStatistics() {
    await Promise.all([updateTodayCount(), updateStatusCounts()]);
}
