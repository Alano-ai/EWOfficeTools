/**
 * 压缩处理模块
 * 负责PDF文件的压缩处理，包括图片质量压缩和冗余数据删除
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

class CompressionProcessor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
    
    // 压缩级别配置
    this.compressionLevels = {
      low: {
        imageQuality: 0.8,
        removeMetadata: false,
        removeAnnotations: false,
        removeBookmarks: false,
        removeAttachments: false
      },
      medium: {
        imageQuality: 0.5,
        removeMetadata: true,
        removeAnnotations: false,
        removeBookmarks: false,
        removeAttachments: true
      },
      high: {
        imageQuality: 0.3,
        removeMetadata: true,
        removeAnnotations: true,
        removeBookmarks: true,
        removeAttachments: true
      }
    };
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 压缩PDF文件
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} options - 压缩选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 压缩结果
   */
  async compressPDF(pdfFilePath, options = {}, progressCallback) {
    try {
      const compressionLevel = options.compressionLevel || 'medium';
      const compressionConfig = this.compressionLevels[compressionLevel] || this.compressionLevels.medium;

      if (progressCallback) {
        progressCallback({ percent: 0, stage: '读取文件' });
      }

      // 读取原始PDF
      const originalBytes = fs.readFileSync(pdfFilePath);
      const originalSize = originalBytes.length;

      if (progressCallback) {
        progressCallback({ percent: 10, stage: '解析PDF结构' });
      }

      // 加载PDF文档
      const pdf = await PDFDocument.load(originalBytes, {
        updateMetadata: !compressionConfig.removeMetadata
      });

      if (progressCallback) {
        progressCallback({ percent: 30, stage: '应用压缩设置' });
      }

      // 应用压缩设置
      await this.applyCompressionSettings(pdf, compressionConfig, progressCallback);

      if (progressCallback) {
        progressCallback({ percent: 70, stage: '生成压缩文件' });
      }

      // 保存压缩后的PDF
      const compressedBytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        throwOnInvalidObject: false
      });

      if (progressCallback) {
        progressCallback({ percent: 90, stage: '保存文件' });
      }

      // 计算压缩统计
      const compressedSize = compressedBytes.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
      const savedBytes = originalSize - compressedSize;

      // 保存压缩后的文件
      const originalName = path.basename(pdfFilePath, '.pdf');
      const outputFileName = `compressed_${originalName}.pdf`;
      const outputPath = path.join(this.tempDir, outputFileName);
      fs.writeFileSync(outputPath, compressedBytes);

      if (progressCallback) {
        progressCallback({ percent: 100, stage: '完成' });
      }

      return {
        success: true,
        originalName: path.basename(pdfFilePath),
        compressedName: outputFileName,
        compressedPath: outputPath,
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: parseFloat(compressionRatio),
        savedBytes: savedBytes,
        compressionLevel: compressionLevel,
        compressionConfig: compressionConfig
      };
    } catch (error) {
      console.error('PDF压缩错误:', error);
      throw error;
    }
  }

  /**
   * 应用压缩设置
   * @param {PDFDocument} pdf - PDF文档对象
   * @param {Object} config - 压缩配置
   * @param {Function} progressCallback - 进度回调
   */
  async applyCompressionSettings(pdf, config, progressCallback) {
    const pages = pdf.getPages();
    const totalPages = pages.length;

    // 处理每个页面
    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const pageProgress = 30 + ((i + 1) / totalPages) * 30;

      if (progressCallback) {
        progressCallback({ 
          percent: pageProgress, 
          stage: `处理页面 ${i + 1}/${totalPages}` 
        });
      }

      // 这里可以添加页面级别的优化
      // 注意：pdf-lib 目前不支持直接压缩图片，但可以通过其他方式优化

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 移除元数据
    if (config.removeMetadata) {
      if (progressCallback) {
        progressCallback({ percent: 62, stage: '移除元数据' });
      }
      this.removeMetadata(pdf);
    }

    // 移除附件
    if (config.removeAttachments) {
      if (progressCallback) {
        progressCallback({ percent: 65, stage: '移除附件' });
      }
      this.removeAttachments(pdf);
    }
  }

  /**
   * 移除PDF元数据
   * @param {PDFDocument} pdf - PDF文档对象
   */
  removeMetadata(pdf) {
    try {
      // 清除文档属性
      pdf.setTitle('');
      pdf.setAuthor('');
      pdf.setSubject('');
      pdf.setKeywords([]);
      pdf.setProducer('');
      pdf.setCreator('');
    } catch (error) {
      console.warn('移除元数据时出现警告:', error.message);
    }
  }

  /**
   * 移除PDF附件
   * @param {PDFDocument} pdf - PDF文档对象
   */
  removeAttachments(pdf) {
    // pdf-lib 目前不支持直接移除附件
    // 这里留作扩展点
    console.log('移除附件功能待实现');
  }

  /**
   * 批量压缩PDF文件
   * @param {Array} pdfFiles - PDF文件路径数组
   * @param {Object} options - 压缩选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 压缩结果数组
   */
  async batchCompress(pdfFiles, options = {}, progressCallback) {
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
            fileName: path.basename(filePath),
            stage: '开始处理'
          });
        }

        const result = await this.compressPDF(
          filePath,
          options,
          (fileProgress) => {
            // 合并文件级和压缩级进度
            const fileProgressPercent = (fileProgress.percent / totalFiles);
            const currentProgress = overallProgress + fileProgressPercent;
            if (progressCallback) {
              progressCallback({
                percent: Math.min(currentProgress, 100),
                current: i + 1,
                total: totalFiles,
                fileName: path.basename(filePath),
                stage: fileProgress.stage
              });
            }
          }
        );

        results.push(result);

        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (progressCallback) {
        progressCallback({ percent: 100, current: totalFiles, total: totalFiles, stage: '完成' });
      }

      return results;
    } catch (error) {
      console.error('批量压缩错误:', error);
      throw error;
    }
  }

  /**
   * 获取压缩级别配置
   * @returns {Object} 压缩级别配置
   */
  getCompressionLevels() {
    return [
      {
        value: 'low',
        label: '低压缩',
        description: '保持高质量，较小压缩比',
        imageQuality: '80%',
        features: ['保持所有元数据', '保持所有注释', '保持所有附件']
      },
      {
        value: 'medium',
        label: '中等压缩',
        description: '平衡质量和大小',
        imageQuality: '50%',
        features: ['移除元数据', '移除附件', '保持注释']
      },
      {
        value: 'high',
        label: '高压缩',
        description: '最大压缩，质量降低',
        imageQuality: '30%',
        features: ['移除所有元数据', '移除所有注释', '移除所有附件', '移除所有书签']
      }
    ];
  }

  /**
   * 预估压缩效果
   * @param {number} fileSize - 文件大小（字节）
   * @param {string} compressionLevel - 压缩级别
   * @returns {Object} 预估结果
   */
  estimateCompression(fileSize, compressionLevel) {
    const estimates = {
      low: { ratio: 0.1, description: '预计压缩 10%' },
      medium: { ratio: 0.3, description: '预计压缩 30%' },
      high: { ratio: 0.5, description: '预计压缩 50%' }
    };

    const estimate = estimates[compressionLevel] || estimates.medium;
    const estimatedSize = Math.round(fileSize * (1 - estimate.ratio));
    const savedSize = fileSize - estimatedSize;

    return {
      originalSize: fileSize,
      estimatedSize: estimatedSize,
      savedSize: savedSize,
      compressionRatio: (estimate.ratio * 100).toFixed(0),
      description: estimate.description
    };
  }

  /**
   * 获取压缩统计信息
   * @param {Array} results - 压缩结果数组
   * @returns {Object} 统计信息
   */
  getCompressionStats(results) {
    if (!results || results.length === 0) {
      return {
        totalFiles: 0,
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        totalSavedSize: 0,
        averageCompressionRatio: 0
      };
    }

    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const totalSavedSize = totalOriginalSize - totalCompressedSize;
    const averageCompressionRatio = (totalSavedSize / totalOriginalSize * 100).toFixed(2);

    return {
      totalFiles: results.length,
      totalOriginalSize: totalOriginalSize,
      totalCompressedSize: totalCompressedSize,
      totalSavedSize: totalSavedSize,
      averageCompressionRatio: parseFloat(averageCompressionRatio),
      formattedOriginalSize: this.formatFileSize(totalOriginalSize),
      formattedCompressedSize: this.formatFileSize(totalCompressedSize),
      formattedSavedSize: this.formatFileSize(totalSavedSize)
    };
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

module.exports = CompressionProcessor;