import React from 'react';

const AboutDialog = ({ onClose }) => {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content about-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <div className="about-icon">📄</div>
          <h2>EW Office Tools</h2>
          <p className="about-version">版本 1.0.0</p>
        </div>
        
        <div className="about-body">
          <p>文档格式转换、合并与拆分一体化工具</p>
          
          <div className="about-features">
            <h3>主要功能</h3>
            <ul>
              <li>📄 文档合并 - 支持PDF、Word、Excel、PPT</li>
              <li>✂️ 文档拆分 - 按页数、大小、书签拆分</li>
              <li>🔄 格式转换 - PDF、Word、Excel、PPT互转</li>
              <li>⚙️ 页面调整 - 旋转、裁剪、删除页面</li>
              <li>💧 添加水印 - 文字和图片水印</li>
              <li>📦 PDF压缩 - 减小文件大小</li>
              <li>🔒 PDF加密 - 密码保护</li>
              <li>👁 OCR识别 - 提取图片文字</li>
            </ul>
          </div>

          <div className="about-tech">
            <h3>技术栈</h3>
            <p>Electron + React + Webpack</p>
          </div>
        </div>

        <div className="about-footer">
          <p>© 2024 EW Office Tools. All rights reserved.</p>
          <button className="btn btn-primary" onClick={onClose}>确定</button>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
