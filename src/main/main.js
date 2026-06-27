const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'development';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isDev:', isDev);
const FileProcessor = require('../utils/fileProcessor');
const PDFProcessor = require('../utils/pdfProcessor');

let mainWindow;
let fileProcessor;
let pdfProcessor;

// 操作类型配置（与渲染进程保持一致）
const OPERATIONS = [
  { id: 'merge', name: '文档合并' },
  { id: 'split', name: '文档拆分' },
  { id: 'convert', name: '格式转换' },
  { id: 'adjust', name: '页面调整' },
  { id: 'watermark', name: '添加水印' },
  { id: 'compress', name: 'PDF压缩' },
  { id: 'encrypt', name: 'PDF加密' },
  { id: 'decrypt', name: 'PDF解密' },
  { id: 'ocr', name: 'OCR识别' }
];

// 发送消息到渲染进程
function sendToRenderer(channel, data) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

// 创建中文菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendToRenderer('menu-action', { action: 'open-file' })
        },
        {
          label: '打开文件夹',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => sendToRenderer('menu-action', { action: 'open-folder' })
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendToRenderer('menu-action', { action: 'save' })
        },
        {
          label: '另存为...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendToRenderer('menu-action', { action: 'save-as' })
        },
        { type: 'separator' },
        { label: '退出', accelerator: 'Alt+F4', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { type: 'separator' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { type: 'separator' },
        {
          label: '清空列表',
          accelerator: 'CmdOrCtrl+Delete',
          click: () => sendToRenderer('menu-action', { action: 'clear' })
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    },
    {
      label: '工具',
      submenu: [
        ...OPERATIONS.map(op => ({
          label: op.name,
          click: () => sendToRenderer('menu-action', { action: 'select-operation', operation: op.id })
        })),
        { type: 'separator' },
        {
          label: '设置',
          accelerator: 'CmdOrCtrl+,',
          click: () => sendToRenderer('menu-action', { action: 'show-settings' })
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '使用文档',
          click: () => sendToRenderer('menu-action', { action: 'show-docs' })
        },
        {
          label: '快捷键列表',
          accelerator: 'CmdOrCtrl+/',
          click: () => sendToRenderer('menu-action', { action: 'show-shortcuts' })
        },
        { type: 'separator' },
        {
          label: '反馈建议',
          click: () => sendToRenderer('menu-action', { action: 'show-feedback' })
        },
        {
          label: '检查更新',
          click: () => sendToRenderer('menu-action', { action: 'check-update' })
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => sendToRenderer('menu-action', { action: 'show-about' })
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // 创建中文菜单
  createMenu();
  
  // 初始化文件处理器
  fileProcessor = new FileProcessor();
  pdfProcessor = new PDFProcessor();
  
  // 根据环境变量设置背景色（支持浅色/深色模式）
  const isDarkMode = process.env.THEME_MODE === 'dark';
  const backgroundColor = isDarkMode ? '#0f172a' : '#ffffff';
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1450,
    minHeight: 700,
    backgroundColor: backgroundColor,
    show: false,
    frame: true,
    titleBarStyle: 'default',
    roundedCorners: true,
    thickFrame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    // 开发模式：尝试连接开发服务器
    const devURL = 'http://localhost:3000';
    const maxRetries = 10;
    let retryCount = 0;
    
    const tryLoadDevURL = () => {
      console.log(`尝试连接开发服务器: ${devURL} (第${retryCount + 1}次)`);
      mainWindow.loadURL(devURL)
        .then(() => {
          console.log('成功连接到开发服务器');
          mainWindow.webContents.openDevTools();
        })
        .catch((err) => {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`连接失败，${2}秒后重试...`);
            setTimeout(tryLoadDevURL, 2000);
          } else {
            console.error('无法连接到开发服务器，请确保已运行 npm start');
            // 尝试加载本地文件作为后备
            mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
              .catch(() => {
                console.error('无法加载本地文件，请先运行 npm run build');
              });
          }
        });
    };
    
    // 延迟2秒后开始尝试连接，给开发服务器启动时间
    setTimeout(tryLoadDevURL, 2000);
  } else {
    // 生产模式：加载打包后的文件
    // 计算正确的路径，考虑打包后的文件结构
    const appPath = app.getAppPath();
    const indexPath = path.join(appPath, 'dist', 'index.html');
    console.log('应用路径:', appPath);
    console.log('加载生产模式文件:', indexPath);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      console.log('文件存在，开始加载');
      mainWindow.loadFile(indexPath)
        .then(() => {
          console.log('成功加载生产模式文件');
        })
        .catch((err) => {
          console.error('加载生产模式文件失败:', err);
          // 显示错误页面
          mainWindow.loadURL(`data:text/html,<h1>加载失败</h1><p>${err.message}</p>`);
        });
    } else {
      console.error('文件不存在:', indexPath);
      // 尝试其他可能的路径
      const altPaths = [
        path.join(__dirname, '../../dist/index.html'),
        path.join(__dirname, '../dist/index.html'),
        path.join(__dirname, 'dist/index.html')
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log('找到文件:', altPath);
          mainWindow.loadFile(altPath);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.error('所有路径都找不到文件');
        mainWindow.loadURL(`data:text/html,<h1>文件未找到</h1><p>请确保已运行 npm run build</p>`);
      }
    }
  }

  // 添加窗口事件监听
  mainWindow.on('closed', () => {
    console.log('窗口已关闭');
    mainWindow = null;
  });
  
  // 监听页面加载事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);
  });
  
  // 监听渲染进程崩溃
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('渲染进程崩溃:', details);
  });
  
  // 监听未捕获的异常
  mainWindow.webContents.on('unresponsive', () => {
    console.error('窗口无响应');
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC通信处理
ipcMain.handle('select-files', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: options.filters || []
  });
  return result.filePaths;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result.filePath;
});

