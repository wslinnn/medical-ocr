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

console.log('Medical OCR Pro - Preload Script Loaded');
