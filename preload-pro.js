// preload-pro.js

// 在页面加载前处理控制台输出
window.addEventListener('DOMContentLoaded', () => {
  // 开发环境下过滤一些已知的无害警告
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.warn = function(...args) {
      const message = args.join(' ');
      // 过滤 Electron 安全警告
      if (
        message.includes('Electron Security Warning') ||
        message.includes('webSecurity') ||
        message.includes('allowRunningInsecureContent') ||
        message.includes('Content-Security-Policy')
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    console.error = function(...args) {
      const message = args.join(' ');
      // 过滤一些无害的错误
      if (message.includes('Electron Security Warning')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
  }
});

// 暴露 Node.js API 给渲染进程（简化版本）
window.require = require;
window.fs = require('fs');
window.path = require('path');
window.electron = require('electron');

// ========== electron-store API 封装 ==========
// 不同 appId 的应用会自动使用不同的存储目录
window.electronStore = {
  // 获取值
  get: (key) => {
    return window.electron.ipcRenderer.invoke('store-get', key);
  },

  // 设置值
  set: (key, value) => {
    return window.electron.ipcRenderer.invoke('store-set', key, value);
  },

  // 删除值
  delete: (key) => {
    return window.electron.ipcRenderer.invoke('store-delete', key);
  },

  // 获取所有值
  getAll: () => {
    return window.electron.ipcRenderer.invoke('store-get-all');
  },

  // 获取用户数据目录
  getUserDataPath: () => {
    return window.electron.ipcRenderer.invoke('get-user-data-path');
  }
};

// ========== SQLite API 封装 (OCR 记录存储) ==========
window.sqliteDB = {
  // 获取所有记录
  getAll: () => {
    return window.electron.ipcRenderer.invoke('db-get-all');
  },

  // 保存单条记录
  save: (record) => {
    return window.electron.ipcRenderer.invoke('db-save', record);
  },

  // 批量保存记录
  saveAll: (records) => {
    return window.electron.ipcRenderer.invoke('db-save-all', records);
  },

  // 删除单条记录
  delete: (id) => {
    return window.electron.ipcRenderer.invoke('db-delete', id);
  },

  // 批量删除记录
  deleteMany: (ids) => {
    return window.electron.ipcRenderer.invoke('db-delete-many', ids);
  },

  // 清空所有记录
  clear: () => {
    return window.electron.ipcRenderer.invoke('db-clear');
  },

  // 更新记录状态
  updateStatus: (id, status) => {
    return window.electron.ipcRenderer.invoke('db-update-status', id, status);
  },

  // 更新单条记录
  update: (id, updates) => {
    return window.electron.ipcRenderer.invoke('db-update', id, updates);
  },

  // 导出数据库
  exportDb: (savePath) => {
    return window.electron.ipcRenderer.invoke('db-export', savePath);
  },

  // 导入数据库
  importDb: (filePath) => {
    return window.electron.ipcRenderer.invoke('db-import', filePath);
  },

  // 显示保存对话框
  showSaveDialog: (options) => {
    return window.electron.ipcRenderer.invoke('show-save-dialog', options);
  },

  // 显示打开文件对话框
  showOpenDialog: (options) => {
    return window.electron.ipcRenderer.invoke('show-open-dialog', options);
  }
};

console.log('Medical AI Pro - Preload Script Loaded');
