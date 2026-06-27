// 操作类型配置 - 统一定义，避免重复
export const OPERATIONS = [
  { id: 'merge', name: '文档合并', icon: '📄', desc: '合并多个文件为一个文件' },
  { id: 'split', name: '文档拆分', icon: '✂️', desc: '将文件拆分为多个部分' },
  { id: 'convert', name: '格式转换', icon: '🔄', desc: '在不同格式之间转换' },
  { id: 'adjust', name: '页面调整', icon: '⚙️', desc: '旋转、裁剪、删除页面' },
  { id: 'watermark', name: '添加水印', icon: '💧', desc: '添加文字或图片水印' },
  { id: 'compress', name: 'PDF压缩', icon: '📦', desc: '减小PDF文件大小' },
  { id: 'encrypt', name: 'PDF加密', icon: '🔒', desc: '设置密码保护' },
  { id: 'decrypt', name: 'PDF解密', icon: '🔓', desc: '移除密码保护' },
  { id: 'ocr', name: 'OCR识别', icon: '👁', desc: '提取图片中的文字' }
];

// 文件过滤器配置
export const FILE_FILTERS = [
  { name: '文档文件', extensions: ['pdf', 'docx', 'xlsx', 'pptx'] },
  { name: 'PDF文件', extensions: ['pdf'] },
  { name: 'Word文件', extensions: ['docx', 'doc'] },
  { name: 'Excel文件', extensions: ['xlsx', 'xls'] },
  { name: 'PowerPoint文件', extensions: ['pptx', 'ppt'] },
  { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
  { name: '所有文件', extensions: ['*'] }
];

// 主进程菜单配置（与渲染进程保持一致）
export const MENU_OPERATIONS = [
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
