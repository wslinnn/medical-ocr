# 医疗病例 OCR 系统改进建议

> 产品经理视角的用户体验优化建议
> 创建时间：2026-03-07

---

## 📋 改进建议总览

本文档针对 `medical-ocr-pro.html` 提出用户体验改进建议，按优先级分类。

---

## 一、视觉与界面优化

| 优先级 | 问题 | 建议 |
|--------|------|------|
| 🔴 P0 | 使用 emoji 作为图标 | 替换为专业 SVG 图标（Heroicons/Lucide），如 🏥 → `<svg>...</svg>` |
| 🟡 P1 | 状态徽章颜色对比度低 | 增强色彩区分度，添加图标辅助（待审核=时钟图标，已审核=勾选图标） |
| 🟡 P1 | 界面留白不统一 | 统一卡片间距、按钮高度、输入框高度等设计规范 |
| 🟢 P2 | 缺少品牌感 | 添加专业 logo 设计，统一字体层级 |

### 详细说明

#### 1.1 图标系统改造

**当前代码示例：**
```html
<h1>🏥 医疗病例 OCR 识别系统 Pro</h1>
<h3>🔑 API 配置</h3>
<h3>📁 上传病历文件</h3>
```

**建议改为：**
```html
<h1>
  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
  </svg>
  医疗病例 OCR 识别系统 Pro
</h1>
```

---

## 二、核心交互优化

### 2.1 对比视图增强

**当前问题：**
- 图片缩放只支持50%-200%步进
- 无法旋转图片（病历常常方向不对）
- 无法适应窗口大小
- 编辑后每次 blur 都弹出"已保存"提示（太频繁）

**建议：**

| 功能 | 说明 |
|------|------|
| 适应窗口 | 一键将图片缩放到正好填满左侧面板 |
| 实际尺寸 | 显示图片原始大小（1:1） |
| 适应宽度 | 图片宽度适配面板，高度可滚动 |
| 左旋转 | 向左旋转90° |
| 右旋转 | 向右旋转90° |
| 静默保存 | 去除频繁toast，改为右上角小图标提示 |

**新增UI设计：**
```
┌─────────────────────────────────────────────────┐
│ 原图预览                    [−] 100% [+] [↺] [↻] │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │              [病历图片]                      │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│            [适应窗口] [实际尺寸] [适应宽度]      │
└─────────────────────────────────────────────────┘
```

### 2.2 批量操作

**当前缺失：**
- 记录视图有复选框，但没有批量操作按钮
- 无法批量更改状态
- 无法批量删除

**建议添加的功能：**

```
┌────────────────────────────────────────────────────────────┐
│ 识别记录                                    [已选择 X 项]   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [搜索...] [状态筛选▼] [批量审核] [批量标记] [批量导出] [×批量删除] │
└────────────────────────────────────────────────────────────┘
```

| 按钮ID | 功能 | 确认方式 |
|--------|------|----------|
| `btn-batch-review` | 批量标记为已审核 | 无需确认 |
| `btn-batch-flag` | 批量标记为需复核 | 无需确认 |
| `btn-batch-export` | 批量导出选中项 | 无需确认 |
| `btn-batch-delete` | 批量删除 | 二次确认弹窗 |

### 2.3 文件队列优化

**当前问题：**
- 处理中无法取消单个任务
- 失败后重试需要重新选择文件

**建议添加：**

| 状态 | 可操作按钮 |
|------|-----------|
| 等待中 | 移除 (✕) |
| 处理中 | 取消 (⏹) |
| 失败 | 重试 (🔄) / 移除 (✕) |
| 已完成 | 移除 (✕) |

---

## 三、功能增强

### 3.1 数据完整性

```
建议添加：
- [ ] 导出时自动附带原图（可选）
- [ ] 导出时包含原始OCR文本（当前只展示前300字）
- [ ] 支持导入之前导出的Excel（数据恢复）
- [ ] 一键备份所有数据（打包成zip）
```

**导出选项面板设计：**
```
┌─────────────────────────────────────┐
│         导出选项                     │
├─────────────────────────────────────┤
│ ☑ 包含原始图片（会增加文件大小）     │
│ ☑ 包含完整OCR文本                   │
│ ☑ 包含原始Markdown                  │
│                                     │
│     [取消]           [开始导出]      │
└─────────────────────────────────────┘
```

### 3.2 识别体验

**当前问题：**
- 识别开始后没有预计时间
- 不知道当前处理到哪个文件
- 错误信息不详细

**建议：**

| 增强项 | 当前 | 建议 |
|--------|------|------|
| 进度显示 | `处理中...` | `处理中 (3/10) - 预计剩余 2分钟` |
| 当前文件 | 无高亮 | 正在处理的文件高亮+动画 |
| 错误详情 | `识别失败` | `Token已失效，请重新配置` |
| 跳过功能 | 无 | 处理失败时可选择跳过继续 |

