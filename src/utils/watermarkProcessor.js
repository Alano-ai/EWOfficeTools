/**
 * 水印处理模块
 * 负责为PDF文件添加文字水印和图片水印
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class WatermarkProcessor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 为PDF文件添加水印
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} watermarkOptions - 水印选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 添加水印后的PDF文件Buffer
   */
  async addWatermark(pdfFilePath, watermarkOptions, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      const totalPages = pages.length;

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: totalPages });
      }

      // 根据水印类型处理
      if (watermarkOptions.type === 'text') {
        await this.addTextWatermark(pdf, pages, watermarkOptions, progressCallback);
      } else if (watermarkOptions.type === 'image') {
        await this.addImageWatermark(pdf, pages, watermarkOptions, progressCallback);
      } else {
        throw new Error(`不支持的水印类型: ${watermarkOptions.type}`);
      }

      // 生成添加水印后的PDF
      const watermarkedPdfBytes = await pdf.save();
      return watermarkedPdfBytes;
    } catch (error) {
      console.error('添加水印错误:', error);
      throw error;
    }
  }

  /**
   * 添加文字水印
   * @param {PDFDocument} pdf - PDF文档对象
   * @param {Array} pages - PDF页面数组
   * @param {Object} options - 水印选项
   * @param {Function} progressCallback - 进度回调
   */
  async addTextWatermark(pdf, pages, options, progressCallback) {
    const {
      text = '水印',
      fontSize = 50,
      fontName = 'Helvetica',
      color = '#000000',
      opacity = 0.3,
      rotation = 45,
      position = 'center',
      repeat = false,
      spacing = 200
    } = options;

    // 加载字体
    let font;
    try {
      font = await pdf.embedFont(StandardFonts[fontName] || StandardFonts.Helvetica);
    } catch (e) {
      console.warn(`字体 ${fontName} 不可用，使用默认字体`);
      font = await pdf.embedFont(StandardFonts.Helvetica);
    }

    // 解析颜色
    const colorRgb = this.hexToRgb(color);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      if (progressCallback) {
        progressCallback({
          percent: ((i + 1) / pages.length) * 100,
          current: i + 1,
          total: pages.length
        });
      }

      if (repeat) {
        // 重复水印模式：在整个页面平铺
        const xCount = Math.ceil(width / spacing) + 1;
        const yCount = Math.ceil(height / spacing) + 1;

        for (let x = 0; x < xCount; x++) {
          for (let y = 0; y < yCount; y++) {
            page.drawText(text, {
              x: x * spacing,
              y: y * spacing,
              size: fontSize,
              font: font,
              color: rgb(colorRgb.r / 255, colorRgb.g / 255, colorRgb.b / 255),
              opacity: opacity,
              rotate: { type: 'degrees', angle: rotation }
            });
          }
        }
      } else {
        // 单个水印模式
        const positionCoords = this.calculatePosition(width, height, fontSize, text, font, position);
        
        page.drawText(text, {
          x: positionCoords.x,
          y: positionCoords.y,
          size: fontSize,
          font: font,
          color: rgb(colorRgb.r / 255, colorRgb.g / 255, colorRgb.b / 255),
          opacity: opacity,
          rotate: { type: 'degrees', angle: rotation }
        });
      }

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * 添加图片水印
   * @param {PDFDocument} pdf - PDF文档对象
   * @param {Array} pages - PDF页面数组
   * @param {Object} options - 水印选项
   * @param {Function} progressCallback - 进度回调
   */
  async addImageWatermark(pdf, pages, options, progressCallback) {
    const {
      imagePath,
      width: watermarkWidth = 200,
      height: watermarkHeight = 100,
      opacity = 0.3,
      position = 'center',
      rotation = 0,
      repeat = false,
      spacing = 300
    } = options;

    if (!imagePath || !fs.existsSync(imagePath)) {
      throw new Error('水印图片路径无效或文件不存在');
    }

    // 读取图片文件
    const imageBytes = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    
    let image;
    try {
      if (ext === '.png') {
        image = await pdf.embedPng(imageBytes);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        image = await pdf.embedJpg(imageBytes);
      } else {
        throw new Error(`不支持的图片格式: ${ext}，仅支持 PNG 和 JPG`);
      }
    } catch (error) {
      throw new Error(`图片嵌入失败: ${error.message}`);
    }

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      if (progressCallback) {
        progressCallback({
          percent: ((i + 1) / pages.length) * 100,
          current: i + 1,
          total: pages.length
        });
      }

      if (repeat) {
        // 重复水印模式
        const xCount = Math.ceil(width / spacing) + 1;
        const yCount = Math.ceil(height / spacing) + 1;

        for (let x = 0; x < xCount; x++) {
          for (let y = 0; y < yCount; y++) {
            page.drawImage(image, {
              x: x * spacing,
              y: y * spacing,
              width: watermarkWidth,
              height: watermarkHeight,
              opacity: opacity,
              rotate: { type: 'degrees', angle: rotation }
            });
          }
        }
      } else {
        // 单个水印模式
        const positionCoords = this.calculateImagePosition(width, height, watermarkWidth, watermarkHeight, position);
        
        page.drawImage(image, {
          x: positionCoords.x,
          y: positionCoords.y,
          width: watermarkWidth,
          height: watermarkHeight,
          opacity: opacity,
          rotate: { type: 'degrees', angle: rotation }
        });
      }

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * 计算文字水印位置
   * @param {number} pageWidth - 页面宽度
   * @param {number} pageHeight - 页面高度
   * @param {number} fontSize - 字体大小
   * @param {string} text - 水印文字
   * @param {PDFFont} font - 字体对象
   * @param {string} position - 位置类型
   * @returns {Object} 坐标 {x, y}
   */
  calculatePosition(pageWidth, pageHeight, fontSize, text, font, position) {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;

    switch (position) {
      case 'top-left':
        return { x: 50, y: pageHeight - textHeight - 50 };
      case 'top-center':
        return { x: (pageWidth - textWidth) / 2, y: pageHeight - textHeight - 50 };
      case 'top-right':
        return { x: pageWidth - textWidth - 50, y: pageHeight - textHeight - 50 };
      case 'center-left':
        return { x: 50, y: (pageHeight - textHeight) / 2 };
      case 'center':
        return { x: (pageWidth - textWidth) / 2, y: (pageHeight - textHeight) / 2 };
      case 'center-right':
        return { x: pageWidth - textWidth - 50, y: (pageHeight - textHeight) / 2 };
      case 'bottom-left':
        return { x: 50, y: 50 };
      case 'bottom-center':
        return { x: (pageWidth - textWidth) / 2, y: 50 };
      case 'bottom-right':
        return { x: pageWidth - textWidth - 50, y: 50 };
      default:
        return { x: (pageWidth - textWidth) / 2, y: (pageHeight - textHeight) / 2 };
    }
  }

  /**
   * 计算图片水印位置
   * @param {number} pageWidth - 页面宽度
   * @param {number} pageHeight - 页面高度
   * @param {number} imageWidth - 图片宽度
   * @param {number} imageHeight - 图片高度
   * @param {string} position - 位置类型
   * @returns {Object} 坐标 {x, y}
   */
  calculateImagePosition(pageWidth, pageHeight, imageWidth, imageHeight, position) {
    switch (position) {
      case 'top-left':
        return { x: 50, y: pageHeight - imageHeight - 50 };
      case 'top-center':
        return { x: (pageWidth - imageWidth) / 2, y: pageHeight - imageHeight - 50 };
      case 'top-right':
        return { x: pageWidth - imageWidth - 50, y: pageHeight - imageHeight - 50 };
      case 'center-left':
        return { x: 50, y: (pageHeight - imageHeight) / 2 };
      case 'center':
        return { x: (pageWidth - imageWidth) / 2, y: (pageHeight - imageHeight) / 2 };
      case 'center-right':
        return { x: pageWidth - imageWidth - 50, y: (pageHeight - imageHeight) / 2 };
      case 'bottom-left':
        return { x: 50, y: 50 };
      case 'bottom-center':
        return { x: (pageWidth - imageWidth) / 2, y: 50 };
      case 'bottom-right':
        return { x: pageWidth - imageWidth - 50, y: 50 };
      default:
        return { x: (pageWidth - imageWidth) / 2, y: (pageHeight - imageHeight) / 2 };
    }
  }

  /**
   * 十六进制颜色转RGB
   * @param {string} hex - 十六进制颜色值
   * @returns {Object} RGB颜色对象
   */
  hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  /**
   * 批量添加水印
   * @param {Array} pdfFiles - PDF文件路径数组
   * @param {Object} watermarkOptions - 水印选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 添加水印后的PDF文件Buffer数组
   */
  async batchAddWatermark(pdfFiles, watermarkOptions, progressCallback) {
    try {
      const results = [];
      const totalFiles = pdfFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const filePath = pdfFiles[i];
        const overallProgress = (i / totalFiles) * 100;

        if (progressCallback) {
          progressCallback({
            percent: overallProgress,
            current: i,
            total: totalFiles,
            fileName: path.basename(filePath)
          });
        }

        const watermarkedPdfBytes = await this.addWatermark(
          filePath,
          watermarkOptions,
          (pageProgress) => {
            // 合并文件级和页面级进度
            const fileProgress = (pageProgress.percent / totalFiles);
            const currentProgress = overallProgress + fileProgress;
            if (progressCallback) {
              progressCallback({
                percent: Math.min(currentProgress, 100),
                current: i + 1,
                total: totalFiles,
                currentPage: pageProgress.current,
                totalPages: pageProgress.total,
                fileName: path.basename(filePath)
              });
            }
          }
        );

        results.push({
          name: `watermarked_${path.basename(filePath)}`,
          buffer: watermarkedPdfBytes,
          originalPath: filePath,
          size: watermarkedPdfBytes.length
        });

        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (progressCallback) {
        progressCallback({ percent: 100, current: totalFiles, total: totalFiles });
      }

      return results;
    } catch (error) {
      console.error('批量添加水印错误:', error);
      throw error;
    }
  }

  /**
   * 获取可用字体列表
   * @returns {Array} 字体列表
   */
  getAvailableFonts() {
    return [
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
  }

  /**
   * 获取可用位置列表
   * @returns {Array} 位置列表
   */
  getAvailablePositions() {
    return [
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
  }

  /**
   * 保存添加水印后的PDF文件
   * @param {Buffer} pdfBuffer - PDF文件Buffer
   * @param {string} originalName - 原始文件名
   * @returns {Object} 保存结果
   */
  saveWatermarkedPdf(pdfBuffer, originalName) {
    const outputFileName = `watermarked_${originalName}`;
    const outputPath = path.join(this.tempDir, outputFileName);
    fs.writeFileSync(outputPath, pdfBuffer);
    
    return {
      name: outputFileName,
      path: outputPath,
      size: pdfBuffer.length
    };
  }

  /**
   * 清理临时文件
   */
  async cleanup() {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          const filePath = path.join(this.tempDir, file);
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }
}

module.exports = WatermarkProcessor;