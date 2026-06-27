import React, { useState, useCallback } from 'react';

const WatermarkEditor = ({ onWatermarkChange, onApplyWatermark, isProcessing }) => {
  const [watermarkType, setWatermarkType] = useState('text');
  const [textOptions, setTextOptions] = useState({
    text: '机密文件',
    fontSize: 50,
    fontName: 'Helvetica',
    color: '#000000',
    opacity: 0.3,
    rotation: 45,
    position: 'center',
    repeat: false,
    spacing: 200
  });
  const [imageOptions, setImageOptions] = useState({
    imagePath: '',
    width: 200,
    height: 100,
    opacity: 0.3,
    position: 'center',
    rotation: 0,
    repeat: false,
    spacing: 300
  });

  const fontOptions = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'HelveticaBold', label: 'Helvetica Bold' },
    { value: 'HelveticaOblique', label: 'Helvetica Oblique' },
    { value: 'Courier', label: 'Courier' },
    { value: 'CourierBold', label: 'Courier Bold' },
    { value: 'TimesRoman', label: 'Times Roman' },
    { value: 'TimesBold', label: 'Times Bold' },
    { value: 'TimesItalic', label: 'Times Italic' },
    { value: 'Symbol', label: 'Symbol' },
    { value: 'ZapfDingbats', label: 'Zapf Dingbats' }
  ];

  const positionOptions = [
    { value: 'top-left', label: '左上角' },
    { value: 'top-center', label: '顶部居中' },
    { value: 'top-right', label: '右上角' },
    { value: 'center-left', label: '左侧居中' },
    { value: 'center', label: '正中' },
    { value: 'center-right', label: '右侧居中' },
    { value: 'bottom-left', label: '左下角' },
    { value: 'bottom-center', label: '底部居中' },
    { value: 'bottom-right', label: '右下角' }
  ];

  const handleTextOptionChange = useCallback((key, value) => {
    setTextOptions(prev => {
      const newOptions = { ...prev, [key]: value };
      onWatermarkChange({
        type: 'text',
        ...newOptions
      });
      return newOptions;
    });
  }, [onWatermarkChange]);

  const handleImageOptionChange = useCallback((key, value) => {
    setImageOptions(prev => {
      const newOptions = { ...prev, [key]: value };
      onWatermarkChange({
        type: 'image',
        ...newOptions
      });
      return newOptions;
    });
  }, [onWatermarkChange]);

  const handleTypeChange = useCallback((type) => {
    setWatermarkType(type);
    if (type === 'text') {
      onWatermarkChange({
        type: 'text',
        ...textOptions
      });
    } else {
      onWatermarkChange({
        type: 'image',
        ...imageOptions
      });
    }
  }, [onWatermarkChange, textOptions, imageOptions]);

  const handleSelectImage = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.selectFiles({
        filters: [
          { name: '图片文件', extensions: ['png', 'jpg', 'jpeg'] }
        ]
      });
      if (result && result.length > 0) {
        handleImageOptionChange('imagePath', result[0]);
      }
    }
  };

  const currentOptions = watermarkType === 'text' ? textOptions : imageOptions;

  const renderTextOptions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* 水印文字 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          水印文字
        </label>
        <input
          type="text"
          value={textOptions.text}
          onChange={(e) => handleTextOptionChange('text', e.target.value)}
          placeholder="输入水印文字"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-primary)'
          }}
        />
      </div>

      {/* 字体选择 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          字体
        </label>
        <select
          value={textOptions.fontName}
          onChange={(e) => handleTextOptionChange('fontName', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          {fontOptions.map(font => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* 字体大小 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          字体大小: {textOptions.fontSize}px
        </label>
        <input
          type="range"
          min="10"
          max="200"
          value={textOptions.fontSize}
          onChange={(e) => handleTextOptionChange('fontSize', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 颜色选择 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          颜色
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="color"
            value={textOptions.color}
            onChange={(e) => handleTextOptionChange('color', e.target.value)}
            style={{ width: '50px', height: '35px', cursor: 'pointer' }}
          />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{textOptions.color}</span>
        </div>
      </div>

      {/* 透明度 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          透明度: {Math.round(textOptions.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={textOptions.opacity * 100}
          onChange={(e) => handleTextOptionChange('opacity', parseInt(e.target.value) / 100)}
          style={{ width: '100%' }}
        />
      </div>

      {/* 旋转角度 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          旋转角度: {textOptions.rotation}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={textOptions.rotation}
          onChange={(e) => handleTextOptionChange('rotation', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 位置选择 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          位置
        </label>
        <select
          value={textOptions.position}
          onChange={(e) => handleTextOptionChange('position', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          {positionOptions.map(pos => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>
      </div>

      {/* 重复水印 */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={textOptions.repeat}
            onChange={(e) => handleTextOptionChange('repeat', e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>重复水印（平铺）</span>
        </label>
      </div>

      {/* 间距（仅在重复模式下显示） */}
      {textOptions.repeat && (
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}>
            间距: {textOptions.spacing}px
          </label>
          <input
            type="range"
            min="50"
            max="500"
            value={textOptions.spacing}
            onChange={(e) => handleTextOptionChange('spacing', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );

  const renderImageOptions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* 图片选择 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          水印图片
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={imageOptions.imagePath ? imageOptions.imagePath.split('\\').pop() || imageOptions.imagePath.split('/').pop() : ''}
            placeholder="选择图片文件"
            readOnly
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          />
          <button
            onClick={handleSelectImage}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            浏览
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '5px' }}>
          支持 PNG 和 JPG 格式
        </p>
      </div>

      {/* 图片宽度 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          宽度: {imageOptions.width}px
        </label>
        <input
          type="range"
          min="50"
          max="500"
          value={imageOptions.width}
          onChange={(e) => handleImageOptionChange('width', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 图片高度 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          高度: {imageOptions.height}px
        </label>
        <input
          type="range"
          min="50"
          max="500"
          value={imageOptions.height}
          onChange={(e) => handleImageOptionChange('height', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 透明度 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          透明度: {Math.round(imageOptions.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={imageOptions.opacity * 100}
          onChange={(e) => handleImageOptionChange('opacity', parseInt(e.target.value) / 100)}
          style={{ width: '100%' }}
        />
      </div>

      {/* 旋转角度 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          旋转角度: {imageOptions.rotation}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={imageOptions.rotation}
          onChange={(e) => handleImageOptionChange('rotation', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 位置选择 */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          位置
        </label>
        <select
          value={imageOptions.position}
          onChange={(e) => handleImageOptionChange('position', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          {positionOptions.map(pos => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>
      </div>

      {/* 重复水印 */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={imageOptions.repeat}
            onChange={(e) => handleImageOptionChange('repeat', e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>重复水印（平铺）</span>
        </label>
      </div>

      {/* 间距（仅在重复模式下显示） */}
      {imageOptions.repeat && (
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}>
            间距: {imageOptions.spacing}px
          </label>
          <input
            type="range"
            min="100"
            max="800"
            value={imageOptions.spacing}
            onChange={(e) => handleImageOptionChange('spacing', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      padding: '20px', 
      background: 'var(--bg-primary)', 
      borderRadius: '8px',
      border: '1px solid var(--border-primary)',
      marginTop: '20px'
    }}>
      <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
        水印设置
      </h3>

      {/* 水印类型选择 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          水印类型
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`btn ${watermarkType === 'text' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTypeChange('text')}
            style={{ flex: 1 }}
          >
            文字水印
          </button>
          <button
            className={`btn ${watermarkType === 'image' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTypeChange('image')}
            style={{ flex: 1 }}
          >
            图片水印
          </button>
        </div>
      </div>

      {/* 水印选项 */}
      {watermarkType === 'text' ? renderTextOptions() : renderImageOptions()}

      {/* 预览区域 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        borderRadius: '8px',
        border: '1px dashed var(--border-primary)'
      }}>
        <h4 style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>预览效果</h4>
        <div style={{ 
          position: 'relative',
          width: '100%',
          height: '200px',
          background: 'var(--bg-primary)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {/* 模拟页面 */}
          <div style={{ 
            position: 'absolute', 
            inset: '0',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#cbd5e0',
            fontSize: '0.9rem'
          }}>
            PDF 页面内容
          </div>
          
          {/* 水印预览 */}
          {watermarkType === 'text' ? (
            <div style={{
              position: 'absolute',
              [currentOptions.position.includes('top') ? 'top' : currentOptions.position.includes('bottom') ? 'bottom' : 'top']: 
                currentOptions.position.includes('top') ? '20px' : 
                currentOptions.position.includes('bottom') ? '20px' : '50%',
              [currentOptions.position.includes('left') ? 'left' : currentOptions.position.includes('right') ? 'right' : 'left']: 
                currentOptions.position.includes('left') ? '20px' : 
                currentOptions.position.includes('right') ? '20px' : '50%',
              transform: `translate(${currentOptions.position.includes('center') && !currentOptions.position.includes('-') ? '-50%' : '0'}, ${currentOptions.position.includes('center') && !currentOptions.position.includes('-') ? '-50%' : '0'}) rotate(${currentOptions.rotation}deg)`,
              color: currentOptions.color,
              opacity: currentOptions.opacity,
              fontSize: `${Math.min(currentOptions.fontSize / 5, 40)}px`,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>
              {currentOptions.text}
            </div>
          ) : currentOptions.imagePath ? (
            <div style={{
              position: 'absolute',
              [currentOptions.position.includes('top') ? 'top' : currentOptions.position.includes('bottom') ? 'bottom' : 'top']: 
                currentOptions.position.includes('top') ? '20px' : 
                currentOptions.position.includes('bottom') ? '20px' : '50%',
              [currentOptions.position.includes('left') ? 'left' : currentOptions.position.includes('right') ? 'right' : 'left']: 
                currentOptions.position.includes('left') ? '20px' : 
                currentOptions.position.includes('right') ? '20px' : '50%',
              transform: `translate(${currentOptions.position.includes('center') && !currentOptions.position.includes('-') ? '-50%' : '0'}, ${currentOptions.position.includes('center') && !currentOptions.position.includes('-') ? '-50%' : '0'}) rotate(${currentOptions.rotation}deg)`,
              opacity: currentOptions.opacity,
              width: `${Math.min(currentOptions.width / 3, 100)}px`,
              height: `${Math.min(currentOptions.height / 3, 50)}px`,
              background: 'var(--primary-color)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-primary)',
              fontSize: '0.7rem'
            }}>
              水印图片
            </div>
          ) : (
            <div style={{
              position: 'absolute',
              inset: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a0aec0',
              fontSize: '0.9rem'
            }}>
              请先选择水印图片
            </div>
          )}
        </div>
      </div>

      {/* 应用按钮 */}
      <div style={{ marginTop: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={onApplyWatermark}
          disabled={isProcessing || (watermarkType === 'image' && !imageOptions.imagePath)}
          style={{
            width: '100%',
            opacity: (isProcessing || (watermarkType === 'image' && !imageOptions.imagePath)) ? 0.6 : 1,
            cursor: (isProcessing || (watermarkType === 'image' && !imageOptions.imagePath)) ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? '处理中...' : '应用水印'}
        </button>
      </div>
    </div>
  );
};

export default WatermarkEditor;