### 3.3 数据管理

```
建议添加：
- [ ] 数据去重功能（按姓名+诊断判断重复）
- [ ] 清空所有数据（带二次确认）
- [ ] LocalStorage 容量提示
- [ ] 定期自动备份提示
```

**去重检测结果展示：**
```
┌──────────────────────────────────────────┐
│  检测到 3 组重复记录，共 7 条             │
│  ┌────────────────────────────────────┐  │
│  │ 张三 - 左乳结节 (2条)              │  │
│  │   2026-03-07 10:23  [保留] [删除]  │  │
│  │   2026-03-07 14:15  [保留] [删除]  │  │
│  ├────────────────────────────────────┤  │
│  │ 李四 - 甲状腺结节 (3条)            │  │
│  │   ...                               │  │
│  └────────────────────────────────────┘  │
│                                          │
│    [全部保留新]  [全部保留旧]  [手动选择] │
└──────────────────────────────────────────┘
```

---

## 四、性能优化

```
当前潜在问题：
- 大量记录时表格渲染卡顿
- 大图片缩放可能卡顿
- 图片base64存储占用大量LocalStorage

建议：
- [ ] 表格分页（当前无分页）
- [ ] 虚拟滚动（记录超过100条时）
- [ ] 图片缩放使用CSS transform + will-change
- [ ] 图片懒加载（对比视图切换时再加载）
- [ ] IndexedDB 存储替代 LocalStorage（容量更大）
```

### 分页实现建议

```javascript
// 分页配置
const pagination = {
    pageSize: 50,
    currentPage: 1,
    get totalPages() {
        return Math.ceil(state.records.length / this.pageSize);
    },
    get paginatedRecords() {
        const start = (this.currentPage - 1) * this.pageSize;
        return state.records.slice(start, start + this.pageSize);
    }
};
```

---

## 五、快捷键增强

**当前已有：**
| 快捷键 | 功能 |
|--------|------|
| ← → | 切换对比记录 |
| ESC | 关闭弹窗 |

**建议添加：**

| 快捷键 | 功能 | 作用域 |
|--------|------|--------|
| Ctrl+N | 新建识别（切换到上传页） | 全局 |
| Ctrl+E | 导出Excel | 记录视图 |
| Ctrl+F | 搜索框聚焦 | 记录视图 |
| Ctrl+1/2/3 | 切换三个标签页 | 全局 |
| Ctrl+Enter | 确认审核 | 对比视图 |
| Ctrl+Shift+F | 标记需复核 | 对比视图 |
| Delete | 删除当前对比记录 | 对比视图 |
| Ctrl+0 | 图片恢复100% | 对比视图 |
| Ctrl++ | 放大图片 | 对比视图 |
| Ctrl+- | 缩小图片 | 对比视图 |

---

## 六、错误处理与反馈

### 6.1 错误提示优化

```
当前问题：
- Token失效时只会显示"识别失败"
- 网络断开时没有明确提示
- 图片格式不支持时无说明

建议：
- Token失效时显眼提示并提供重新输入入口
- 网络状态监测，断网时禁用识别按钮并提示
- 不支持的文件格式在选择时即可过滤并提示
- 添加"测试Token"按钮，验证API可用性
```

**Token测试功能设计：**

```html
<div class="flex items-center gap-2">
    <input type="password" id="api-token" placeholder="输入 API Token">
    <button id="test-token" class="px-4 py-2 bg-blue-500 text-white rounded">测试</button>
    <button id="save-token" class="px-4 py-2 bg-gray-800 text-white rounded">保存</button>
    <span id="token-status" class="text-sm"></span>
</div>

<script>
document.getElementById('test-token').onclick = async () => {
    const token = dom.apiToken.value.trim();
    if (!token) {
        showToast('请输入 API Token', 'error');
        return;
    }

    const statusEl = document.getElementById('token-status');
    statusEl.textContent = '测试中...';

    try {
        const response = await fetch('https://dcgdvdfb03f3d3jd.aistudio-app.com/layout-parsing', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file: '', // 空请求测试
                fileType: 1
            })
        });

        if (response.status === 401) {
            statusEl.innerHTML = '<span class="text-red-500">✗ Token 无效</span>';
        } else if (response.status === 200) {
            statusEl.innerHTML = '<span class="text-green-500">✓ Token 有效</span>';
        } else {
            statusEl.innerHTML = '<span class="text-yellow-500">! API 异常</span>';
        }
    } catch (error) {
        statusEl.innerHTML = '<span class="text-red-500">✗ 网络错误</span>';
    }
};
</script>
```

### 6.2 网络状态监测

