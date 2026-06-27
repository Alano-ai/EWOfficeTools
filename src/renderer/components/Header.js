import React from 'react';
import ThemeToggle from './ThemeToggle';
import { OPERATIONS } from '../config/operations';

const Header = ({ selectedOperation, onOperationSelect }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* 应用标题 */}
        <div className="app-title">
          <span className="app-icon">📄</span>
          <div className="app-name">
            <h1>EW Office Tools</h1>
            <p>文档处理工具</p>
          </div>
        </div>

        {/* 工具栏 - 操作类型 */}
        <div className="toolbar">
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              className={`toolbar-btn ${selectedOperation === op.id ? 'active' : ''}`}
              onClick={() => onOperationSelect(op.id)}
              title={op.desc}
            >
              <span className="toolbar-icon">{op.icon}</span>
              <span className="toolbar-label">{op.name}</span>
            </button>
          ))}
        </div>

        {/* 主题切换 */}
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
