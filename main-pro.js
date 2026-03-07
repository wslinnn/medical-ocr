const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

// 开发环境下完全禁用安全警告
if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  app.commandLine.appendSwitch('--disable-web-security');
  app.commandLine.appendSwitch('--allow-running-insecure-content');
}

// 加载配置文件
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

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
    title: '医疗病例 OCR 识别系统 Pro',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-pro.js'),
      contextIsolation: false, // 简化版本，不使用隔离
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

console.log('Medical OCR Pro - Main Process Started');
