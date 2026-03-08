const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// ==================== 内存优化配置 ====================

// 1. 关闭硬件加速（显著减少内存占用）
app.disableHardwareAcceleration();

// 2. 启用 Chromium 内存优化参数
app.commandLine.appendSwitch('force-fieldtrials', 'SlimmingBrowsing/Enabled/');
app.commandLine.appendSwitch('disable-features', 'V8CacheOptions');
app.commandLine.appendSwitch('enable-features', 'MemoryPressureHandling');

// 3. 限制渲染进程数量
app.commandLine.appendSwitch('renderer-process-limit', '3');

// 4. 禁用不必要的功能（减少内存占用）
app.commandLine.appendSwitch('disable-remote-fonts');
app.commandLine.appendSwitch('disable-plugins');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('disable-translate');

// 5. 启用垃圾回收参数
app.commandLine.appendSwitch('expose-gc');

// 开发环境下完全禁用安全警告
if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  app.commandLine.appendSwitch('--disable-web-security');
  app.commandLine.appendSwitch('--allow-running-insecure-content');
}

// 加载配置文件
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// 计算数据存储目录
// 开发环境：使用项目目录的 data 文件夹
// 生产环境：使用 exe 同目录的 data 文件夹
const isPackaged = app.isPackaged;
let dataDir;

console.log(`🔍 app.isPackaged: ${isPackaged}`);
console.log(`🔍 process.execPath: ${process.execPath}`);
console.log(`🔍 app.getPath('exe'): ${app.getPath('exe')}`);

if (isPackaged) {
  // 生产环境：使用 exe 同目录
  const exePath = app.getPath('exe');
  const exeDir = path.dirname(exePath);
  dataDir = path.join(exeDir, 'data');
  console.log(`🔍 生产环境 - exeDir: ${exeDir}`);
} else {
  // 开发环境：使用项目目录的 data 文件夹
  dataDir = path.join(__dirname, 'data');
  console.log(`🔍 开发环境 - __dirname: ${__dirname}`);
}

console.log(`🔍 dataDir: ${dataDir}`);

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 已创建数据目录: ${dataDir}`);
} else {
  console.log(`📁 数据目录已存在: ${dataDir}`);
}

// ========== 简单配置存储 (使用 JSON 文件) ==========
// 初始化 electron-store - 存储到 exe 同目录
const store = new Store({
  cwd: dataDir,
  name: 'settings',
  defaults: {
    token: '',
    model: 'qwen3.5-plus',
    customPrompt: ''
  }
});

console.log(`🔍 electron-store path: ${store.path}`);
console.log(`🔍 dataDir: ${dataDir}`);

// ========== SQLite 数据库初始化 (使用 sql.js) ==========
const initSqlJs = require('sql.js');
const dbPath = path.join(dataDir, 'records.db');
let db = null;
let SQL = null;

// 初始化 SQL.js
async function initDatabase() {
  try {
    SQL = await initSqlJs();

    // 尝试加载已存在的数据库
    let data = null;
    if (fs.existsSync(dbPath)) {
      data = fs.readFileSync(dbPath);
    }

    db = new SQL.Database(data);
    console.log(`🔍 dbPath: ${dbPath}`);
    console.log(`📁 SQLite 数据库: ${dbPath}`);

    // 设置 SQL.js 优化参数
    db.run('PRAGMA cache_size = -10240'); // 10MB 缓存
    db.run('PRAGMA temp_store = MEMORY'); // 临时表存内存

    // 创建表 - 使用 AUTOINCREMENT 自增主键
    db.run(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileName TEXT,
        name TEXT,
        biopsyPathology TEXT,
        tnmStage TEXT,
        surgeryTime TEXT,
        postopPathology TEXT,
        her2Status TEXT,
        erStatus TEXT,
        ki67 TEXT,
        originalText TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT,
        imageData BLOB,
        updatedAt TEXT
      )
    `);

    // 创建索引以提升查询性能
    db.run(`CREATE INDEX IF NOT EXISTS idx_records_status ON records(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_records_createdAt ON records(createdAt)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_records_name ON records(name)`);

    // 保存到文件
    saveDbToFile();
    console.log('✅ SQLite 表已创建');
  } catch (error) {
    console.error('❌ SQLite 初始化失败:', error);
  }
}

// 保存数据库到文件
function saveDbToFile() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// 延迟初始化数据库（懒加载）- 提升启动速度
// 数据库会在首次 IPC 调用时初始化
let dbInitialized = false;

async function ensureDbInitialized() {
  if (dbInitialized) return;
  await initDatabase();
  dbInitialized = true;
}

