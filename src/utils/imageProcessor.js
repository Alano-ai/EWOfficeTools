/**
 * 图片处理模块
 * 负责将图片合并为PDF文件
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

class ImageProcessor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
    
    // 支持的图片格式
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'];
    
    // 默认页面尺寸（单位：点，1点=1/72英寸）
    this.pageSizes = {
      'a4': { width: 595.28, height: 841.89 },
      'letter': { width: 612, height: 792 },
      'legal': { width: 612, height: 1008 },
      'a3': { width: 841.89, height: 1190.55 },
      'a5': { width: 419.53, height: 595.28 }
    };
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 检查文件是否为支持的图片格式
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否支持
   */
  isSupportedImage(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    return this.supportedFormats.includes(ext);
  }

  /**
   * 获取图片格式
   * @param {string} filePath - 文件路径
   * @returns {string} 图片格式
   */
  getImageFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    return ext;
  }

  /**
   * 将多个图片合并为PDF
   * @param {Array} imageFiles - 图片文件路径数组
   * @param {Object} options - 合并选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 合并后的PDF文件Buffer
   */
  async mergeImagesToPDF(imageFiles, options = {}, progressCallback) {
    try {
      // 验证图片文件
      const validImages = imageFiles.filter(file => this.isSupportedImage(file));
      
      if (validImages.length === 0) {
        throw new Error('没有找到支持的图片文件');
      }

      // 创建PDF文档
      const pdfDoc = await PDFDocument.create();
      
      // 设置页面尺寸和边距
      const pageSize = options.pageSize || 'a4';
      const orientation = options.orientation || 'portrait';
      const marginTop = options.marginTop || 25;
      const marginBottom = options.marginBottom || 25;
      const marginLeft = options.marginLeft || 25;
      const marginRight = options.marginRight || 25;
      
      // 计算目标页面尺寸
      const targetSize = this.pageSizes[pageSize] || this.pageSizes['a4'];
      const targetWidth = orientation === 'portrait' ? targetSize.width : targetSize.height;
      const targetHeight = orientation === 'portrait' ? targetSize.height : targetSize.width;
      
      // 计算可用内容区域
      const contentWidth = targetWidth - marginLeft - marginRight;
      const contentHeight = targetHeight - marginTop - marginBottom;

      // 处理每张图片
      for (let i = 0; i < validImages.length; i++) {
        const imagePath = validImages[i];
        const progress = ((i + 1) / validImages.length) * 100;
        
        if (progressCallback) {
          progressCallback({ 
            percent: progress, 
            current: i + 1, 
            total: validImages.length,
            currentFile: path.basename(imagePath)
          });
        }

        // 读取图片文件
        const imageBytes = fs.readFileSync(imagePath);
        const imageFormat = this.getImageFormat(imagePath);
        
        // 根据图片格式嵌入图片
        let image;
        if (imageFormat === 'png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (['jpg', 'jpeg'].includes(imageFormat)) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          // 对于其他格式，尝试作为PNG处理（可能需要转换）
          // 这里简化处理，实际项目中可能需要使用sharp等库进行格式转换
          try {
            image = await pdfDoc.embedPng(imageBytes);
          } catch (error) {
            console.warn(`无法处理图片格式 ${imageFormat}: ${imagePath}`);
            continue;
          }
        }

        // 获取图片尺寸
        const imageSize = image.size();
        
        // 计算缩放比例，保持宽高比
        const scaleX = contentWidth / imageSize.width;
        const scaleY = contentHeight / imageSize.height;
        const scale = Math.min(scaleX, scaleY);
        
        // 计算缩放后的图片尺寸
        const scaledWidth = imageSize.width * scale;
        const scaledHeight = imageSize.height * scale;
        
        // 计算居中位置
        const x = marginLeft + (contentWidth - scaledWidth) / 2;
        const y = marginBottom + (contentHeight - scaledHeight) / 2;

        // 添加页面
        const page = pdfDoc.addPage([targetWidth, targetHeight]);
        
        // 绘制图片
        page.drawImage(image, {
          x: x,
          y: y,
          width: scaledWidth,
          height: scaledHeight
        });

        // 模拟处理时间（实际处理中可能不需要）
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 生成PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('图片合并为PDF错误:', error);
      throw error;
    }
  }

  /**
   * 将图片转换为PDF并保存到文件
   * @param {Array} imageFiles - 图片文件路径数组
   * @param {string} outputPath - 输出文件路径
   * @param {Object} options - 合并选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 处理结果
   */
  async convertImagesToPDFFile(imageFiles, outputPath, options = {}, progressCallback) {
    try {
      const pdfBytes = await this.mergeImagesToPDF(imageFiles, options, progressCallback);
      
      // 保存文件
      fs.writeFileSync(outputPath, pdfBytes);
      
      return {
        success: true,
        outputPath: outputPath,
        size: pdfBytes.length,
        imageCount: imageFiles.length,
        pageSize: options.pageSize || 'a4',
        orientation: options.orientation || 'portrait'
      };
    } catch (error) {
      console.error('图片转换为PDF文件错误:', error);
      throw error;
    }
  }

  /**
   * 获取图片信息
   * @param {string} imagePath - 图片文件路径
   * @returns {Promise<Object>} 图片信息
   */
  async getImageInfo(imagePath) {
    try {
      if (!this.isSupportedImage(imagePath)) {
        throw new Error(`不支持的图片格式: ${path.extname(imagePath)}`);
      }

      const stats = fs.statSync(imagePath);
      const format = this.getImageFormat(imagePath);
      
      // 注意：这里无法获取图片的实际尺寸，因为pdf-lib在嵌入时才能获取
      // 在实际应用中，可能需要使用sharp或其他图像处理库来获取尺寸
      
      return {
        path: imagePath,
        name: path.basename(imagePath),
        format: format,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error('获取图片信息错误:', error);
      throw error;
    }
  }

  /**
   * 批量获取图片信息
   * @param {Array} imageFiles - 图片文件路径数组
   * @returns {Promise<Array>} 图片信息数组
   */
  async getBatchImageInfo(imageFiles) {
    const results = [];
    
    for (const imagePath of imageFiles) {
      try {
        const info = await this.getImageInfo(imagePath);
        results.push(info);
      } catch (error) {
        results.push({
          path: imagePath,
          name: path.basename(imagePath),
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 清理临时文件
   */
  async cleanup() {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          if (file.endsWith('.pdf') && file.startsWith('merged_images_')) {
            const filePath = path.join(this.tempDir, file);
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }
}

module.exports = ImageProcessor;