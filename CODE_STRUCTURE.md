# 代码结构说明 - Medical OCR Pro

## 文件结构

```
electron-web-wrapper/
├── medical-ocr-pro.html          # 主HTML文件
├── css/
│   └── pro-style.css             # 所有样式
├── js/
│   ├── pro-state.js              # 状态管理
│   ├── pro-parser.js             # Markdown解析
│   ├── pro-files.js              # 文件操作
│   ├── pro-queue-ops.js          # 队列操作
│   ├── pro-queue-ui.js           # 队列UI渲染
│   ├── pro-ocr.js                # OCR API调用
│   ├── pro-export-excel.js       # Excel导出
│   ├── pro-export-csv.js         # CSV导出
│   ├── pro-export-entry.js       # 导出入口
│   ├── pro-export-modal.js       # 导出模态框
│   ├── pro-data-backup.js        # 备份导入
│   ├── pro-data-dedup.js         # 去重
│   ├── pro-dashboard.js          # 仪表板UI
│   ├── pro-table.js              # 记录表格
│   ├── pro-tabs.js               # 标签页导航
│   ├── pro-compare-render.js     # 对比视图渲染
│   ├── pro-image-drag.js         # 图片拖拽
│   ├── pro-events-config.js      # 配置事件
│   ├── pro-events-upload.js      # 上传事件
│   ├── pro-events-tabs.js        # 标签页事件
│   ├── pro-events-search.js      # 搜索筛选事件
│   ├── pro-events-select.js      # 选择框事件
│   ├── pro-events-pagination.js  # 分页事件
│   ├── pro-events-batch.js       # 批量操作事件
│   ├── pro-events-compare-nav.js     # 对比导航事件
│   ├── pro-events-compare-filter.js  # 对比筛选事件
│   ├── pro-events-compare-actions.js  # 对比操作事件
│   ├── pro-events-keyboard.js    # 键盘快捷键
│   └── pro-init.js               # 初始化
├── main-pro.js                   # Electron 主进程
├── preload-pro.js                # Electron 预加载脚本
├── config.json                   # 应用配置
├── build-config.js               # 构建配置
└── package.json                  # 项目配置
```

## 模块说明

### JavaScript 模块 (29个)

| 模块 | 行数 | 职责 |
|------|------|------|
| **pro-events-tabs.js** | 8 | 标签页点击事件 |
| **pro-events-select.js** | 10 | 全选框事件 |
| **pro-events-search.js** | 14 | 搜索筛选事件 |
| **pro-events-compare-nav.js** | 19 | 对比视图导航 |
| **pro-export-entry.js** | 25 | 导出入口函数 |
| **pro-init.js** | 26 | 应用初始化 |
| **pro-tabs.js** | 36 | 标签页切换逻辑 |
| **pro-events-compare-actions.js** | 36 | 对比操作按钮 |
| **pro-events-pagination.js** | 38 | 分页按钮事件 |
| **pro-export-modal.js** | 39 | 导出模态框事件 |
| **pro-events-compare-filter.js** | 46 | 对比筛选事件 |
| **pro-dashboard.js** | 50 | 仪表板UI |
| **pro-image-drag.js** | 50 | 图片拖拽 |
| **pro-parser.js** | 52 | Markdown解析 |
| **pro-events-config.js** | 53 | Token配置事件 |
| **pro-queue-ops.js** | 58 | 队列操作 |
| **pro-export-csv.js** | 59 | CSV导出 |
| **pro-events-upload.js** | 71 | 上传事件 |
| **pro-export-excel.js** | 75 | Excel导出 |
| **pro-queue-ui.js** | 80 | 队列UI渲染 |
| **pro-state.js** | 85 | 状态管理 |
| **pro-events-batch.js** | 113 | 批量操作事件 |
| **pro-table.js** | 113 | 记录表格渲染 |
| **pro-data-backup.js** | 127 | 备份导入 |
| **pro-files.js** | 130 | 文件操作 |
| **pro-ocr.js** | 130 | OCR调用 |
| **pro-events-keyboard.js** | 139 | 键盘快捷键 |
| **pro-data-dedup.js** | 156 | 去重 |
| **pro-compare-render.js** | 208 | 对比视图渲染 |

### 模块分类

#### 核心基础模块 (6个)
```
pro-state.js        # 状态管理
pro-parser.js       # Markdown解析
pro-files.js        # 文件操作
pro-queue-ops.js    # 队列操作
pro-queue-ui.js     # 队列UI渲染
pro-ocr.js          # OCR API调用
```

#### 导出模块 (4个)
```
pro-export-excel.js  # Excel导出
pro-export-csv.js    # CSV导出
pro-export-entry.js  # 导出入口
pro-export-modal.js  # 导出模态框
```

#### 数据管理模块 (2个)
```
pro-data-backup.js   # 备份/导入
pro-data-dedup.js    # 去重
```

#### UI渲染模块 (5个)
```
pro-dashboard.js      # 仪表板UI
pro-table.js          # 记录表格
pro-tabs.js           # 标签页导航
pro-compare-render.js # 对比视图渲染
pro-image-drag.js     # 图片拖拽
```

