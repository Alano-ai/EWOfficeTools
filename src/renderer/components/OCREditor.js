import React, { useState, useEffect } from 'react';

const OCREditor = ({ 
  operation, 
  options, 
  onOptionsChange, 
  onStartProcess, 
  isProcessing, 
  fileCount 
}) => {
  const [ocrResult, setOcrResult] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(['chi_sim', 'eng']);

  // 支持的语言列表
  const supportedLanguages = [
    { code: 'chi_sim', name: '简体中文' },
    { code: 'chi_tra', name: '繁体中文' },
    { code: 'eng', name: '英语' },
    { code: 'jpn', name: '日语' },
    { code: 'kor', name: '韩语' },
    { code: 'fra', name: '法语' },
    { code: 'deu', name: '德语' },
    { code: 'spa', name: '西班牙语' },
    { code: 'rus', name: '俄语' },
    { code: 'ara', name: '阿拉伯语' }
  ];

  // 更新选项
  useEffect(() => {
    onOptionsChange({
      ...options,
      languages: selectedLanguage
    });
  }, [selectedLanguage]);

  const getOperationConfig = () => {
    switch (operation) {
      case 'ocr':
        return {
          title: 'OCR文字识别',
          description: '从图片或扫描PDF中提取文字',
          options: [
            {
              id: 'languages',
              label: '识别语言',
              type: 'multiselect',
              description: '选择要识别的语言（可多选）'
            },
            {
              id: 'outputFormat',
              label: '输出格式',
              type: 'select',
              choices: [
                { value: 'text', label: '纯文本' },
                { value: 'json', label: 'JSON格式' },
                { value: 'hocr', label: 'HOCR格式' }
              ],
              default: 'text'
            },
            {
              id: 'pageRange',
              label: '页码范围（PDF文件）',
              type: 'text',
              placeholder: '例如: 1-5 或 1,3,5',
              description: '留空则识别所有页面'
            }
          ]
        };
      
      case 'ocr-batch':
        return {
          title: '批量OCR识别',
          description: '批量识别多个文件中的文字',
          options: [
            {
              id: 'languages',
              label: '识别语言',
              type: 'multiselect',
              description: '选择要识别的语言（可多选）'
            },
            {
              id: 'outputFormat',
              label: '输出格式',
              type: 'select',
              choices: [
                { value: 'text', label: '纯文本' },
                { value: 'json', label: 'JSON格式' }
              ],
              default: 'text'
            }
          ]
        };
      
      default:
        return { title: '', description: '', options: [] };
    }
  };

  const config = getOperationConfig();

  const handleOptionChange = (optionId, value) => {
    onOptionsChange({
      ...options,
      [optionId]: value
    });
  };

  const handleLanguageToggle = (langCode) => {
    setSelectedLanguage(prev => {
      if (prev.includes(langCode)) {
        return prev.filter(code => code !== langCode);
      } else {
        return [...prev, langCode];
      }
    });
  };

  const handleStartProcess = () => {
    if (selectedLanguage.length === 0) {
      alert('请至少选择一种识别语言');
      return;
    }
    onStartProcess();
  };

  const handleExportText = () => {
    if (!editedText && !ocrResult?.text) {
      alert('没有可导出的文本内容');
      return;
    }

    const textToExport = editedText || ocrResult?.text || '';
    const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr_result_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = () => {
    const textToCopy = editedText || ocrResult?.text || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          alert('文本已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
          alert('复制失败，请手动复制');
        });
    }
  };

  const renderOption = (option) => {
    switch (option.type) {
      case 'multiselect':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              marginBottom: '8px'
            }}>
              {supportedLanguages.map(lang => (
                <label key={lang.code} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '6px 10px',
                  backgroundColor: selectedLanguage.includes(lang.code) ? 'var(--info-bg)' : 'var(--bg-secondary)',
                  border: `1px solid ${selectedLanguage.includes(lang.code) ? '#90cdf4' : 'var(--border-primary)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedLanguage.includes(lang.code)}
                    onChange={() => handleLanguageToggle(lang.code)}
                    style={{ width: '14px', height: '14px' }}
                  />
                  <span>{lang.name}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              已选择: {selectedLanguage.length} 种语言
            </p>
          </div>
        );
      
      case 'select':
        return (
          <select
            value={options[option.id] || option.choices[0].value}
            onChange={(e) => handleOptionChange(option.id, e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)',
              fontSize: '14px'
            }}
          >
            {option.choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        );
      
      case 'text':
        return (
          <input
            type="text"
            value={options[option.id] || ''}
            onChange={(e) => handleOptionChange(option.id, e.target.value)}
            placeholder={option.placeholder}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)',
              fontSize: '14px'
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="ocr-editor" style={{ padding: '20px' }}>
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '8px',
        border: '1px solid var(--border-primary)'
      }}>
        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
          {config.title}
        </h3>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
          {config.description}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {config.options.map((option) => (
          <div key={option.id} style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontWeight: '600',
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              {option.label}
            </label>
            {option.description && (
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--text-tertiary)', 
                marginBottom: '8px' 
              }}>
                {option.description}
              </p>
            )}
            {renderOption(option)}
          </div>
        ))}
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: 'var(--bg-tertiary)', 
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
          处理摘要
        </h4>
        <p style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          已选择 <strong>{fileCount}</strong> 个文件
        </p>
        <p style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          操作类型: <strong>{config.title}</strong>
        </p>
        
        <button
          className="btn btn-primary"
          onClick={handleStartProcess}
          disabled={isProcessing || fileCount === 0}
          style={{
            width: '100%',
            padding: '12px',
            opacity: (isProcessing || fileCount === 0) ? 0.6 : 1,
            cursor: (isProcessing || fileCount === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? '识别中...' : '开始识别'}
        </button>
      </div>

      {/* OCR结果展示区域 */}
      {ocrResult && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h4 style={{ color: 'var(--text-primary)' }}>
              识别结果
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {isEditing ? '完成编辑' : '编辑文本'}
              </button>
              <button
                onClick={handleCopyText}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--info-bg)',
                  border: '1px solid #90cdf4',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--info-color)'
                }}
              >
                复制
              </button>
              <button
                onClick={handleExportText}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid #9ae6b4',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#276749'
                }}
              >
                导出TXT
              </button>
            </div>
          </div>

          {/* 置信度显示 */}
          {ocrResult.confidence !== undefined && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px', 
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  识别置信度
                </span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: ocrResult.confidence > 80 ? 'var(--success-color)' : 
                         ocrResult.confidence > 60 ? 'var(--warning-color)' : 'var(--error-color)'
                }}>
                  {Math.round(ocrResult.confidence)}%
                </span>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: 'var(--border-primary)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${ocrResult.confidence}%`,
                  backgroundColor: ocrResult.confidence > 80 ? 'var(--success-color)' : 
                                   ocrResult.confidence > 60 ? 'var(--warning-color)' : 'var(--error-color)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* 文本内容 */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            border: '1px solid var(--border-primary)'
          }}>
            {isEditing ? (
              <textarea
                value={editedText || ocrResult.text || ''}
                onChange={(e) => setEditedText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '10px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }}
              />
            ) : (
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                margin: 0,
                fontFamily: 'inherit'
              }}>
                {editedText || ocrResult.text || '无识别结果'}
              </pre>
            )}
          </div>

          {/* 统计信息 */}
          {ocrResult.words !== undefined && (
            <div style={{ 
              marginTop: '15px', 
              display: 'flex', 
              gap: '20px',
              fontSize: '13px',
              color: 'var(--text-tertiary)'
            }}>
              <span>字数: {ocrResult.words}</span>
              <span>行数: {ocrResult.lines}</span>
              <span>段落数: {ocrResult.paragraphs}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OCREditor;