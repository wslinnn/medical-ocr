/**
 * 医疗病例 AI 识别系统 Pro - 仪表板UI模块
 * Medical AI Pro - Dashboard UI Module
 */

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

    const todayCountEl = document.getElementById('today-count');
    const pendingCountEl = document.getElementById('pending-count');
    const reviewedCountEl = document.getElementById('reviewed-count');
    const flaggedCountEl = document.getElementById('flagged-count');

    if (todayCountEl) todayCountEl.textContent = todayRecords.length;
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (reviewedCountEl) reviewedCountEl.textContent = reviewedCount;
    if (flaggedCountEl) flaggedCountEl.textContent = flaggedCount;
}
