import React from 'react';

const OperationPanel = ({ 
  operation, 
  options, 
  onOptionsChange, 
  onStartProcess, 
  isProcessing, 
  fileCount 
}) => {
  const getOperationConfig = () => {
    switch (operation) {
      case 'merge':
        return {
          title: '文档合并选项',
          options: [
            {
              id: 'mergeOrder',
              label: '合并顺序',
              type: 'select',
              choices: [
                { value: 'fileOrder', label: '按文件顺序' },
                { value: 'alphabetical', label: '按文件名排序' },
                { value: 'date', label: '按修改日期' }
              ]
            },
            {
              id: 'addPageNumbers',
              label: '添加页码',
              type: 'checkbox',
              default: true
            },
            {
              id: 'addBookmarks',
              label: '添加书签',
              type: 'checkbox',
              default: false
            }
          ]
        };
      
      case 'split':
        return {
          title: '文档拆分选项',
          options: [
            {
              id: 'splitMethod',
              label: '拆分方式',
              type: 'select',
              choices: [
                { value: 'byPage', label: '按页数拆分' },
                { value: 'bySize', label: '按文件大小拆分' },
                { value: 'byBookmark', label: '按书签拆分' },
                { value: 'custom', label: '自定义拆分' }
              ]
            },
            {
              id: 'pagesPerFile',
              label: '每文件页数',
              type: 'number',
              default: 1,
              min: 1,
              max: 100
            },
            {
              id: 'maxFileSize',
              label: '最大文件大小 (MB)',
              type: 'number',
              default: 10,
              min: 1,
              max: 100
            }
          ]
        };
      
      case 'convert':
        return {
          title: '格式转换选项',
          options: [
            {
              id: 'targetFormat',
              label: '目标格式',
              type: 'select',
              choices: [
                { value: 'pdf', label: 'PDF' },
                { value: 'docx', label: 'Word (.docx)' },
                { value: 'xlsx', label: 'Excel (.xlsx)' },
                { value: 'pptx', label: 'PowerPoint (.pptx)' }
              ]
            },
            {
              id: 'quality',
              label: '转换质量',
              type: 'select',
              choices: [
                { value: 'high', label: '高质量' },
                { value: 'medium', label: '中等质量' },
                { value: 'low', label: '低质量（文件更小）' }
              ]
            },
            {
              id: 'preserveFormatting',
              label: '保留原始格式',
              type: 'checkbox',
              default: true
            }
          ]
        };
      
      case 'adjust':
        return {
          title: '页面调整选项',
          options: [
            {
              id: 'pageSize',
              label: '页面大小',
              type: 'select',
              choices: [
                { value: 'a4', label: 'A4' },
                { value: 'letter', label: 'Letter' },
                { value: 'legal', label: 'Legal' },
                { value: 'custom', label: '自定义' }
              ]
            },
            {
              id: 'orientation',
              label: '页面方向',
              type: 'select',
              choices: [
                { value: 'portrait', label: '纵向' },
                { value: 'landscape', label: '横向' }
              ]
            },
            {
              id: 'marginTop',
              label: '上边距 (mm)',
              type: 'number',
              default: 25,
              min: 0,
              max: 100
            },
            {
              id: 'marginBottom',
              label: '下边距 (mm)',
              type: 'number',
              default: 25,
              min: 0,
              max: 100
            },
            {
              id: 'marginLeft',
              label: '左边距 (mm)',
              type: 'number',
              default: 25,
              min: 0,
              max: 100
            },
            {
              id: 'marginRight',
              label: '右边距 (mm)',
              type: 'number',
              default: 25,
              min: 0,
              max: 100
            }
          ]
        };
      
      case 'watermark':
        return {
          title: '水印设置',
          options: [
            {
              id: 'watermarkType',
              label: '水印类型',
              type: 'select',
              choices: [
                { value: 'text', label: '文字水印' },
                { value: 'image', label: '图片水印' }
              ]
            },
            {
              id: 'text',
              label: '水印文字',
              type: 'text',
              default: '机密文件'
            },
            {
              id: 'fontSize',
              label: '字体大小',
              type: 'number',
              default: 50,
              min: 10,
              max: 200
            },
            {
              id: 'color',
              label: '颜色',
              type: 'color',
              default: '#000000'
            },
            {
              id: 'opacity',
              label: '透明度',
              type: 'range',
              default: 30,
              min: 0,
              max: 100
            },
            {
              id: 'rotation',
              label: '旋转角度',
              type: 'range',
              default: 45,
              min: -180,
              max: 180
            },
            {
              id: 'position',
              label: '位置',
              type: 'select',
              choices: [
                { value: 'top-left', label: '左上角' },
                { value: 'top-center', label: '顶部居中' },
                { value: 'top-right', label: '右上角' },
                { value: 'center-left', label: '左侧居中' },
                { value: 'center', label: '正中' },
                { value: 'center-right', label: '右侧居中' },
                { value: 'bottom-left', label: '左下角' },
                { value: 'bottom-center', label: '底部居中' },
                { value: 'bottom-right', label: '右下角' }
              ]
            },
            {
              id: 'repeat',
              label: '重复水印（平铺）',
              type: 'checkbox',
              default: false
            }
          ]
        };
      
      case 'compress':
        return {
          title: '压缩设置',
          options: [
            {
              id: 'compressionLevel',
              label: '压缩级别',
              type: 'select',
              choices: [
                { value: 'low', label: '低压缩（高质量）' },
                { value: 'medium', label: '中等压缩' },
                { value: 'high', label: '高压缩（低质量）' }
              ]
            }
          ]
        };
      
      case 'encrypt':
        return {
          title: 'PDF加密设置',
          options: [
            {
              id: 'userPassword',
              label: '用户密码',
              type: 'password',
              description: '打开文件时需要输入的密码',
              required: true
            },
            {
              id: 'ownerPassword',
              label: '所有者密码',
              type: 'password',
              description: '设置权限时需要的密码（可选）'
            },
            {
              id: 'encryptionLevel',
              label: '加密级别',
              type: 'select',
              choices: [
                { value: 'aes-256', label: 'AES-256 (最安全)' },
                { value: 'aes-128', label: 'AES-128 (推荐)' },
                { value: 'rc4-128', label: 'RC4-128 (兼容性好)' },
                { value: 'rc4-40', label: 'RC4-40 (旧版兼容)' }
              ],
              default: 'aes-256'
            }
          ]
        };
      
      case 'decrypt':
        return {
          title: 'PDF解密设置',
          options: [
            {
              id: 'password',
              label: '当前密码',
              type: 'password',
              description: '输入当前文件的密码',
              required: true
            }
          ]
        };
      
      case 'permissions':
        return {
          title: 'PDF权限设置',
          options: [
            {
              id: 'ownerPassword',
              label: '所有者密码',
              type: 'password',
              description: '输入所有者密码以修改权限',
              required: true
            }
          ]
        };
      
      case 'ocr':
        return {
          title: 'OCR文字识别',
          options: [
            {
              id: 'languages',
              label: '识别语言',
              type: 'multiselect',
              description: '选择要识别的语言（可多选）',
              choices: [
                { value: 'chi_sim', label: '简体中文' },
                { value: 'chi_tra', label: '繁体中文' },
                { value: 'eng', label: '英语' },
                { value: 'jpn', label: '日语' },
                { value: 'kor', label: '韩语' },
                { value: 'fra', label: '法语' },
                { value: 'deu', label: '德语' },
                { value: 'spa', label: '西班牙语' },
                { value: 'rus', label: '俄语' },
                { value: 'ara', label: '阿拉伯语' }
              ]
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
            }
          ]
        };
      
      default:
        return { title: '', options: [] };
    }
  };

  const config = getOperationConfig();

  const handleOptionChange = (optionId, value) => {
    onOptionsChange({
      ...options,
      [optionId]: value
    });
  };

  const renderOption = (option) => {
    switch (option.type) {
      case 'select':
        return (
          <select
            value={options[option.id] || option.choices[0].value}
            onChange={(e) => handleOptionChange(option.id, e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            {option.choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={options[option.id] !== undefined ? options[option.id] : option.default}
              onChange={(e) => handleOptionChange(option.id, e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>{option.label}</span>
          </label>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={options[option.id] || option.default}
            onChange={(e) => handleOptionChange(option.id, parseInt(e.target.value))}
            min={option.min}
            max={option.max}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)'
            }}
          />
        );
      
      case 'text':
        return (
          <input
            type="text"
            value={options[option.id] || option.default}
            onChange={(e) => handleOptionChange(option.id, e.target.value)}
            placeholder="输入文本"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)'
            }}
          />
        );
      
      case 'color':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="color"
              value={options[option.id] || option.default}
              onChange={(e) => handleOptionChange(option.id, e.target.value)}
              style={{ width: '50px', height: '35px', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              {options[option.id] || option.default}
            </span>
          </div>
        );
      
      case 'range':
        return (
          <div>
            <input
              type="range"
              value={options[option.id] || option.default}
              onChange={(e) => handleOptionChange(option.id, parseInt(e.target.value))}
              min={option.min}
              max={option.max}
              style={{ width: '100%' }}
            />
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              {options[option.id] || option.default}
            </span>
          </div>
        );
      
      case 'password':
        return (
          <input
            type="password"
            value={options[option.id] || ''}
            onChange={(e) => handleOptionChange(option.id, e.target.value)}
            placeholder={option.description || "输入密码"}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)'
            }}
          />
        );
      
      case 'multiselect':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              marginBottom: '8px'
            }}>
              {(option.choices || []).map((choice) => (
                <label key={choice.value} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '6px 10px',
                  backgroundColor: (options[option.id] || []).includes(choice.value) ? 'var(--info-bg)' : 'var(--bg-secondary)',
                  border: `1px solid ${(options[option.id] || []).includes(choice.value) ? '#90cdf4' : 'var(--border-primary)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}>
                  <input
                    type="checkbox"
                    checked={(options[option.id] || []).includes(choice.value)}
                    onChange={(e) => {
                      const currentValues = options[option.id] || [];
                      const newValues = e.target.checked 
                        ? [...currentValues, choice.value]
                        : currentValues.filter(v => v !== choice.value);
                      handleOptionChange(option.id, newValues);
                    }}
                    style={{ width: '14px', height: '14px' }}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              已选择: {(options[option.id] || []).length} 项
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="operation-panel">
      <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>{config.title}</h2>
      
      <div className="operation-group">
        <div className="operation-options">
          {config.options.map((option) => (
            <div key={option.id} style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                {option.label}
              </label>
              {renderOption(option)}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '8px',
        border: '1px solid var(--border-primary)'
      }}>
        <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>
          处理摘要
        </h3>
        <p style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>
          已选择 <strong>{fileCount}</strong> 个文件
        </p>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          操作类型: <strong>{config.title}</strong>
        </p>
        
        <button
          className="btn btn-primary"
          onClick={onStartProcess}
          disabled={isProcessing || fileCount === 0}
          style={{
            width: '100%',
            opacity: (isProcessing || fileCount === 0) ? 0.6 : 1,
            cursor: (isProcessing || fileCount === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? '处理中...' : '开始处理'}
        </button>
      </div>
    </div>
  );
};

export default OperationPanel;
