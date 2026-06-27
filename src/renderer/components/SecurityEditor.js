import React, { useState, useEffect } from 'react';

const SecurityEditor = ({ 
  operation, 
  options, 
  onOptionsChange, 
  onStartProcess, 
  isProcessing, 
  fileCount 
}) => {
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: '无',
    feedback: [],
    color: 'var(--border-primary)'
  });

  // 检测密码强度
  useEffect(() => {
    if (operation === 'encrypt' && options.userPassword) {
      checkPasswordStrength(options.userPassword);
    }
  }, [operation, options.userPassword]);

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        level: '无',
        feedback: ['请输入密码'],
        color: 'var(--border-primary)'
      });
      return;
    }

    let score = 0;
    const feedback = [];

    // 长度检查
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length < 8) feedback.push('密码长度至少8位');

    // 复杂度检查
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // 反馈
    if (!/[a-z]/.test(password)) feedback.push('包含小写字母');
    if (!/[A-Z]/.test(password)) feedback.push('包含大写字母');
    if (!/[0-9]/.test(password)) feedback.push('包含数字');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('包含特殊字符');

    // 计算强度等级
    let level, color;
    if (score <= 2) {
      level = '弱';
      color = 'var(--error-color)';
    } else if (score <= 4) {
      level = '中';
      color = 'var(--warning-color)';
    } else if (score <= 6) {
      level = '强';
      color = 'var(--success-color)';
    } else {
      level = '非常强';
      color = 'var(--info-color)';
    }

    setPasswordStrength({
      score,
      level,
      feedback: feedback.length > 0 ? feedback : ['密码强度良好'],
      color
    });
  };

  const getOperationConfig = () => {
    switch (operation) {
      case 'encrypt':
        return {
          title: 'PDF加密设置',
          description: '为PDF文件设置密码保护和权限',
          options: [
            {
              id: 'userPassword',
              label: '用户密码',
              type: 'password',
              description: '打开文件时需要输入的密码',
              required: true
            },
            {
              id: 'confirmUserPassword',
              label: '确认用户密码',
              type: 'password',
              description: '再次输入用户密码',
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
          description: '移除PDF文件的密码保护',
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
          description: '修改PDF文件的访问权限',
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
      
      default:
        return { title: '', description: '', options: [] };
    }
  };

  const getPermissionOptions = () => [
    {
      id: 'print',
      label: '允许打印',
      type: 'checkbox',
      default: true,
      description: '允许用户打印文档'
    },
    {
      id: 'modify',
      label: '允许修改',
      type: 'checkbox',
      default: true,
      description: '允许用户修改文档内容'
    },
    {
      id: 'copy',
      label: '允许复制',
      type: 'checkbox',
      default: true,
      description: '允许用户复制文档内容'
    },
    {
      id: 'annotate',
      label: '允许注释',
      type: 'checkbox',
      default: true,
      description: '允许用户添加注释'
    },
    {
      id: 'fillForms',
      label: '允许填写表单',
      type: 'checkbox',
      default: true,
      description: '允许用户填写表单字段'
    },
    {
      id: 'accessibility',
      label: '允许辅助功能',
      type: 'checkbox',
      default: true,
      description: '允许辅助功能访问文档内容'
    },
    {
      id: 'assembly',
      label: '允许文档组装',
      type: 'checkbox',
      default: true,
      description: '允许用户组装文档（如合并、拆分）'
    }
  ];

  const config = getOperationConfig();

  const handleOptionChange = (optionId, value) => {
    onOptionsChange({
      ...options,
      [optionId]: value
    });
  };

  const handlePermissionChange = (permissionId, value) => {
    onOptionsChange({
      ...options,
      permissions: {
        ...options.permissions,
        [permissionId]: value
      }
    });
  };

  const validateForm = () => {
    if (operation === 'encrypt') {
      if (!options.userPassword) {
        return '请输入用户密码';
      }
      if (options.userPassword.length < 6) {
        return '用户密码长度至少6位';
      }
      if (options.userPassword !== options.confirmUserPassword) {
        return '两次输入的用户密码不一致';
      }
    } else if (operation === 'decrypt') {
      if (!options.password) {
        return '请输入当前密码';
      }
    } else if (operation === 'permissions') {
      if (!options.ownerPassword) {
        return '请输入所有者密码';
      }
    }
    return null;
  };

  const handleStartProcess = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    onStartProcess();
  };

  const renderOption = (option) => {
    switch (option.type) {
      case 'password':
        return (
          <div>
            <input
              type="password"
              value={options[option.id] || ''}
              onChange={(e) => handleOptionChange(option.id, e.target.value)}
              placeholder={option.description}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-primary)',
                fontSize: '14px'
              }}
            />
            {option.id === 'userPassword' && operation === 'encrypt' && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    密码强度:
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: passwordStrength.color 
                  }}>
                    {passwordStrength.level}
                  </span>
                </div>
                <div style={{
                  height: '4px',
                  backgroundColor: 'var(--border-primary)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength.score / 7) * 100}%`,
                    backgroundColor: passwordStrength.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {passwordStrength.feedback.map((feedback, index) => (
                      <div key={index} style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-tertiary)',
                        marginBottom: '2px'
                      }}>
                        • {feedback}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
      
      case 'checkbox':
        return (
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={options[option.id] !== undefined ? options[option.id] : option.default}
              onChange={(e) => handleOptionChange(option.id, e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>{option.label}</span>
          </label>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="security-editor" style={{ padding: '20px' }}>
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
              {option.required && (
                <span style={{ color: 'var(--error-color)', marginLeft: '4px' }}>*</span>
              )}
            </label>
            {renderOption(option)}
          </div>
        ))}
      </div>

      {operation === 'encrypt' && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '8px',
          border: '1px solid var(--border-primary)'
        }}>
          <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
            权限设置
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '10px' 
          }}>
            {getPermissionOptions().map((permission) => (
              <label key={permission.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--border-primary)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={options.permissions?.[permission.id] !== undefined ? 
                    options.permissions[permission.id] : permission.default}
                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {permission.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {permission.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {operation === 'permissions' && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '8px',
          border: '1px solid var(--border-primary)'
        }}>
          <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
            修改权限
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '10px' 
          }}>
            {getPermissionOptions().map((permission) => (
              <label key={permission.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--border-primary)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={options.permissions?.[permission.id] !== undefined ? 
                    options.permissions[permission.id] : permission.default}
                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {permission.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {permission.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

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
          {isProcessing ? '处理中...' : '开始处理'}
        </button>
      </div>
    </div>
  );
};

export default SecurityEditor;