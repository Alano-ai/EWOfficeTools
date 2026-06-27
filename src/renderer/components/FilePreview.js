import React, { useState, useEffect } from 'react';

const FilePreview = ({ file, onClose }) => {
  const [previewContent, setPreviewContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (file) {
      loadPreview();
    }
  }, [file]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 这里将根据文件类型加载预览内容
      // 目前先显示文件信息
      setPreviewContent({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified ? new Date(file.lastModified).toLocaleString() : '未知'
      });
    } catch (err) {
      setError('无法加载文件预览');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeDescription = (type) => {
    const typeMap = {
      'pdf': 'PDF 文档',
      'docx': 'Word 文档',
      'doc': 'Word 文档',
      'xlsx': 'Excel 电子表格',
      'xls': 'Excel 电子表格',
      'pptx': 'PowerPoint 演示文稿',
      'ppt': 'PowerPoint 演示文稿'
    };
    return typeMap[type] || '未知文件类型';
  };

  if (!file) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: 'var(--text-primary)' }}>文件预览</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-tertiary)'
            }}
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#f56565' }}>
            <p>{error}</p>
          </div>
        ) : previewContent ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bg-primary)',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {previewContent.name.split('.').pop().toUpperCase()}
              </div>
              <div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '5px' }}>
                  {previewContent.name}
                </h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                  {getFileTypeDescription(previewContent.type)}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>文件大小</h4>
                <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {previewContent.size ? formatFileSize(previewContent.size) : '未知'}
                </p>
              </div>
              <div style={{ padding: '15px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>修改时间</h4>
                <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {previewContent.lastModified}
                </p>
              </div>
            </div>

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: 'var(--success-bg)',
              borderRadius: '8px',
              border: '1px solid #c6f6d5'
            }}>
              <p style={{ color: 'var(--success-color)', textAlign: 'center' }}>
                文件已准备好进行处理
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FilePreview;
