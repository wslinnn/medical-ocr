/**
 * 医疗病例 AI 识别系统 Pro - 对比视图导航事件
 * Medical AI Pro - Compare View Navigation Events
 */

// 加载指定任务块的数据
async function loadBlock(blockIndex) {
    const pg = state.comparePagination;
    if (pg.isLoading || blockIndex < 0) return false;

    pg.isLoading = true;
    showLoading('加载数据...');

    try {
        const statusFilter = state.compareFilter;
        const pageSize = state.compareBlockSize;
        const page = blockIndex + 1; // 块索引从0开始，页码从1开始

        const result = await db.getPaginatedWithImage({
            page: page,
            pageSize: pageSize,
            search: '',
            status: statusFilter
        });

        state.records = result.records || [];
        pg.currentPage = page;
        pg.total = result.total || 0;
        pg.hasMore = page * pageSize < pg.total;
        state.totalRecords = result.total || 0;
        state.compareCurrentBlock = blockIndex;
        state.compareIndex = 0;

        renderRecords();
        updateStatistics();
        hideLoading();

        return true;
    } catch (e) {
        console.error('加载数据失败:', e);
        hideLoading();
        showToast('加载失败: ' + e.message, 'error');
        return false;
    } finally {
        pg.isLoading = false;
    }
}

// 加载下一任务块
async function loadNextBlock() {
    const pg = state.comparePagination;
    const currentBlock = state.compareCurrentBlock;
    const totalBlocks = Math.ceil(pg.total / state.compareBlockSize);

    if (currentBlock < totalBlocks - 1) {
        return loadBlock(currentBlock + 1);
    }
    return false;
}

// 加载上一任务块
async function loadPrevBlock() {
    if (state.compareCurrentBlock > 0) {
        return loadBlock(state.compareCurrentBlock - 1);
    }
    return false;
}

// 刷新当前块（操作后重新加载）
async function refreshCurrentBlock() {
    return loadBlock(state.compareCurrentBlock);
}

document.getElementById('btn-compare-prev').onclick = async () => {
    if (state.compareIndex > 0) {
        // 当前块内往前翻
        state.compareIndex--;
        updateCompareView();
    } else if (state.compareCurrentBlock > 0) {
        // 翻到上一块
        const loaded = await loadPrevBlock();
        if (loaded) {
            // 跳到最后一条
            state.compareIndex = state.records.length - 1;
            updateCompareView();
        }
    } else {
        showToast('已经是第一条记录了', 'info');
    }
};

document.getElementById('btn-compare-next').onclick = async () => {
    const isLastRecord = state.compareIndex >= state.records.length - 1;

    if (isLastRecord) {
        if (state.comparePagination.hasMore) {
            // 加载下一块
            const loaded = await loadNextBlock();
            if (loaded) {
                state.compareIndex = 0;
                updateCompareView();
            }
        } else {
            showToast('已经到最后一条记录了', 'info');
        }
    } else {
        state.compareIndex++;
        updateCompareView();
    }
};