console.log(`📁 数据存储目录: ${dataDir}`);

// 判断环境
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const targetUrl = 'medical-ocr-pro.html';

console.log(`🚀 启动模式: ${isDev ? '开发环境' : '生产环境'}`);
console.log(`🌐 目标文件: ${targetUrl}`);

let mainWindow = null;

function createWindow() {
  // 创建浏览器窗口
  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '医疗病例 AI 识别系统 Pro',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-pro.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 后台页面节流（显著减少内存占用）
      backgroundThrottling: true,
      // 生产环境启用安全设置，开发环境允许加载本地文件
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev
    }
  };

  // 设置图标
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  // 隐藏菜单栏
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow(windowOptions);

  // 窗口最大化
  mainWindow.maximize();

  // 加载HTML文件
  mainWindow.loadFile(targetUrl)
    .then(() => {
      console.log('✅ 页面加载成功');
    })
    .catch(error => {
      console.error('❌ 页面加载失败:', error);
    });

  // 页面准备就绪后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 开发工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 右键菜单
  mainWindow.webContents.on('context-menu', (_, params) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '刷新',
        accelerator: 'CmdOrCtrl+R',
        click: () => mainWindow.webContents.reload()
      },
      { type: 'separator' },
      { label: '复制', role: 'copy' },
      { label: '粘贴', role: 'paste' },
      { label: '全选', role: 'selectAll' },
      { type: 'separator' },
      {
        label: '开发者工具',
        accelerator: 'CmdOrCtrl+Shift+I',
        click: () => mainWindow.webContents.openDevTools()
      }
    ]);
    contextMenu.popup({ window: mainWindow, x: params.x, y: params.y });
  });

  return mainWindow;
}

// 应用就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

  // macOS 特有行为
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 保存数据库并关闭
  if (db) {
    saveDbToFile();
    db.close();
    db = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前保存数据
app.on('before-quit', () => {
  if (db) {
    saveDbToFile();
  }
});

// 防止应用多开
app.on('second-instance', () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    const win = windows[0];
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// 打开系统浏览器（带 URL 验证）
ipcMain.handle('open-external', async (event, url) => {
  try {
    // 验证 URL 安全性：只允许 http/https 协议
    if (!url || typeof url !== 'string') {
      return { success: false, error: '无效的 URL' };
    }
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { success: false, error: '只允许打开 http/https 链接' };
    }
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('打开外部链接失败:', error);
    return { success: false, error: error.message };
  }
});

// ========== electron-store IPC handlers (带输入验证) ==========

// 验证 key 是否为安全的字符串
function isValidKey(key) {
  return typeof key === 'string' && /^[a-zA-Z0-9_-]+$/.test(key);
}

// 获取设置
ipcMain.handle('store-get', (event, key) => {
  if (!isValidKey(key)) return null;
  return store.get(key);
});

// 设置值
ipcMain.handle('store-set', (event, key, value) => {
  if (!isValidKey(key)) return false;
  // 限制 token 长度
  if (key === 'token' && typeof value === 'string' && value.length > 2000) {
    value = value.substring(0, 2000);
  }
  store.set(key, value);
  return true;
});

// 删除值
ipcMain.handle('store-delete', (event, key) => {
  if (!isValidKey(key)) return false;
  store.delete(key);
  return true;
});

// 获取所有设置
ipcMain.handle('store-get-all', () => {
  return store.store;
});

// 获取用户数据目录路径
ipcMain.handle('get-user-data-path', () => {
  return dataDir;
});

// ========== SQLite IPC handlers (OCR 记录存储) - 使用 sql.js) ==========

// 验证 ID 是否安全
function isValidId(id) {
  // 接受字符串（临时ID）或数字（数据库自增ID）
  return (typeof id === 'string' && id.length > 0 && id.length < 1000) ||
         (typeof id === 'number' && id > 0);
}

// 验证分页参数
function isValidPagination(page, pageSize) {
  const p = parseInt(page);
  const ps = parseInt(pageSize);
  return !isNaN(p) && !isNaN(ps) && p > 0 && ps > 0 && ps <= 1000;
}

// 获取记录总数
ipcMain.handle('db-get-count', async () => {
  await ensureDbInitialized();
  if (!db) return 0;
  try {
    const result = db.exec('SELECT COUNT(*) as cnt FROM records');
    return result.length ? result[0].values[0][0] : 0;
  } catch (error) {
    console.error('获取记录总数失败:', error);
    return 0;
  }
});

// 按状态获取记录数量
ipcMain.handle('db-get-status-counts', async () => {
  await ensureDbInitialized();
  if (!db) return { pending: 0, reviewed: 0, flagged: 0 };
  try {
    const result = db.exec(`
      SELECT status, COUNT(*) as cnt
      FROM records
      GROUP BY status
    `);
    const counts = { pending: 0, reviewed: 0, flagged: 0 };
    if (result.length) {
      result[0].values.forEach(([status, cnt]) => {
        if (status in counts) {
          counts[status] = cnt;
        }
      });
    }
    return counts;
  } catch (error) {
    console.error('获取状态统计失败:', error);
    return { pending: 0, reviewed: 0, flagged: 0 };
  }
});

// 获取今日识别数量
ipcMain.handle('db-get-today-count', async () => {
  await ensureDbInitialized();
  if (!db) return 0;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const result = db.exec(`SELECT COUNT(*) as cnt FROM records WHERE createdAt >= '${todayStr}'`);
    return result.length ? result[0].values[0][0] : 0;
  } catch (error) {
    console.error('获取今日统计失败:', error);
    return 0;
  }
});

