import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    // 优先读取localStorage，否则跟随系统
    const saved = localStorage.getItem('theme');
    if (saved && saved !== 'system') return saved;
    
    // 检测系统主题
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [followSystem, setFollowSystem] = useState(() => {
    return localStorage.getItem('themeFollowSystem') === 'true';
  });

  useEffect(() => {
    if (followSystem) {
      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [followSystem]);

  useEffect(() => {
    // 应用主题
    document.documentElement.setAttribute('data-theme', theme);
    if (!followSystem) {
      localStorage.setItem('theme', theme);
    }
  }, [theme, followSystem]);

  const toggleTheme = () => {
    if (followSystem) {
      // 如果正在跟随系统，切换为手动模式
      setFollowSystem(false);
      localStorage.setItem('themeFollowSystem', 'false');
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    } else {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }
  };

  const toggleFollowSystem = () => {
    const newFollow = !followSystem;
    setFollowSystem(newFollow);
    localStorage.setItem('themeFollowSystem', newFollow.toString());
    
    if (newFollow) {
      // 切换到跟随系统时，立即应用系统主题
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  };

  const buttonStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    color: 'var(--text-primary)',
  };

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <button 
        onClick={toggleTheme} 
        style={buttonStyle}
        title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <button 
        onClick={toggleFollowSystem}
        style={{
          ...buttonStyle,
          backgroundColor: followSystem ? 'var(--primary-color)' : 'var(--bg-secondary)',
          color: followSystem ? 'white' : 'var(--text-primary)',
        }}
        title={followSystem ? '取消跟随系统主题' : '跟随系统主题'}
      >
        💻
      </button>
    </div>
  );
};

export default ThemeToggle;
