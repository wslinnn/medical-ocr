const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

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
const dataDir = isPackaged
  ? path.join(path.dirname(process.execPath), 'data')  // exe 同目录的 data 文件夹
  : path.join(__dirname, 'data');                      // 开发环境用项目目录的 data

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化 electron-store - 存储到 exe 同目录
const store = new Store({
  name: 'settings',
  cwd: dataDir,  // 关键：指定存储目录
  defaults: {
    token: '',
    model: 'qwen3.5-plus',
    customPrompt: ''
  }
});

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
    console.log(`📁 SQLite 数据库: ${dbPath}`);

    // 创建表
    db.run(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
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

// 立即初始化数据库
initDatabase();

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
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      allowRunningInsecureContent: true
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
  if (process.platform !== 'darwin') {
    app.quit();
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

// 打开系统浏览器
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('打开外部链接失败:', error);
    return { success: false, error: error.message };
  }
});

// ========== electron-store IPC handlers ==========
// electron-store 会根据 appId 自动存储到不同目录，实现数据隔离

// 获取设置
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

// 设置值
ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
  return true;
});

// 删除值
ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
  return true;
});

// 获取所有设置
ipcMain.handle('store-get-all', () => {
  return store.store;
});

// 获取用户数据目录路径
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

// ========== SQLite IPC handlers (OCR 记录存储) - 使用 sql.js) ==========

// 获取所有记录
ipcMain.handle('db-get-all', () => {
  if (!db) return [];
  try {
    const results = db.exec('SELECT * FROM records ORDER BY createdAt DESC');
    if (!results.length) return [];

    const columns = results[0].columns;
    return results[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } catch (error) {
    console.error('获取记录失败:', error);
    return [];
  }
});

// 保存单条记录
ipcMain.handle('db-save', (event, record) => {
  if (!db) return false;
  try {
    db.run(`
      INSERT OR REPLACE INTO records
      (id, fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, imageData, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.id,
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
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('保存记录失败:', error);
    return false;
  }
});

// 批量保存记录
ipcMain.handle('db-save-all', (event, records) => {
  if (!db) return false;
  try {
    // 使用事务批量插入
    db.run('BEGIN TRANSACTION');
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO records
        (id, fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, imageData, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const record of records) {
        stmt.run([
          record.id,
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
ipcMain.handle('db-delete', (event, id) => {
  if (!db) return false;
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
ipcMain.handle('db-delete-many', (event, ids) => {
  if (!db) return false;
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
ipcMain.handle('db-clear', () => {
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
ipcMain.handle('db-update-status', (event, id, status) => {
  if (!db) return false;
  try {
    db.run('UPDATE records SET status = ?, updatedAt = ? WHERE id = ?', [status, new Date().toISOString(), id]);
    saveDbToFile(); // 保存到文件
    return true;
  } catch (error) {
    console.error('更新记录状态失败:', error);
    return false;
  }
});

// 更新单条记录
ipcMain.handle('db-update', (event, id, updates) => {
  if (!db) return false;
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
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || '保存文件',
    defaultPath: options.defaultPath || 'database.db',
    filters: options.filters || [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  return result;
});

// 显示打开文件对话框
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || '选择文件',
    properties: ['openFile'],
    filters: options.filters || [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  return result;
});

console.log('Medical AI Pro - Main Process Started');
