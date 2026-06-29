import React, { useCallback, useState, useRef } from 'react';
import FilePreview from './FilePreview';

const FileSelector = ({ 
  files, 
  onFilesSelected, 
  onRemoveFile, 
  onFileReorder, 
  draggedIndex, 
  dropTargetIndex, 
  onDragStart, 
  onDragOver, 
  onDragEnd 
}) => {
  const [previewFile, setPreviewFile] = useState(null);
  const touchStartY = useRef(null);
  const touchStartIndex = useRef(null);
  // 文件拖放区域事件处理
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  }, []);

  // 文件拖放区域事件处理
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    // 检查是否是文件拖放（从外部拖入文件）
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  }, [onFilesSelected]);

  const handleBrowseClick = async () => {
    if (window.electronAPI) {
      const filePaths = await window.electronAPI.selectFiles({
        filters: [
          { name: '文档文件', extensions: ['pdf', 'docx', 'xlsx', 'pptx'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });
      if (filePaths && filePaths.length > 0) {
        // 获取每个文件的详细信息
        const fileObjects = await Promise.all(
          filePaths.map(async (filePath) => {
            try {
              const fileInfo = await window.electronAPI.getFileInfo(filePath);
              return {
                name: fileInfo.success ? fileInfo.name : filePath.split('\\').pop(),
                path: filePath,
                size: fileInfo.success ? fileInfo.size : 0,
                type: fileInfo.success ? fileInfo.ext : filePath.split('.').pop()
              };
            } catch (err) {
              return {
                name: filePath.split('\\').pop(),
                path: filePath,
                size: 0,
                type: filePath.split('.').pop()
              };
            }
          })
        );
        onFilesSelected(fileObjects);
      }
    }
  };

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

  // 文件项拖拽事件处理
  const handleFileDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    e.target.classList.add('dragging');
    onDragStart(index);
  };

  const handleFileDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };

  const handleFileDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('dragging');
    
    const startIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (startIndex !== index) {
      onFileReorder(startIndex, index);
    }
    onDragEnd();
  };

  const handleFileDragEnd = (e) => {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.drop-target').forEach(el => 
      el.classList.remove('drop-target')
    );
    onDragEnd();
  };

  // 触摸事件处理
  const handleTouchStart = (e, index) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartIndex.current = index;
    onDragStart(index);
  };

  const handleTouchMove = (e, index) => {
    if (touchStartY.current === null) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY.current;
    const itemHeight = e.target.closest('.file-item')?.offsetHeight || 80;
    
    // 计算新的放置目标
    const newIndex = Math.round(deltaY / itemHeight) + touchStartIndex.current;
    const clampedIndex = Math.max(0, Math.min(files.length - 1, newIndex));
    
    if (clampedIndex !== dropTargetIndex) {
      onDragOver(clampedIndex);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartIndex.current !== null && dropTargetIndex !== null && 
        touchStartIndex.current !== dropTargetIndex) {
      onFileReorder(touchStartIndex.current, dropTargetIndex);
    }
    touchStartY.current = null;
    touchStartIndex.current = null;
    onDragEnd();
  };

  return (
    <div className="file-selector">
      <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>选择文件</h2>
      
      <div
        className="file-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h3>拖放文件到这里</h3>
        <p>或者点击下方按钮选择文件</p>
        <button className="btn btn-primary" onClick={handleBrowseClick}>
          浏览文件
        </button>
        <input
          type="file"
          id="file-input"
          multiple
          accept=".pdf,.docx,.xlsx,.pptx"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>
            已选择 {files.length} 个文件
            <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-tertiary)', marginLeft: '10px' }}>
              (拖拽文件可调整顺序)
            </span>
          </h3>
          
          {files.map((file, index) => (
            <div 
              key={index} 
              className={`file-item ${draggedIndex === index ? 'dragging' : ''} ${
                dropTargetIndex === index ? 'drop-target' : ''
              }`}
              draggable="true"
              onDragStart={(e) => handleFileDragStart(e, index)}
              onDragOver={(e) => handleFileDragOver(e, index)}
              onDrop={(e) => handleFileDrop(e, index)}
              onDragEnd={handleFileDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={(e) => handleTouchMove(e, index)}
              onTouchEnd={handleTouchEnd}
              data-testid={`file-item-${index}`}
            >
              {/* 拖拽手柄 */}
              <div className="drag-handle" title="拖拽排序">
                ⠿
              </div>
              
              <div className="file-info">
                <div className="file-icon">
                  {getFileIcon(file.name)}
                </div>
                <div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">
                    {file.size ? formatFileSize(file.size) : '未知大小'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="preview-btn"
                  onClick={() => setPreviewFile(file)}
                  title="预览文件"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                >
                  👁
                </button>
                <button
                  className="remove-btn"
                  onClick={() => onRemoveFile(index)}
                  title="移除文件"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default FileSelector;