```javascript
// 在 init 中添加
window.addEventListener('online', () => {
    showToast('网络已连接', 'success');
    updateNetworkStatus();
});

window.addEventListener('offline', () => {
    showToast('网络已断开，识别功能暂时不可用', 'error');
    updateNetworkStatus();
});

function updateNetworkStatus() {
    const isOnline = navigator.onLine;
    const startBtn = document.getElementById('btn-start-all');

    if (!isOnline) {
        startBtn.disabled = true;
        startBtn.textContent = '网络断开';
    } else if (state.fileQueue.filter(q => q.status === 'pending').length > 0) {
        startBtn.disabled = false;
        startBtn.textContent = '开始识别';
    }
}
```

---

## 七、工作流优化

```
建议添加：
- [ ] 首次启动检测Token，没有则引导配置
- [ ] 完成一批识别后自动询问"是否继续处理更多文件"
- [ ] 对比视图筛选"需审核"时，审核完自动跳到下一条
- [ ] 添加"今日概览"卡片：今日识别X条，已审核Y条
```

### 今日概览卡片设计

```html
<div class="grid grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
        <div class="text-sm text-gray-500">今日识别</div>
        <div class="text-2xl font-bold text-blue-600" id="today-count">0</div>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
        <div class="text-sm text-gray-500">待审核</div>
        <div class="text-2xl font-bold text-yellow-600" id="pending-count">0</div>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
        <div class="text-sm text-gray-500">已审核</div>
        <div class="text-2xl font-bold text-green-600" id="reviewed-count">0</div>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
        <div class="text-sm text-gray-500">需复核</div>
        <div class="text-2xl font-bold text-red-600" id="flagged-count">0</div>
    </div>
</div>
```

---

## 🎯 优先级排序建议

### 必做（P0）- 影响核心使用

| 序号 | 功能 | 影响范围 |
|------|------|----------|
| 1 | 批量操作按钮（批量审核、批量导出） | 效率提升显著 |
| 2 | 错误提示优化（Token失效、网络错误） | 避免用户困惑 |
| 3 | 对比视图图片旋转功能 | 病历图片常需旋转 |
| 4 | 表格分页或虚拟滚动 | 数据量大时必需 |

### 应做（P1）- 显著提升体验

| 序号 | 功能 | 影响范围 |
|------|------|----------|
| 5 | SVG 图标替换 emoji | 专业感提升 |
| 6 | 静默保存（去除频繁toast） | 减少打扰 |
| 7 | 数据备份/导出完整文本 | 数据安全 |
| 8 | 处理队列的取消/重试 | 灵活性提升 |
| 9 | 快捷键扩展 | 效率提升 |

### 可做（P2）- 锦上添花

| 序号 | 功能 | 影响范围 |
|------|------|----------|
| 10 | 去重功能 | 数据质量 |
| 11 | 适应窗口按钮 | 便利性 |
| 12 | 今日概览卡片 | 直观了解进度 |
| 13 | 数据恢复导入 | 容错性 |
| 14 | IndexedDB 替代 LocalStorage | 可扩展性 |

---

## 附录：实现参考

### A. 批量操作代码框架

```javascript
// 获取选中的记录ID
function getSelectedRecordIds() {
    return Array.from(document.querySelectorAll('.record-checkbox:checked'))
        .map(cb => parseFloat(cb.dataset.id));
}

// 批量审核
document.getElementById('btn-batch-review').onclick = () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    ids.forEach(id => {
        const record = state.records.find(r => r.id === id);
        if (record) record.status = 'reviewed';
    });

    saveRecords();
    renderRecords();
    showToast(`已审核 ${ids.length} 条记录`);
};

// 批量删除
document.getElementById('btn-batch-delete').onclick = () => {
    const ids = getSelectedRecordIds();
    if (ids.length === 0) {
        showToast('请先选择记录', 'warning');
        return;
    }

    if (confirm(`确定要删除选中的 ${ids.length} 条记录吗？`)) {
        state.records = state.records.filter(r => !ids.includes(r.id));
        saveRecords();
        renderRecords();
        updateRecentResults();
        showToast(`已删除 ${ids.length} 条记录`);
    }
};
```

### B. 图片旋转代码框架

```javascript
// 状态中添加旋转角度
const state = {
    // ...
    imageRotation: 0,  // 新增
    imageFit: 'contain'  // 新增: contain, cover, fill
};

// 旋转函数
function rotateImage(direction) {
    state.imageRotation += direction === 'left' ? -90 : 90;
    updateImageTransform();
}

// 更新图片变换
function updateImageTransform() {
    const img = dom.imageContainer.querySelector('img');
    if (img) {
        img.style.transform = `rotate(${state.imageRotation}deg) scale(${state.imageZoom / 100})`;
    }
}

// 适应窗口
function fitImageToWindow() {
    state.imageZoom = 100;
    state.imageRotation = 0;
    updateImageTransform();
    // ... 计算适应比例
}
```

---

*文档版本：v1.0*
*最后更新：2026-03-07*