// 分页获取记录
ipcMain.handle('db-get-paginated', async (event, options) => {
  await ensureDbInitialized();
  const { page, pageSize, search, status } = options || {};

  if (!db || !isValidPagination(page, pageSize)) {
    return { records: [], total: 0 };
  }
  if (!db) return { records: [], total: 0 };
  try {
    // 构建查询条件
    let whereClause = '';
    const params = [];
    const conditions = [];

    // 搜索条件
    if (search && search.trim()) {
      conditions.push('(name LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm);
    }

    // 状态筛选 - 支持逗号分隔的多个状态（如 "pending,flagged"）
    if (status && status !== 'all' && status !== '') {
      if (status.includes(',')) {
        // 多个状态，使用 IN 子句
        const statuses = status.split(',');
        const placeholders = statuses.map(() => '?').join(',');
        conditions.push(`status IN (${placeholders})`);
        params.push(...statuses);
      } else {
        // 单个状态，精确匹配
        conditions.push('status = ?');
        params.push(status);
      }
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // 获取总数
    const countResult = db.exec(`SELECT COUNT(*) as cnt FROM records ${whereClause}`, params);
    const total = countResult.length ? countResult[0].values[0][0] : 0;

    if (total === 0) {
      return { records: [], total: 0 };
    }

    // 分页查询（不查询imageData字段，减少内存占用）
    const offset = (page - 1) * pageSize;
    const sql = `SELECT id, fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, updatedAt FROM records ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, pageSize, offset];

    const results = db.exec(sql, queryParams);
    if (!results.length) return { records: [], total };

    const columns = results[0].columns;
    const records = results[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    return { records, total };
  } catch (error) {
    console.error('获取记录失败:', error);
    return { records: [], total: 0 };
  }
});

// 对比审核专用分页查询（包含imageData）
ipcMain.handle('db-get-paginated-with-image', async (event, options) => {
  await ensureDbInitialized();
  const { page, pageSize, search, status } = options || {};

  if (!db || !isValidPagination(page, pageSize)) {
    return { records: [], total: 0 };
  }
  if (!db) return { records: [], total: 0 };
  try {
    // 构建查询条件
    let whereClause = '';
    const params = [];
    const conditions = [];

    // 搜索条件
    if (search && search.trim()) {
      conditions.push('(name LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm);
    }

    // 状态筛选 - 支持逗号分隔的多个状态
    if (status && status !== 'all' && status !== '') {
      if (status.includes(',')) {
        const statuses = status.split(',');
        const placeholders = statuses.map(() => '?').join(',');
        conditions.push(`status IN (${placeholders})`);
        params.push(...statuses);
      } else {
        conditions.push('status = ?');
        params.push(status);
      }
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // 获取总数
    const countResult = db.exec(`SELECT COUNT(*) as cnt FROM records ${whereClause}`, params);
    const total = countResult.length ? countResult[0].values[0][0] : 0;

    if (total === 0) {
      return { records: [], total: 0 };
    }

    // 分页查询（包含imageData字段）
    const offset = (page - 1) * pageSize;
    const sql = `SELECT id, fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, updatedAt, imageData FROM records ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, pageSize, offset];

    const results = db.exec(sql, queryParams);
    if (!results.length) return { records: [], total };

    const columns = results[0].columns;
    const records = results[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    return { records, total };
  } catch (error) {
    console.error('获取记录失败:', error);
    return { records: [], total: 0 };
  }
});

// 获取所有记录的ID列表（用于去重，不包含imageData）
ipcMain.handle('db-get-all-ids', async () => {
  await ensureDbInitialized();
  if (!db) return [];
  try {
    const results = db.exec('SELECT id FROM records');
    if (!results.length) return [];
    return results[0].values.map(row => row[0]);
  } catch (error) {
    console.error('获取ID列表失败:', error);
    return [];
  }
});

// 查找重复记录（姓名+文件名相同）
ipcMain.handle('db-find-duplicates', async () => {
  await ensureDbInitialized();
  if (!db) return [];
  try {
    // 查找姓名和文件名都相同的记录
    const results = db.exec(`
      SELECT id, fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, updatedAt
      FROM records
      WHERE LOWER(name) || '|' || LOWER(fileName) IN (
        SELECT LOWER(name) || '|' || LOWER(fileName)
        FROM records
        GROUP BY LOWER(name), LOWER(fileName)
        HAVING COUNT(*) > 1
      )
      ORDER BY LOWER(name), LOWER(fileName), createdAt DESC
    `);

    if (!results.length) return [];

    const columns = results[0].columns;
    const records = results[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    return records;
  } catch (error) {
    console.error('查找重复记录失败:', error);
    return [];
  }
});

// 保存单条记录
ipcMain.handle('db-save', async (event, record) => {
  await ensureDbInitialized();
  if (!db) return false;
  try {
    db.run(`
      INSERT INTO records
      (fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, imageData, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.fileName,
      record.name,
      record.biopsyPathology,
      record.tnmStage,
      record.surgeryTime,
      record.postopPathology,
      record.her2Status,
      record.erStatus,
      record.ki67,
      record.originalText,
      record.status,
      record.createdAt,
      record.imageData,
      record.updatedAt || new Date().toISOString()
    ]);
    // 获取自动生成的 ID
    const lastId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    record.id = lastId; // 更新记录对象
    saveDbToFile(); // 保存到文件
    return lastId;
  } catch (error) {
    console.error('保存记录失败:', error);
    return false;
  }
});

// 批量保存记录
ipcMain.handle('db-save-all', async (event, records) => {
  await ensureDbInitialized();
  if (!db) return false;
  try {
    // 使用事务批量插入
    db.run('BEGIN TRANSACTION');
    try {
      const stmt = db.prepare(`
        INSERT INTO records
        (fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, imageData, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const record of records) {
        stmt.run([
          record.fileName,
          record.name,
          record.biopsyPathology,
          record.tnmStage,
          record.surgeryTime,
          record.postopPathology,
          record.her2Status,
          record.erStatus,
          record.ki67,
          record.originalText,
          record.status,
          record.createdAt,
          record.imageData,
          record.updatedAt || new Date().toISOString()
        ]);
        // 获取自动生成的 ID
        const lastId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
        record.id = lastId;
      }
      stmt.free();
      db.run('COMMIT');
    } catch (innerError) {
      db.run('ROLLBACK');
      throw innerError;
    }
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('批量保存记录失败:', error);
    return false;
  }
});

// 删除单条记录
ipcMain.handle('db-delete', async (event, id) => {
  await ensureDbInitialized();
  if (!db || !isValidId(id)) return false;
  try {
    db.run('DELETE FROM records WHERE id = ?', [id]);
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('删除记录失败:', error);
    return false;
  }
});

// 批量删除记录
ipcMain.handle('db-delete-many', async (event, ids) => {
  await ensureDbInitialized();
  if (!db || !Array.isArray(ids) || ids.length === 0) return false;
  // 验证所有 ID
  if (!ids.every(id => isValidId(id))) return false;
  try {
    db.run('BEGIN TRANSACTION');
    try {
      const stmt = db.prepare('DELETE FROM records WHERE id = ?');
      ids.forEach(id => {
        stmt.run([id]);
      });
      stmt.free();
      db.run('COMMIT');
    } catch (innerError) {
      db.run('ROLLBACK');
      throw innerError;
    }
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('批量删除记录失败:', error);
    return false;
  }
});

// 清空所有记录
ipcMain.handle('db-clear', async () => {
  await ensureDbInitialized();
  if (!db) return false;
  try {
    db.run('DELETE FROM records');
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('清空记录失败:', error);
    return false;
  }
});

// 更新记录状态
ipcMain.handle('db-update-status', async (event, id, status) => {
  await ensureDbInitialized();
  if (!db || !isValidId(id)) return false;
  // 验证 status 值
  if (!['pending', 'reviewed', 'flagged'].includes(status)) return false;
  try {
    db.run('UPDATE records SET status = ?, updatedAt = ? WHERE id = ?', [status, new Date().toISOString(), id]);
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('更新记录状态失败:', error);
    return false;
  }
});

// 批量更新状态（一次数据库操作，只保存一次）
ipcMain.handle('db-update-status-many', async (event, ids, status) => {
  await ensureDbInitialized();
  if (!db || !Array.isArray(ids) || ids.length === 0) return false;
  // 验证 status 值
  if (!['pending', 'reviewed', 'flagged'].includes(status)) return false;
  // 验证所有 ID
  if (!ids.every(id => isValidId(id))) return false;

  try {
    const placeholders = ids.map(() => '?').join(',');
    const updatedAt = new Date().toISOString();
    db.run(`UPDATE records SET status = ?, updatedAt = ? WHERE id IN (${placeholders})`, [status, updatedAt, ...ids]);
    saveDbToFile(); // 只保存一次
    return true;
  } catch (error) {
    console.error('批量更新记录状态失败:', error);
    return false;
  }
});

// 更新单条记录
ipcMain.handle('db-update', async (event, id, updates) => {
  await ensureDbInitialized();
  if (!db || !isValidId(id)) return false;
  // 验证 updates 对象
  if (!updates || typeof updates !== 'object') return false;
  try {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), id];
    db.run(`UPDATE records SET ${fields}, updatedAt = ? WHERE id = ?`, values);
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('更新记录失败:', error);
    return false;
  }
});

// 导出数据库文件
ipcMain.handle('db-export', async (event, savePath) => {
  await ensureDbInitialized();
  if (!db) return { success: false, error: '数据库未初始化' };
  try {
    // 先保存当前数据到文件
    saveDbToFile();
    // 读取数据库文件
    const data = fs.readFileSync(dbPath);
    // 写入到用户指定的位置
    fs.writeFileSync(savePath, data);
    return { success: true, path: savePath };
  } catch (error) {
    console.error('导出数据库失败:', error);
    return { success: false, error: error.message };
  }
});

// 导入数据库文件（增量导入）
ipcMain.handle('db-import', async (event, filePath) => {
  await ensureDbInitialized();
  if (!db) return { success: false, error: '数据库未初始化' };
  try {
    // 验证文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' };
    }
    // 读取导入的文件
    const data = fs.readFileSync(filePath);
    // 验证是否为有效的 SQLite 数据库
    // SQLite 文件头是 "SQLite format 3\0"
    const header = data.slice(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      return { success: false, error: '无效的 SQLite 数据库文件' };
    }
    // 创建临时数据库来读取导入的数据
    const importDb = new SQL.Database(data);
    // 从导入的数据库获取所有记录
    const results = importDb.exec('SELECT * FROM records');
    if (!results.length) {
      importDb.close();
      return { success: true, count: 0, message: '导入的数据库中没有记录' };
    }
    const columns = results[0].columns;
    const importRecords = results[0].values;
    importDb.close();

    // 记录导入前的数量
    const countBefore = db.exec('SELECT COUNT(*) as cnt FROM records')[0].values[0][0];

    // 使用事务 + INSERT OR IGNORE 增量导入（自动跳过已存在的ID）
    db.run('BEGIN TRANSACTION');
    try {
      const placeholders = columns.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT OR IGNORE INTO records (${columns.join(', ')}) VALUES (${placeholders})`);

      for (const row of importRecords) {
        stmt.run(row);
      }
      stmt.free();
      db.run('COMMIT');
    } catch (innerError) {
      db.run('ROLLBACK');
      throw innerError;
    }

    // 保存到文件
    saveDbToFile();

    // 计算导入数量
    const countAfter = db.exec('SELECT COUNT(*) as cnt FROM records')[0].values[0][0];
    const importCount = countAfter - countBefore;

    console.log(`✅ 增量导入成功: ${importCount} 条记录`);
    return { success: true, count: importCount };
  } catch (error) {
    console.error('导入数据库失败:', error);
    return { success: false, error: error.message };
  }
});

// 显示保存对话框
ipcMain.handle('show-save-dialog', async (event, options) => {
  // 验证 options
  if (!options || typeof options !== 'object') {
    options = {};
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: typeof options.title === 'string' ? options.title.slice(0, 100) : '保存文件',
    defaultPath: typeof options.defaultPath === 'string' ? options.defaultPath.slice(0, 200) : 'database.db',
    filters: options.filters || [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  return result;
});

// 显示打开文件对话框
ipcMain.handle('show-open-dialog', async (event, options) => {
  // 验证 options
  if (!options || typeof options !== 'object') {
    options = {};
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    title: typeof options.title === 'string' ? options.title.slice(0, 100) : '选择文件',
    properties: ['openFile'],
    filters: options.filters || [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  return result;
});

console.log('Medical AI Pro - Main Process Started');
