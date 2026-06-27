import React from 'react';

const ProgressDisplay = ({ progress }) => {
  return (
    <div style={{ 
      marginTop: '30px', 
      padding: '20px', 
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>
        处理进度
      </h3>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px',
        marginBottom: '10px'
      }}>
        <div style={{ flex: 1 }}>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span style={{ 
          fontWeight: '600', 
          color: 'var(--text-secondary)',
          minWidth: '50px',
          textAlign: 'right'
        }}>
          {Math.round(progress)}%
        </span>
      </div>
      
      <p style={{ 
        color: 'var(--text-tertiary)', 
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        {progress < 100 ? '正在处理文件，请稍候...' : '处理完成！'}
      </p>
    </div>
  );
};

export default ProgressDisplay;