// 文件处理IPC通信
ipcMain.handle('process-files', async (event, operation, files, options) => {
  try {
    const progressCallback = (progress) => {
      mainWindow.webContents.send('progress-update', progress);
    };
    
    const results = await fileProcessor.processFiles(operation, files, options, progressCallback);
    return { success: true, results };
  } catch (error) {
    mainWindow.webContents.send('error-occurred', { message: error.message });
    return { success: false, error: error.message };
  }
});

// PDF页面编辑IPC通信
ipcMain.handle('pdf-edit-pages', async (event, options) => {
  try {
    const { filePath, rotations, deletePages, cropPages, saveAs } = options;
    const progressCallback = (progress) => {
      mainWindow.webContents.send('progress-update', progress);
    };

    let pdfBytes = fs.readFileSync(filePath);
    const { PDFDocument } = require('pdf-lib');
    let pdf = await PDFDocument.load(pdfBytes);
    const originalPageCount = pdf.getPageCount();

    // 1. 应用旋转
    if (rotations && rotations.length > 0) {
      const pages = pdf.getPages();
      for (let i = 0; i < rotations.length; i++) {
        const { pageIndex, angle } = rotations[i];
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex];
          const currentRotation = page.getRotation().angle;
          const newRotation = (currentRotation + angle) % 360;
          page.setRotation({ type: 'degrees', angle: newRotation });
        }
        progressCallback({
          percent: ((i + 1) / rotations.length) * 33,
          current: i + 1,
          total: rotations.length,
          message: '旋转页面中...'
        });
      }
    }

    // 2. 应用裁剪
    if (cropPages && cropPages.length > 0) {
      const pages = pdf.getPages();
      for (let i = 0; i < cropPages.length; i++) {
        const { pageIndex, cropBox } = cropPages[i];
        if (pageIndex >= 0 && pageIndex < pages.length && cropBox) {
          const page = pages[pageIndex];
          const { x = 0, y = 0, width, height } = cropBox;
          if (width > 0 && height > 0) {
            page.setCropBox(x, y, width, height);
          }
        }
        progressCallback({
          percent: 33 + ((i + 1) / cropPages.length) * 33,
          current: i + 1,
          total: cropPages.length,
          message: '裁剪页面中...'
        });
      }
    }

    // 3. 应用删除（从大到小排序避免索引偏移）
    if (deletePages && deletePages.length > 0) {
      const sortedIndices = [...deletePages].sort((a, b) => b - a);
      for (let i = 0; i < sortedIndices.length; i++) {
        pdf.removePage(sortedIndices[i]);
        progressCallback({
          percent: 66 + ((i + 1) / sortedIndices.length) * 34,
          current: i + 1,
          total: sortedIndices.length,
          message: '删除页面中...'
        });
      }
    }

    // 保存文件
    const resultBytes = await pdf.save();

    // 确定保存路径
    let outputPath = filePath;
    if (saveAs !== false) {
      // 弹出保存对话框
      const saveResult = await dialog.showSaveDialog(mainWindow, {
        title: '保存编辑后的PDF',
        defaultPath: filePath.replace('.pdf', '_edited.pdf'),
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      });
      
      if (saveResult.canceled) {
        return { success: false, error: '用户取消保存' };
      }
      outputPath = saveResult.filePath;
    }

    // 写入文件
    fs.writeFileSync(outputPath, resultBytes);

    const finalPageCount = pdf.getPageCount();
    return { 
      success: true, 
      filePath: outputPath,
      originalPageCount,
      finalPageCount,
      deletedCount: originalPageCount - finalPageCount
    };
  } catch (error) {
    console.error('PDF页面编辑失败:', error);
    return { success: false, error: error.message };
  }
});
