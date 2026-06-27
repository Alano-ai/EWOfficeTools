const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: (options) => ipcRenderer.invoke('select-files', options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  
  // 文件处理API
  processFiles: (operation, files, options) => 
    ipcRenderer.invoke('process-files', operation, files, options),
  
  // PDF页面编辑API
  pdfEditPages: (options) => ipcRenderer.invoke('pdf-edit-pages', options),
  
  // 进度通知
  onProgress: (callback) => {
    ipcRenderer.on('progress-update', (event, progress) => callback(progress));
  },
  
  // 错误通知
  onError: (callback) => {
    ipcRenderer.on('error-occurred', (event, error) => callback(error));
  },
  
  // 菜单操作通知
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, data) => callback(data));
  }
});
