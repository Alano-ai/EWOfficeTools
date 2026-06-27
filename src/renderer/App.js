import React, { useState, useEffect } from 'react';
import './styles/global.css';
import FileSelector from './components/FileSelector';
import OperationPanel from './components/OperationPanel';
import ProgressDisplay from './components/ProgressDisplay';
import ResultDisplay from './components/ResultDisplay';
import Header from './components/Header';
import ErrorMessage from './components/ErrorMessage';
import WatermarkEditor from './components/WatermarkEditor';
import SecurityEditor from './components/SecurityEditor';
import OCREditor from './components/OCREditor';
import AboutDialog from './components/AboutDialog';

const App = () => {
  const [files, setFiles] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [operationOptions, setOperationOptions] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    // 监听进度更新
    if (window.electronAPI) {
      window.electronAPI.onProgress((progressData) => {
        setProgress(progressData.percent);
      });

      window.electronAPI.onError((errorData) => {
        setError(errorData.message);
        setIsProcessing(false);
      });

      // 监听Electron原生菜单操作
      window.electronAPI.onMenuAction((data) => {
        const { action, operation } = data;
        handleMenuAction(action, operation);
      });
    }

    // 监听自定义菜单操作事件
    const handleAppAction = (event) => {
      const { action, operation } = event.detail;
      handleMenuAction(action, operation);
    };

    window.addEventListener('app-action', handleAppAction);
    return () => window.removeEventListener('app-action', handleAppAction);
  }, []);

  const handleMenuAction = (action, operation) => {
    switch (action) {
      case 'clear':
        handleClearAll();
        break;
      case 'select-operation':
        setSelectedOperation(operation);
        setOperationOptions({});
        break;
      case 'show-about':
        setShowAbout(true);
        break;
      case 'open-file':
        // 触发文件选择
        if (window.electronAPI) {
          window.electronAPI.selectFiles({
            filters: [
              { name: '文档文件', extensions: ['pdf', 'docx', 'xlsx', 'pptx'] },
              { name: '所有文件', extensions: ['*'] }
            ]
          }).then(filePaths => {
            if (filePaths && filePaths.length > 0) {
              const fileObjects = filePaths.map(p => ({
                name: p.split('\\').pop(),
                path: p,
                size: 0,
                type: p.split('.').pop()
              }));
              handleFilesSelected(fileObjects);
            }
          });
        }
        break;
      default:
        break;
    }
  };

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
    setError(null);
    setResults([]);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleFileReorder = (startIndex, endIndex) => {
    const newFiles = [...files];
    const [removed] = newFiles.splice(startIndex, 1);
    newFiles.splice(endIndex, 0, removed);
    setFiles(newFiles);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index) => {
    setDropTargetIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleOperationSelect = (operation) => {
    setSelectedOperation(operation);
    setOperationOptions({});
  };

  const handleOptionsChange = (options) => {
    setOperationOptions(options);
  };

  const handleStartProcess = async () => {
    if (files.length === 0) {
      setError('请先选择文件');
      return;
    }

    if (!selectedOperation) {
      setError('请选择操作类型');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResults([]);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.processFiles(
          selectedOperation,
          files,
          operationOptions
        );
        
        if (result.success) {
          setResults(result.results);
        } else {
          setError(result.error);
        }
      } else {
        await simulateProcessing();
        const mockResults = files.map((file, index) => ({
          id: index,
          name: `processed_${file.name}`,
          size: file.size,
          type: file.type,
          path: file.path
        }));
        setResults(mockResults);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateProcessing = () => {
    return new Promise((resolve) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setTimeout(resolve, 500);
        }
        setProgress(Math.min(currentProgress, 100));
      }, 200);
    });
  };

  const handleDownload = async (result) => {
    if (window.electronAPI) {
      const savePath = await window.electronAPI.saveFile({
        defaultPath: result.name,
        filters: [{ name: '所有文件', extensions: ['*'] }]
      });
      if (savePath) {
        // 调用主进程保存文件
        console.log('Save to:', savePath);
      }
    }
  };

  const handleDownloadAll = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        console.log('Save all to:', dir);
      }
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    setSelectedOperation(null);
    setOperationOptions({});
    setResults([]);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="app-container">
      <Header 
        selectedOperation={selectedOperation}
        onOperationSelect={handleOperationSelect}
      />
      
      <div className="main-content">
        <div className="content-area">
          <FileSelector 
            files={files}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemoveFile}
            onFileReorder={handleFileReorder}
            draggedIndex={draggedIndex}
            dropTargetIndex={dropTargetIndex}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
          
          {selectedOperation && (
            <OperationPanel
              operation={selectedOperation}
              options={operationOptions}
              onOptionsChange={handleOptionsChange}
              onStartProcess={handleStartProcess}
              isProcessing={isProcessing}
              fileCount={files.length}
            />
          )}
          
          {selectedOperation === 'watermark' && (
            <WatermarkEditor
              onWatermarkChange={(watermarkOptions) => {
                handleOptionsChange({
                  ...operationOptions,
                  watermark: watermarkOptions
                });
              }}
              onApplyWatermark={handleStartProcess}
              isProcessing={isProcessing}
            />
          )}
          
          {(selectedOperation === 'encrypt' || selectedOperation === 'decrypt' || selectedOperation === 'permissions') && (
            <SecurityEditor
              operation={selectedOperation}
              options={operationOptions}
              onOptionsChange={handleOptionsChange}
              onStartProcess={handleStartProcess}
              isProcessing={isProcessing}
              fileCount={files.length}
            />
          )}
          
          {selectedOperation === 'ocr' && (
            <OCREditor
              operation={selectedOperation}
              options={operationOptions}
              onOptionsChange={handleOptionsChange}
              onStartProcess={handleStartProcess}
              isProcessing={isProcessing}
              fileCount={files.length}
            />
          )}
          
          {isProcessing && (
            <ProgressDisplay progress={progress} />
          )}
          
          {error && <ErrorMessage message={error} />}
          
          {results.length > 0 && (
            <ResultDisplay
              results={results}
              onDownload={handleDownload}
              onDownloadAll={handleDownloadAll}
              onClear={handleClearAll}
            />
          )}
        </div>
      </div>

      {showAbout && (
        <AboutDialog onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
};

export default App;
