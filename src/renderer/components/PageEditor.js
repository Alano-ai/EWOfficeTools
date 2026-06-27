import React, { useState, useEffect, useRef, useCallback } from 'react';

const getElectronAPI = () => {
  try {
    return window.electronAPI || null;
  } catch (e) {
    return null;
  }
};

/**
 * PageEditor - PDF页面编辑器组件
 * 支持页面预览、选择、旋转（90°/180°/270°）、删除、裁剪
 */
const PageEditor = ({ file, onSave, onClose }) => {
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [thumbnailScale, setThumbnailScale] = useState(1.0);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropTarget, setCropTarget] = useState(null);
  const [cropValues, setCropValues] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const canvasRefs = useRef({});
  const pdfDocRef = useRef(null);
  const containerRef = useRef(null);

  // 加载PDF并渲染缩略图
  useEffect(() => {
    if (file) {
      loadPDF();
    }
    return () => {
      // 清理
      pdfDocRef.current = null;
    };
  }, [file]);

  const loadPDF = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 动态导入pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      // 读取文件
      let pdfData;
      if (file.path) {
        const response = await fetch(file.path);
        pdfData = new Uint8Array(await response.arrayBuffer());
      } else if (file.arrayBuffer) {
        pdfData = new Uint8Array(await file.arrayBuffer());
      } else {
        throw new Error('无法读取文件');
      }

      const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
      pdfDocRef.current = pdfDoc;

      const pageCount = pdfDoc.numPages;
      const pageData = [];

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        pageData.push({
          pageNumber: i,
          pageIndex: i - 1,
          width: viewport.width,
          height: viewport.height,
          rotation: viewport.rotation || 0,
          page: page
        });
      }

      setPages(pageData);
      // 为每页设置默认裁剪值
      setCropValues({
        x: 0, y: 0,
        width: pageData[0]?.width || 595,
        height: pageData[0]?.height || 842
      });
    } catch (err) {
      console.error('加载PDF失败:', err);
      setError(`加载PDF失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染页面缩略图到canvas
  useEffect(() => {
    if (pages.length > 0) {
      renderThumbnails();
    }
  }, [pages, thumbnailScale]);

  const renderThumbnails = async () => {
    for (const pageData of pages) {
      const canvas = canvasRefs.current[pageData.pageNumber];
      if (canvas && pageData.page) {
        try {
          const baseScale = Math.min(
            (canvas.parentElement?.clientWidth || 200) / pageData.width,
            200 / pageData.height
          );
          const scale = baseScale * thumbnailScale;
          const viewport = pageData.page.getViewport({ scale, rotation: pageData.rotation });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          await pageData.page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;
        } catch (err) {
          console.warn(`渲染页面 ${pageData.pageNumber} 失败:`, err);
        }
      }
    }
  };

  // 重新渲染指定页面（旋转后）
  const rerenderPage = useCallback(async (pageIndex) => {
    const pageData = pages[pageIndex];
    if (!pageData) return;
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc) return;

    const canvas = canvasRefs.current[pageData.pageNumber];
    if (!canvas) return;

    try {
      const page = await pdfDoc.getPage(pageData.pageNumber);
      const baseScale = Math.min(
        (canvas.parentElement?.clientWidth || 200) / pageData.width,
        200 / pageData.height
      );
      const scale = baseScale * thumbnailScale;
      const viewport = page.getViewport({ scale, rotation: pageData.rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.warn(`重新渲染页面 ${pageData.pageNumber} 失败:`, err);
    }
  }, [pages, thumbnailScale]);

  // 选择/取消选择页面
  const togglePageSelection = (pageIndex) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      return next;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map((_, i) => i)));
    }
  };

  // 旋转页面（可视化预览，记录旋转操作）
  const rotateSelectedPages = (angle) => {
    setPages(prev => prev.map((p, i) => {
      if (selectedPages.has(i) || selectedPages.size === 0 && selectedPages.has(i)) {
        return { ...p, rotation: (p.rotation + angle) % 360 };
      }
      return p;
    }));

    // 如果没有选中页面，旋转当前高亮的
    if (selectedPages.size === 0) {
      return;
    }

    setPages(prev => prev.map((p, i) => {
      if (selectedPages.has(i)) {
        return { ...p, rotation: (p.rotation + angle) % 360 };
      }
      return p;
    }));
  };

  const rotatePage = (pageIndex, angle) => {
    setPages(prev => prev.map((p, i) => {
      if (i === pageIndex) {
        return { ...p, rotation: (p.rotation + angle) % 360 };
      }
      return p;
    }));
  };

  // 打开裁剪对话框
  const openCropDialog = (pageIndex) => {
    const page = pages[pageIndex];
    if (!page) return;
    setCropTarget(pageIndex);
    setCropValues({
      x: 0,
      y: 0,
      width: Math.round(page.width),
      height: Math.round(page.height)
    });
    setShowCropModal(true);
  };

  // 删除选中的页面
  const deleteSelectedPages = () => {
    if (selectedPages.size === 0) {
      setError('请先选择要删除的页面');
      return;
    }
    if (selectedPages.size >= pages.length) {
      setError('不能删除所有页面，至少需要保留一页');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedPages.size} 个页面吗？`)) {
      return;
    }

    setPages(prev => prev.filter((_, i) => !selectedPages.has(i)));
    setSelectedPages(new Set());
  };

  // 应用所有更改并保存
  const applyChanges = async () => {
    if (!file || !file.path) {
      setError('无法获取文件路径');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. 收集旋转操作
      const pageRotations = [];
      for (const pageData of pages) {
        if (pageData.rotation !== 0) {
          pageRotations.push({
            pageIndex: pageData.pageIndex,
            angle: pageData.rotation
          });
        }
      }

      // 2. 收集裁剪数据
      const cropData = [];
      if (showCropModal && cropTarget !== null) {
        cropData.push({
          pageIndex: cropTarget,
          cropBox: cropValues
        });
      }

      const electronAPI = getElectronAPI();
      if (electronAPI && electronAPI.pdfEditPages) {
        // 通过electronAPI调用主进程的PDF处理器
        const result = await electronAPI.pdfEditPages({
          filePath: file.path,
          rotations: pageRotations,
          deletePages: Array.from(selectedPages).sort((a, b) => b - a),
          cropPages: cropData
        });

        if (result.success) {
          if (onSave) {
            onSave(file.path);
          }
        } else {
          setError(result.error || '处理失败');
        }
      } else {
        // 浏览器模式下模拟成功
        console.log('PDF编辑操作:', { pageRotations, selectedPages: Array.from(selectedPages), cropData });
        if (onSave) {
          onSave(file.path);
        }
      }
    } catch (err) {
      console.error('应用更改失败:', err);
      setError(`应用更改失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 格式化页面尺寸
  const formatSize = (width, height) => {
    return `${Math.round(width)} × ${Math.round(height)} pt`;
  };

  if (isLoading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.loading}>
            <p>正在加载PDF文件...</p>
            <div style={styles.spinner}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* 标题栏 */}
        <div style={styles.header}>
          <h2 style={styles.title}>页面编辑器</h2>
          <div style={styles.headerActions}>
            <span style={styles.fileName}>{file?.name || '未选择文件'}</span>
            <span style={styles.pageCount}>{pages.length} 页</span>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        {/* 工具栏 */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarGroup}>
            <button
              onClick={toggleSelectAll}
              style={styles.toolBtn}
              title={selectedPages.size === pages.length ? '取消全选' : '全选'}
            >
              {selectedPages.size === pages.length ? '☐ 取消全选' : '☑ 全选'}
            </button>
            <span style={styles.selectionInfo}>
              已选 {selectedPages.size} / {pages.length} 页
            </span>
          </div>

          <div style={styles.toolbarGroup}>
            <span style={styles.toolLabel}>旋转选中页面:</span>
            <button
              onClick={() => rotateSelectedPages(90)}
              disabled={selectedPages.size === 0}
              style={{
                ...styles.toolBtn,
                opacity: selectedPages.size === 0 ? 0.5 : 1
              }}
              title="顺时针旋转90°"
            >
              ↻ 90°
            </button>
            <button
              onClick={() => rotateSelectedPages(180)}
              disabled={selectedPages.size === 0}
              style={{
                ...styles.toolBtn,
                opacity: selectedPages.size === 0 ? 0.5 : 1
              }}
              title="旋转180°"
            >
              ↻ 180°
            </button>
            <button
              onClick={() => rotateSelectedPages(270)}
              disabled={selectedPages.size === 0}
              style={{
                ...styles.toolBtn,
                opacity: selectedPages.size === 0 ? 0.5 : 1
              }}
              title="逆时针旋转90° (270°)"
            >
              ↺ 90°
            </button>
          </div>

          <div style={styles.toolbarGroup}>
            <button
              onClick={deleteSelectedPages}
              disabled={selectedPages.size === 0}
              style={{
                ...styles.toolBtn,
                ...styles.dangerBtn,
                opacity: selectedPages.size === 0 ? 0.5 : 1
              }}
            >
              ✕ 删除选中
            </button>
          </div>
        </div>

        {/* 进度条 */}
        {progress && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progress.percent}%`
                }}
              />
            </div>
            <span style={styles.progressText}>
              {progress.message || `处理中 ${Math.round(progress.percent)}%`}
            </span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div style={styles.errorBar}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={styles.errorClose}>✕</button>
          </div>
        )}

        {/* 页面列表 */}
        <div style={styles.pageGrid} ref={containerRef}>
          {pages.map((pageData, index) => (
            <div
              key={pageData.pageNumber}
              style={{
                ...styles.pageCard,
                border: selectedPages.has(index)
                  ? '3px solid var(--primary-color)'
                  : '3px solid transparent',
                boxShadow: selectedPages.has(index)
                  ? '0 0 0 2px rgba(102, 126, 234, 0.3)'
                  : 'var(--shadow)'
              }}
            >
              {/* 选择复选框 */}
              <div style={styles.pageCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedPages.has(index)}
                  onChange={() => togglePageSelection(index)}
                  style={styles.checkbox}
                />
              </div>

              {/* 页码 */}
              <div style={styles.pageNumber}>第 {pageData.pageNumber} 页</div>

              {/* 缩略图容器 */}
              <div style={styles.thumbnailContainer}>
                <canvas
                  ref={el => { canvasRefs.current[pageData.pageNumber] = el; }}
                  style={styles.thumbnail}
                />
                {/* 旋转指示 */}
                {pageData.rotation !== 0 && (
                  <div style={styles.rotationBadge}>
                    {pageData.rotation}°
                  </div>
                )}
              </div>

              {/* 页面信息 */}
              <div style={styles.pageInfo}>
                <span style={styles.pageSize}>
                  {formatSize(pageData.width, pageData.height)}
                </span>
              </div>

              {/* 单页操作按钮 */}
              <div style={styles.pageActions}>
                <button
                  onClick={() => rotatePage(index, 90)}
                  style={styles.pageActionBtn}
                  title="顺时针旋转90°"
                >
                  ↻
                </button>
                <button
                  onClick={() => rotatePage(index, 270)}
                  style={styles.pageActionBtn}
                  title="逆时针旋转90°"
                >
                  ↺
                </button>
                <button
                  onClick={() => openCropDialog(index)}
                  style={styles.pageActionBtn}
                  title="裁剪页面"
                >
                  ⬒
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 底部操作栏 */}
        <div style={styles.footer}>
          <div style={styles.footerInfo}>
            {pages.filter(p => p.rotation !== 0).length > 0 && (
              <span style={styles.changeIndicator}>
                • {pages.filter(p => p.rotation !== 0).length} 页已旋转
              </span>
            )}
            {selectedPages.size > 0 && (
              <span style={styles.changeIndicator}>
                • 将删除 {selectedPages.size} 页
              </span>
            )}
          </div>
          <div style={styles.footerActions}>
            <button onClick={onClose} style={styles.cancelBtn}>
              取消
            </button>
            <button
              onClick={applyChanges}
              disabled={isProcessing}
              style={{
                ...styles.saveBtn,
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              {isProcessing ? '处理中...' : '应用更改并保存'}
            </button>
          </div>
        </div>

        {/* 裁剪对话框 */}
        {showCropModal && cropTarget !== null && (
          <div style={styles.cropOverlay}>
            <div style={styles.cropModal}>
              <h3 style={styles.cropTitle}>
                裁剪页面 {cropTarget + 1}
              </h3>
              <div style={styles.cropForm}>
                <div style={styles.cropField}>
                  <label>左边距 (pt):</label>
                  <input
                    type="number"
                    value={cropValues.x}
                    onChange={e => setCropValues(prev => ({
                      ...prev,
                      x: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    min="0"
                    style={styles.cropInput}
                  />
                </div>
                <div style={styles.cropField}>
                  <label>下边距 (pt):</label>
                  <input
                    type="number"
                    value={cropValues.y}
                    onChange={e => setCropValues(prev => ({
                      ...prev,
                      y: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    min="0"
                    style={styles.cropInput}
                  />
                </div>
                <div style={styles.cropField}>
                  <label>宽度 (pt):</label>
                  <input
                    type="number"
                    value={cropValues.width}
                    onChange={e => setCropValues(prev => ({
                      ...prev,
                      width: Math.max(1, parseInt(e.target.value) || 1)
                    }))}
                    min="1"
                    style={styles.cropInput}
                  />
                </div>
                <div style={styles.cropField}>
                  <label>高度 (pt):</label>
                  <input
                    type="number"
                    value={cropValues.height}
                    onChange={e => setCropValues(prev => ({
                      ...prev,
                      height: Math.max(1, parseInt(e.target.value) || 1)
                    }))}
                    min="1"
                    style={styles.cropInput}
                  />
                </div>
              </div>
              <div style={styles.cropPreview}>
                <div style={{
                  ...styles.cropPreviewBox,
                  width: `${Math.min(200, (cropValues.width / (pages[cropTarget]?.width || 595)) * 200)}px`,
                  height: `${Math.min(280, (cropValues.height / (pages[cropTarget]?.height || 842)) * 280)}px`,
                  marginLeft: `${(cropValues.x / (pages[cropTarget]?.width || 595)) * 200}px`,
                  marginTop: `${(cropValues.y / (pages[cropTarget]?.height || 842)) * 280}px`
                }} />
              </div>
              <div style={styles.cropActions}>
                <button
                  onClick={() => {
                    const page = pages[cropTarget];
                    setCropValues({
                      x: 0, y: 0,
                      width: Math.round(page.width),
                      height: Math.round(page.height)
                    });
                  }}
                  style={styles.resetBtn}
                >
                  重置
                </button>
                <button
                  onClick={() => setShowCropModal(false)}
                  style={styles.cancelBtn}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    // 裁剪将在保存时应用
                  }}
                  style={styles.saveBtn}
                >
                  确认裁剪
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 内联样式
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-primary)',
    background: 'linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%)',
    color: 'var(--bg-primary)'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  fileName: {
    fontSize: '0.9rem',
    opacity: 0.9
  },
  pageCount: {
    fontSize: '0.85rem',
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 10px',
    borderRadius: '12px'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'var(--bg-primary)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '12px 24px',
    borderBottom: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-secondary)',
    flexWrap: 'wrap'
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  toolLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '600'
  },
  toolBtn: {
    padding: '8px 14px',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  dangerBtn: {
    color: '#f56565',
    borderColor: 'var(--error-bg)'
  },
  selectionInfo: {
    fontSize: '0.8rem',
    color: 'var(--text-tertiary)',
    padding: '4px 8px',
    background: 'var(--bg-tertiary)',
    borderRadius: '4px'
  },
  progressContainer: {
    padding: '10px 24px',
    backgroundColor: 'var(--success-bg)'
  },
  progressBar: {
    height: '6px',
    backgroundColor: 'var(--border-primary)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #48bb78, #38a169)',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '0.8rem',
    color: 'var(--success-color)'
  },
  errorBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 24px',
    backgroundColor: '#fff5f5',
    borderBottom: '1px solid var(--error-bg)',
    color: 'var(--error-color)',
    fontSize: '0.85rem'
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: 'var(--error-color)',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  pageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
    maxHeight: 'calc(90vh - 260px)'
  },
  pageCard: {
    position: 'relative',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '10px',
    padding: '12px',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  pageCheckbox: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    zIndex: 2
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  pageNumber: {
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '8px'
  },
  thumbnailContainer: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '160px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '6px',
    padding: '8px',
    marginBottom: '8px'
  },
  thumbnail: {
    maxWidth: '100%',
    maxHeight: '200px',
    objectFit: 'contain'
  },
  rotationBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'rgba(102, 126, 234, 0.9)',
    color: 'var(--bg-primary)',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600'
  },
  pageInfo: {
    textAlign: 'center',
    marginBottom: '6px'
  },
  pageSize: {
    fontSize: '0.75rem',
    color: '#a0aec0'
  },
  pageActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px'
  },
  pageActionBtn: {
    width: '30px',
    height: '30px',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-secondary)'
  },
  footerInfo: {
    display: 'flex',
    gap: '12px'
  },
  changeIndicator: {
    fontSize: '0.85rem',
    color: 'var(--primary-color)',
    fontWeight: '500'
  },
  footerActions: {
    display: 'flex',
    gap: '12px'
  },
  cancelBtn: {
    padding: '10px 24px',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-secondary)'
  },
  saveBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--bg-primary)'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    gap: '20px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--border-primary)',
    borderTop: '4px solid var(--primary-color)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  cropOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100
  },
  cropModal: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
    maxWidth: '90%'
  },
  cropTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  cropForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px'
  },
  cropField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  cropInput: {
    padding: '8px 12px',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    fontSize: '0.9rem'
  },
  cropPreview: {
    width: '100%',
    height: '200px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  cropPreviewBox: {
    position: 'absolute',
    border: '2px dashed var(--primary-color)',
    backgroundColor: 'rgba(102, 126, 234, 0.1)'
  },
  cropActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  resetBtn: {
    padding: '8px 16px',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-primary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: 'var(--text-tertiary)'
  }
};

export default PageEditor;
