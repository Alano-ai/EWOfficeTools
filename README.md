<div align="center">

# 📄 EW Office Tools

**文档格式转换、合并与拆分一体化桌面工具**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/YOUR_USERNAME/EWOfficeTools/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)]()
[![Electron](https://img.shields.io/badge/electron-42.5.0-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/react-19.2.7-61DAFB.svg)](https://reactjs.org/)

</div>

---

## ✨ 功能特性

### 📁 文档合并
- 支持多个 PDF、Word、Excel、PPT 文件合并
- 图片合并为 PDF
- 自定义合并顺序（拖拽排序）

### ✂️ 文档拆分
- 按页数、文件大小、书签拆分 PDF
- 按工作表拆分 Excel
- 按幻灯片拆分 PPT

### 🔄 格式转换
- PDF ↔ Word ↔ Excel ↔ PPT 互转
- 支持批量转换
- 高保真格式保持

### ⚙️ 页面调整
- 页面旋转（90°/180°/270°）
- 页面裁剪
- 页面删除

### 💧 高级功能
- 添加文字/图片水印
- PDF 压缩（减小文件大小）
- PDF 加密/解密
- OCR 文字识别（支持中英文）

### 🎨 界面特性
- 浅色/深色主题切换
- 跟随系统主题
- 响应式布局
- 现代化 UI 设计

---

## 📋 支持格式

| 格式 | 扩展名 | 合并 | 拆分 | 转换 | 调整 |
|------|--------|------|------|------|------|
| PDF | .pdf | ✅ | ✅ | ✅ | ✅ |
| Word | .docx | ✅ | ✅ | ✅ | ✅ |
| Excel | .xlsx | ✅ | ✅ | ✅ | ✅ |
| PPT | .pptx | ✅ | ✅ | ✅ | ✅ |
| 图片 | .jpg/.png | ✅ | - | ✅ | - |

---

## 🚀 快速开始

### 下载安装

1. 前往 [Releases](https://github.com/YOUR_USERNAME/EWOfficeTools/releases) 页面
2. 下载最新版本的 `EWOfficeTools-Setup-1.0.0.exe`
3. 运行安装程序，按照提示完成安装

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/EWOfficeTools.git
cd EWOfficeTools

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 打包为可执行文件
npm run dist
```

---

## 📖 使用方法

### 1. 选择文件
- 点击「浏览文件」按钮选择文件
- 或直接拖放文件到应用窗口

### 2. 选择操作
- 从顶部工具栏选择操作类型
- 配置相关选项

### 3. 开始处理
- 点击「开始处理」按钮
- 等待处理完成

### 4. 下载结果
- 单独下载或批量下载处理结果

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| **Electron** | 桌面应用框架 |
| **React 19** | UI 框架 |
| **Webpack** | 模块打包 |
| **pdf-lib** | PDF 处理 |
| **docx** | Word 文档生成 |
| **exceljs** | Excel 处理 |
| **pptxgenjs** | PPT 生成 |
| **tesseract.js** | OCR 文字识别 |

---

## 📁 项目结构

```
EWOfficeTools/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.js        # 主入口
│   │   └── preload.js     # 预加载脚本
│   ├── renderer/          # React 渲染进程
│   │   ├── components/    # UI 组件
│   │   ├── config/        # 配置文件
│   │   ├── styles/        # 样式文件
│   │   ├── App.js         # 主组件
│   │   └── index.js       # 入口文件
│   └── utils/             # 工具函数
│       ├── fileProcessor.js    # 文件处理
│       ├── pdfProcessor.js     # PDF 处理
│       ├── wordProcessor.js    # Word 处理
│       ├── excelProcessor.js   # Excel 处理
│       └── pptProcessor.js     # PPT 处理
├── dist/                  # 构建输出
├── release/               # 打包输出
└── package.json           # 项目配置
```

---

## 🔧 开发指南

### 环境要求
- Node.js >= 16
- npm >= 8
- Windows 10/11

### 开发命令

```bash
# 启动开发服务器
npm start

# 启动 Electron 开发模式
npm run electron-dev

# 同时启动（推荐）
npm run dev

# 构建生产版本
npm run build

# 打包应用
npm run dist
```

### 代码规范
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 React Hooks 最佳实践

---

## 📝 更新日志

### v1.0.0 (2024-06-27)
- 🎉 首次发布
- ✨ 支持 PDF、Word、Excel、PPT 格式处理
- ✨ 文档合并、拆分、转换功能
- ✨ 页面调整、水印、压缩、加密功能
- ✨ OCR 文字识别
- ✨ 浅色/深色主题切换
- ✨ 响应式布局设计

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [pdf-lib](https://pdf-lib.js.org/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)

---

<div align="center">

**如果这个项目对您有帮助，请给个 ⭐ Star 支持一下！**

</div>
