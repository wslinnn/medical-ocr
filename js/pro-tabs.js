/**
 * 医疗病例 AI 识别系统 Pro - 标签页导航模块
 * Medical AI Pro - Tab Navigation Module
 */

// ============================================================================
// TAB NAVIGATION
// ============================================================================

// 显示/隐藏对比审核页面的导航和筛选按钮
function toggleCompareNavButtons(show) {
    // 筛选按钮
    const filterBtns = document.querySelector('.compare-filters');
    if (filterBtns) {
        if (show) {
            filterBtns.classList.remove('hidden');
        } else {
            filterBtns.classList.add('hidden');
        }
    }

    // 上一条/下一条按钮
    const prevBtn = document.getElementById('btn-compare-prev');
    const nextBtn = document.getElementById('btn-compare-next');
    if (prevBtn) {
        if (show) {
            prevBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden');
        }
    }
    if (nextBtn) {
        if (show) {
            nextBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.add('hidden');
        }
    }
}

async function switchTab(tabName) {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + tabName).classList.remove('hidden');
    const batchBar = document.getElementById('batch-actions-bar');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-primary', 'border-b-2', 'border-primary');
        btn.classList.add('text-gray-500');
    });
    const activeTab = document.getElementById('tab-' + tabName);
    activeTab.classList.add('text-primary', 'border-b-2', 'border-primary');
    activeTab.classList.remove('text-gray-500');

    // Records are now displayed in upload view (right panel)
    if (tabName === 'upload') {
        // 清除全选状态和批量操作栏
        if (dom.selectAll) {
            dom.selectAll.checked = false;
            dom.selectAll.indeterminate = false;
        }
        if (batchBar) {
            batchBar.classList.add('hidden');
        }

        // 使用分页查询，加载当前页数据
        state.pagination.currentPage = 1;
        await loadRecords();
        renderRecords();
        updateStatistics();
    }
    if (tabName === 'compare') {
        // 清除全选状态（虽然compare页面没有选择框，但保持统一）
        if (dom.selectAll) {
            dom.selectAll.checked = false;
            dom.selectAll.indeterminate = false;
        }
        if (batchBar) {
            batchBar.classList.add('hidden');
        }

        // 查看模式：不加载列表数据，显示单条记录
        if (state.viewRecordMode) {
            // 隐藏导航和筛选按钮
            toggleCompareNavButtons(false);
            // 初始化对比审核视图
            initCompareView();
            // 直接显示记录（记录已在 viewRecord 中加载）
            return;
        }

        // 正常对比审核模式：确保不是查看模式，重置状态
        state.viewRecordMode = false;
        toggleCompareNavButtons(true);

        // 加载列表数据
        try {
            // 确保数据库已初始化
            await db.init();

            // 重置任务块索引
            state.compareCurrentBlock = 0;
            state.compareIndex = 0;

            // 使用任务块模式查询，每块20条
            // pending: 待审核, flagged: 需复审, reviewed: 已审核
            const statusFilter = state.compareFilter || 'pending';
            const blockSize = state.compareBlockSize;

            const result = await db.getPaginatedWithImage({
                page: 1,
                pageSize: blockSize,
                search: '',
                status: statusFilter
            });

            // 更新分页状态
            state.comparePagination.total = result.total || 0;
            state.comparePagination.hasMore = result.records.length < result.total;

            state.records = result.records || [];
            state.totalRecords = result.total || 0;

            renderRecords();
            updateStatistics();

            // 显示导航和筛选按钮
            toggleCompareNavButtons(true);

            // 如果查看指定记录，找到其索引
            if (state.viewRecordId) {
                const viewId = String(state.viewRecordId);
                const index = state.records.findIndex(r => String(r.id) === viewId);
                if (index >= 0) {
                    state.compareIndex = index;
                } else {
                    state.compareIndex = 0;
                }
                state.viewRecordId = null;
            } else if (state.records.length > 0) {
                if (state.compareIndex < 0 || state.compareIndex >= state.records.length) {
                    state.compareIndex = 0;
                }
            }

            initCompareView();
        } catch (e) {
            console.error('切换到对比审核页时出错:', e);
            showToast('加载数据失败: ' + e.message, 'error');
        }
    }
}

// Global viewRecord function - 查看单条记录
window.viewRecord = async function(id) {
    // 根据ID从数据库查询记录
    const record = await db.getById(id);
    if (!record) {
        showToast('未找到记录', 'error');
        return;
    }

    // 设置为查看模式（隐藏导航和筛选按钮）
    state.viewRecordMode = true;
    state.viewRecordId = String(id);

    // 存储当前查看的记录
    currentViewRecord = record;

    // 切换到对比审核页面
    await switchTab('compare');

    // 显示记录
    if (typeof renderCompareContent === 'function') {
        renderCompareContent(record);
    }
};
