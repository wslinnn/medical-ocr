// preload-pro.js
// 安全：通过 contextBridge 暴露必要的 API，不直接暴露 Node.js 模块

const { contextBridge, ipcRenderer } = require('electron');

// ========== electron-store API 封装 ==========
contextBridge.exposeInMainWorld('electronStore', {
  // 获取值
  get: (key) => {
    return ipcRenderer.invoke('store-get', key);
  },

  // 设置值
  set: (key, value) => {
    return ipcRenderer.invoke('store-set', key, value);
  },

  // 删除值
  delete: (key) => {
    return ipcRenderer.invoke('store-delete', key);
  },

  // 获取所有值
  getAll: () => {
    return ipcRenderer.invoke('store-get-all');
  },

  // 获取用户数据目录
  getUserDataPath: () => {
    return ipcRenderer.invoke('get-user-data-path');
  }
});

// ========== SQLite API 封装 (OCR 记录存储) ==========
contextBridge.exposeInMainWorld('sqliteDB', {
  // 获取所有记录
  getAll: () => {
    return ipcRenderer.invoke('db-get-all');
  },

  // 获取记录总数
  getCount: () => {
    return ipcRenderer.invoke('db-get-count');
  },

  // 按状态获取记录数量
  getStatusCounts: () => {
    return ipcRenderer.invoke('db-get-status-counts');
  },

  // 获取今日识别数量
  getTodayCount: () => {
    return ipcRenderer.invoke('db-get-today-count');
  },

  // 分页获取记录
  getPaginated: (options) => {
    return ipcRenderer.invoke('db-get-paginated', options);
  },

  // 对比审核专用分页查询（包含imageData）
  getPaginatedWithImage: (options) => {
    return ipcRenderer.invoke('db-get-paginated-with-image', options);
  },

  // 获取所有记录的ID列表（用于去重）
  getAllIds: () => {
    return ipcRenderer.invoke('db-get-all-ids');
  },

  // 查找重复记录（姓名+文件名相同）
  findDuplicates: () => {
    return ipcRenderer.invoke('db-find-duplicates');
  },

  // 保存单条记录
  save: (record) => {
    return ipcRenderer.invoke('db-save', record);
  },

  // 批量保存记录
  saveAll: (records) => {
    return ipcRenderer.invoke('db-save-all', records);
  },

  // 删除单条记录
  delete: (id) => {
    return ipcRenderer.invoke('db-delete', id);
  },

  // 批量删除记录
  deleteMany: (ids) => {
    return ipcRenderer.invoke('db-delete-many', ids);
  },

  // 清空所有记录
  clear: () => {
    return ipcRenderer.invoke('db-clear');
  },

  // 更新记录状态
  updateStatus: (id, status) => {
    return ipcRenderer.invoke('db-update-status', id, status);
  },

  // 批量更新状态
  updateStatusMany: (ids, status) => {
    return ipcRenderer.invoke('db-update-status-many', ids, status);
  },

  // 更新单条记录
  update: (id, updates) => {
    return ipcRenderer.invoke('db-update', id, updates);
  },

  // 导出数据库
  exportDb: (savePath) => {
    return ipcRenderer.invoke('db-export', savePath);
  },

  // 导入数据库
  importDb: (filePath) => {
    return ipcRenderer.invoke('db-import', filePath);
  },

  // 显示保存对话框
  showSaveDialog: (options) => {
    return ipcRenderer.invoke('show-save-dialog', options);
  },

  // 显示打开文件对话框
  showOpenDialog: (options) => {
    return ipcRenderer.invoke('show-open-dialog', options);
  }
});

console.log('Medical AI Pro - Preload Script Loaded');
