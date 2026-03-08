/**
 * 医疗病例 AI 识别系统 Pro - 对比视图操作按钮事件
 * Medical AI Pro - Compare View Action Button Events
 */

// 更新对比审核页面的按钮显示状态
function updateCompareButtonsVisibility() {
    const flagBtn = document.getElementById('btn-compare-flag');
    const reviewBtn = document.getElementById('btn-compare-review');

    // 需复审筛选时不显示需复核按钮
    if (state.compareFilter === 'flagged') {
        flagBtn.classList.add('hidden');
    } else {
        flagBtn.classList.remove('hidden');
    }

    // 已审核筛选时不显示确认审核按钮
    if (state.compareFilter === 'reviewed') {
        reviewBtn.classList.add('hidden');
    } else {
        reviewBtn.classList.remove('hidden');
    }
}

document.getElementById('btn-compare-flag').onclick = async () => {
    const record = getCurrentCompareRecord();
    if (!record) return;

    // 先更新数据库状态
    try {
        await db.updateStatus(String(record.id), 'flagged');
    } catch (e) {
        console.error('Flag error:', e);
        showToast('状态更新失败: ' + e.message, 'error');
        return;
    }

    // 从内存中删除当前记录
    state.records.splice(state.compareIndex, 1);
    state.comparePagination.total--;

    // 如果当前块已空且不是第一块，加载上一块
    if (state.records.length === 0 && state.compareCurrentBlock > 0) {
        await loadPrevBlock();
    } else if (state.compareIndex >= state.records.length) {
        // 如果索引超出范围，重置到最后一条
        state.compareIndex = Math.max(0, state.records.length - 1);
    }

    // 更新状态统计
    updateStatusCounts();
    updateTodayCount();

    updateCompareView();
    updateCompareButtonsVisibility();

    showToast('已标记为需复核', 'info');
};

document.getElementById('btn-compare-review').onclick = async () => {
    const record = getCurrentCompareRecord();
    if (!record) return;

    // 先更新数据库状态
    try {
        await db.updateStatus(String(record.id), 'reviewed');
    } catch (e) {
        console.error('Review error:', e);
        showToast('状态更新失败: ' + e.message, 'error');
        return;
    }

    // 从内存中删除当前记录
    state.records.splice(state.compareIndex, 1);
    state.comparePagination.total--;

    // 如果当前块已空且不是第一块，加载上一块
    if (state.records.length === 0 && state.compareCurrentBlock > 0) {
        await loadPrevBlock();
    } else if (state.compareIndex >= state.records.length) {
        // 如果索引超出范围，重置到最后一条
        state.compareIndex = Math.max(0, state.records.length - 1);
    }

    // 更新状态统计
    updateStatusCounts();
    updateTodayCount();

    updateCompareView();
    updateCompareButtonsVisibility();

    showToast('已确认审核');
};

// ============================================================================
// DELETE BUTTON
// ============================================================================
document.getElementById('btn-compare-delete').onclick = () => {
    const record = getCurrentCompareRecord();
    if (!record) return;

    const name = record.name || '未知';
    showDeleteConfirmModal({
        title: '确认删除',
        message: `确定要删除 "${name}" 吗？`,
        warning: '此操作不可恢复'
    }, async () => {
        try {
            await db.delete(String(record.id));

            // 从内存中删除当前记录
            state.records.splice(state.compareIndex, 1);
            state.comparePagination.total--;

            // 如果当前块已空且不是第一块，加载上一块
            if (state.records.length === 0 && state.compareCurrentBlock > 0) {
                await loadPrevBlock();
            } else if (state.compareIndex >= state.records.length) {
                // 如果索引超出范围，重置到最后一条
                state.compareIndex = Math.max(0, state.records.length - 1);
            }

            // 更新统计
            updateTodayCount();
            updateStatusCounts();

            updateCompareView();
            updateCompareButtonsVisibility();

            showToast('已删除记录');
        } catch (e) {
            console.error('删除失败:', e);
            showToast('删除失败: ' + e.message, 'error');
        }
    });
};