#### 事件处理模块 (11个)
```
pro-events-config.js           # Token配置事件
pro-events-upload.js           # 上传事件
pro-events-tabs.js             # 标签页事件
pro-events-search.js           # 搜索筛选事件
pro-events-select.js           # 选择框事件
pro-events-pagination.js       # 分页事件
pro-events-batch.js            # 批量操作事件
pro-events-compare-nav.js      # 对比导航事件
pro-events-compare-filter.js   # 对比筛选事件
pro-events-compare-actions.js  # 对比操作事件
pro-events-keyboard.js         # 键盘快捷键
```

#### 初始化模块 (1个)
```
pro-init.js         # 应用初始化
```

## 优化成果

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| **模块数量** | 7个 | 29个 | +314% |
| **最大模块行数** | 540行 | 208行 | -61% |
| **平均模块行数** | ~180行 | ~72行 | -60% |
| **最小模块** | - | 8行 | 新增 |
| **总代码行数** | ~2100行 | ~2100行 | 保持 |

## 模块加载顺序

```html
<!-- 1. 基础状态 -->
<script src="js/pro-state.js"></script>

<!-- 2. 核心功能模块 -->
<script src="js/pro-parser.js"></script>
<script src="js/pro-files.js"></script>
<script src="js/pro-queue-ops.js"></script>
<script src="js/pro-queue-ui.js"></script>
<script src="js/pro-ocr.js"></script>

<!-- 3. 导出功能模块 -->
<script src="js/pro-export-excel.js"></script>
<script src="js/pro-export-csv.js"></script>
<script src="js/pro-export-entry.js"></script>
<script src="js/pro-export-modal.js"></script>

<!-- 4. 数据管理模块 -->
<script src="js/pro-data-backup.js"></script>
<script src="js/pro-data-dedup.js"></script>

<!-- 5. UI渲染模块 -->
<script src="js/pro-dashboard.js"></script>
<script src="js/pro-table.js"></script>
<script src="js/pro-tabs.js"></script>
<script src="js/pro-compare-render.js"></script>
<script src="js/pro-image-drag.js"></script>

<!-- 6. 事件处理模块 -->
<script src="js/pro-events-config.js"></script>
<script src="js/pro-events-upload.js"></script>
<script src="js/pro-events-tabs.js"></script>
<script src="js/pro-events-search.js"></script>
<script src="js/pro-events-select.js"></script>
<script src="js/pro-events-pagination.js"></script>
<script src="js/pro-events-batch.js"></script>
<script src="js/pro-events-compare-nav.js"></script>
<script src="js/pro-events-compare-filter.js"></script>
<script src="js/pro-events-compare-actions.js"></script>
<script src="js/pro-events-keyboard.js"></script>

<!-- 7. 初始化模块 -->
<script src="js/pro-init.js"></script>
```

## 开发指南

### 修改功能

| 功能类型 | 对应模块 |
|----------|----------|
| 状态管理 | `pro-state.js` |
| OCR解析 | `pro-parser.js` |
| 文件操作 | `pro-files.js` |
| 队列操作 | `pro-queue-ops.js` |
| 队列UI | `pro-queue-ui.js` |
| OCR调用 | `pro-ocr.js` |
| Excel导出 | `pro-export-excel.js` |
| CSV导出 | `pro-export-csv.js` |
| 导出UI | `pro-export-modal.js` |
| 备份导入 | `pro-data-backup.js` |
| 去重 | `pro-data-dedup.js` |
| 仪表板 | `pro-dashboard.js` |
| 表格 | `pro-table.js` |
| 标签页 | `pro-tabs.js` |
| 对比视图 | `pro-compare-render.js` |
| 图片拖拽 | `pro-image-drag.js` |

### 修改事件

| 事件类型 | 对应模块 |
|----------|----------|
| Token配置 | `pro-events-config.js` |
| 上传 | `pro-events-upload.js` |
| 标签页 | `pro-events-tabs.js` |
| 搜索 | `pro-events-search.js` |
| 选择 | `pro-events-select.js` |
| 分页 | `pro-events-pagination.js` |
| 批量操作 | `pro-events-batch.js` |
| 对比导航 | `pro-events-compare-nav.js` |
| 对比筛选 | `pro-events-compare-filter.js` |
| 对比操作 | `pro-events-compare-actions.js` |
| 快捷键 | `pro-events-keyboard.js` |

## Electron 打包

```bash
npm run dev       # 开发模式
npm start         # 生产模式
npm run build:win # Windows打包
```

## 项目文件清单

### 核心文件
- `medical-ocr-pro.html` - 主HTML文件
- `main-pro.js` - Electron主进程
- `preload-pro.js` - Electron预加载脚本
- `config.json` - 应用配置
- `package.json` - 项目配置

### 资源目录
- `css/` - 样式文件目录
- `js/` - JavaScript模块目录
- `assets/` - 静态资源目录

### 文档文件
- `CODE_STRUCTURE.md` - 代码结构说明
- `README.md` - 项目说明文档

## 设计原则

1. **单一职责** - 每个模块只负责一个功能点
2. **最小依赖** - 模块间依赖关系清晰
3. **事件分离** - 事件按功能区域分离到独立模块
4. **UI与逻辑分离** - 渲染、操作、事件分别处理
5. **可测试性** - 小模块更易于单元测试
6. **动态事件绑定** - 动态创建的元素在渲染时绑定事件
