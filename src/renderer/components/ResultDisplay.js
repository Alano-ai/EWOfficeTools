import React from 'react';

const ResultDisplay = ({ results, onDownload, onDownloadAll, onClear }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'pptx':
      case 'ppt':
        return '📈';
      default:
        return '📁';
    }
  };

  return (
    <div className="result-area">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: 'var(--text-primary)' }}>
          处理结果 ({results.length} 个文件)
        </h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={onDownloadAll}
          >
            全部下载
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onClear}
          >
            清除结果
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {results.map((result, index) => (
          <div key={index} className="result-item">
            <div className="result-info">
              <div className="result-icon">
                ✓
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {result.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  {result.size ? formatFileSize(result.size) : '未知大小'}
                </div>
              </div>
            </div>
            
            <button
              className="download-btn"
              onClick={() => onDownload(result)}
            >
              下载
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: 'var(--success-bg)', 
        borderRadius: '8px',
        border: '1px solid #c6f6d5'
      }}>
        <p style={{ color: 'var(--success-color)', textAlign: 'center' }}>
          所有文件处理完成！您可以下载单个文件或批量下载所有文件。
        </p>
      </div>
    </div>
  );
};

export default ResultDisplay;
