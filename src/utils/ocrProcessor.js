/**
 * OCR文字识别处理模块
 * 负责从图片和扫描PDF中提取文字
 */

const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

class OCRProcessor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
    this.worker = null;
    this.isInitialized = false;
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 初始化OCR引擎
   * @param {Array} languages - 语言列表 ['chi_sim', 'eng']
   * @param {Function} progressCallback - 进度回调
   */
  async initialize(languages = ['chi_sim', 'eng'], progressCallback) {
    try {
      if (this.isInitialized) {
        return;
      }

      if (progressCallback) {
        progressCallback({ 
          percent: 0, 
          message: '正在初始化OCR引擎...' 
        });
      }

      // 创建Tesseract Worker
      this.worker = await Tesseract.createWorker({
        logger: (info) => {
          if (progressCallback && info.progress) {
            progressCallback({
              percent: Math.round(info.progress * 100),
              message: info.status || '处理中...'
            });
          }
        }
      });

      if (progressCallback) {
        progressCallback({ 
          percent: 30, 
          message: '正在加载语言包...' 
        });
      }

      // 加载语言包
      await this.worker.loadLanguage(languages.join('+'));
      
      if (progressCallback) {
        progressCallback({ 
          percent: 60, 
          message: '正在初始化语言...' 
        });
      }

      // 初始化语言
      await this.worker.initialize(languages.join('+'));

      if (progressCallback) {
        progressCallback({ 
          percent: 100, 
          message: 'OCR引擎初始化完成' 
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('OCR初始化错误:', error);
      throw new Error(`OCR初始化失败: ${error.message}`);
    }
  }

  /**
   * 识别图片中的文字
   * @param {string} imagePath - 图片文件路径
   * @param {Object} options - 识别选项
   * @param {Array} options.languages - 语言列表
   * @param {string} options.outputFormat - 输出格式 ('text', 'json', 'hocr')
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeImage(imagePath, options = {}, progressCallback) {
    try {
      const { 
        languages = ['chi_sim', 'eng'],
        outputFormat = 'text'
      } = options;

      // 确保OCR引擎已初始化
      await this.initialize(languages, progressCallback);

      if (progressCallback) {
        progressCallback({ 
          percent: 0, 
          message: '正在读取图片...' 
        });
      }

      // 检查文件是否存在
      if (!fs.existsSync(imagePath)) {
        throw new Error(`图片文件不存在: ${imagePath}`);
      }

      // 读取图片文件
      const imageBuffer = fs.readFileSync(imagePath);
      
      if (progressCallback) {
        progressCallback({ 
          percent: 10, 
          message: '正在识别文字...' 
        });
      }

      // 进行OCR识别
      const result = await this.worker.recognize(imageBuffer);
      
      if (progressCallback) {
        progressCallback({ 
          percent: 90, 
          message: '正在处理识别结果...' 
        });
      }

      // 处理识别结果
      const processedResult = this.processResult(result, outputFormat);
      
      if (progressCallback) {
        progressCallback({ 
          percent: 100, 
          message: '识别完成' 
        });
      }

      return processedResult;
    } catch (error) {
      console.error('图片OCR识别错误:', error);
      throw new Error(`识别失败: ${error.message}`);
    }
  }

  /**
   * 识别PDF文件中的文字
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} options - 识别选项
   * @param {Array} options.languages - 语言列表
   * @param {number} options.pageRange.start - 起始页码
   * @param {number} options.pageRange.end - 结束页码
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 识别结果
   */
  async recognizePDF(pdfFilePath, options = {}, progressCallback) {
    try {
      const { 
        languages = ['chi_sim', 'eng'],
        pageRange = { start: 1, end: 1 }
      } = options;

      // 确保OCR引擎已初始化
      await this.initialize(languages, progressCallback);

      if (progressCallback) {
        progressCallback({ 
          percent: 0, 
          message: '正在读取PDF文件...' 
        });
      }

      // 检查文件是否存在
      if (!fs.existsSync(pdfFilePath)) {
        throw new Error(`PDF文件不存在: ${pdfFilePath}`);
      }

      // 读取PDF文件
      const pdfBuffer = fs.readFileSync(pdfFilePath);
      
      if (progressCallback) {
        progressCallback({ 
          percent: 10, 
          message: '正在解析PDF文件...' 
        });
      }

      // 使用pdfjs-dist解析PDF
      const pdfjsLib = require('pdfjs-dist');
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const totalPages = pdfDoc.numPages;
      
      // 确定页码范围
      const startPage = Math.max(1, pageRange.start);
      const endPage = Math.min(totalPages, pageRange.end);
      
      const results = [];
      
      // 逐页识别
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const pageProgress = ((pageNum - startPage) / (endPage - startPage + 1)) * 100;
        
        if (progressCallback) {
          progressCallback({ 
            percent: Math.round(pageProgress), 
            message: `正在识别第 ${pageNum} 页...` 
          });
        }

        // 获取页面
        const page = await pdfDoc.getPage(pageNum);
        
        // 获取页面内容
        const content = await page.getTextContent();
        
        // 如果页面有文本内容，直接提取
        if (content.items.length > 0) {
          const text = content.items.map(item => item.str).join(' ');
          results.push({
            page: pageNum,
            text: text,
            confidence: 100,
            hasText: true
          });
        } else {
          // 如果页面没有文本内容（扫描件），进行OCR识别
          // 将PDF页面渲染为图片
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          
          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;
          
          // 将canvas转换为图片数据
          const imageData = canvas.toDataURL('image/png');
          
          // 进行OCR识别
          const ocrResult = await this.worker.recognize(imageData);
          
          results.push({
            page: pageNum,
            text: ocrResult.data.text,
            confidence: ocrResult.data.confidence,
            hasText: false
          });
        }
      }
      
      if (progressCallback) {
        progressCallback({ 
          percent: 100, 
          message: 'PDF识别完成' 
        });
      }

      // 合并结果
      const combinedResult = {
        text: results.map(r => `--- 第 ${r.page} 页 ---\n${r.text}`).join('\n\n'),
        pages: results,
        totalPages: endPage - startPage + 1,
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      };
      
      return combinedResult;
    } catch (error) {
      console.error('PDF OCR识别错误:', error);
      throw new Error(`PDF识别失败: ${error.message}`);
    }
  }

  /**
   * 识别图片文件中的文字（支持多种图片格式）
   * @param {string} filePath - 文件路径
   * @param {Object} options - 识别选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeFile(filePath, options = {}, progressCallback) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      // 支持的图片格式
      const imageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'];
      
      if (imageFormats.includes(ext)) {
        // 图片文件
        return await this.recognizeImage(filePath, options, progressCallback);
      } else if (ext === '.pdf') {
        // PDF文件
        return await this.recognizePDF(filePath, options, progressCallback);
      } else {
        throw new Error(`不支持的文件格式: ${ext}`);
      }
    } catch (error) {
      console.error('文件OCR识别错误:', error);
      throw new Error(`识别失败: ${error.message}`);
    }
  }

  /**
   * 批量识别多个文件
   * @param {Array} filePaths - 文件路径数组
   * @param {Object} options - 识别选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 识别结果数组
   */
  async batchRecognize(filePaths, options = {}, progressCallback) {
    try {
      const results = [];
      
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        const fileProgress = ((i) / filePaths.length) * 100;
        
        if (progressCallback) {
          progressCallback({ 
            percent: Math.round(fileProgress), 
            message: `正在处理第 ${i + 1} 个文件...` 
          });
        }

        try {
          const result = await this.recognizeFile(filePath, options, (fileProgressCallback) => {
            // 合并进度
            const overallProgress = fileProgress + (fileProgressCallback.percent / filePaths.length);
            if (progressCallback) {
              progressCallback({
                percent: Math.round(overallProgress),
                message: fileProgressCallback.message
              });
            }
          });
          
          results.push({
            file: path.basename(filePath),
            path: filePath,
            success: true,
            result: result
          });
        } catch (error) {
          results.push({
            file: path.basename(filePath),
            path: filePath,
            success: false,
            error: error.message
          });
        }
      }
      
      if (progressCallback) {
        progressCallback({ 
          percent: 100, 
          message: '批量识别完成' 
        });
      }

      return results;
    } catch (error) {
      console.error('批量OCR识别错误:', error);
      throw new Error(`批量识别失败: ${error.message}`);
    }
  }

  /**
   * 处理OCR识别结果
   * @param {Object} result - Tesseract识别结果
   * @param {string} outputFormat - 输出格式
   * @returns {Object} 处理后的结果
   */
  processResult(result, outputFormat = 'text') {
    const data = result.data;
    
    switch (outputFormat) {
      case 'json':
        return {
          text: data.text,
          confidence: data.confidence,
          words: data.words?.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          })) || [],
          lines: data.lines?.map(line => ({
            text: line.text,
            confidence: line.confidence,
            bbox: line.bbox
          })) || [],
          paragraphs: data.paragraphs?.map(para => ({
            text: para.text,
            confidence: para.confidence,
            bbox: para.bbox
          })) || []
        };
      
      case 'hocr':
        return {
          text: data.text,
          confidence: data.confidence,
          hocr: data.hocr || ''
        };
      
      case 'text':
      default:
        return {
          text: data.text,
          confidence: data.confidence,
          words: data.words?.length || 0,
          lines: data.lines?.length || 0,
          paragraphs: data.paragraphs?.length || 0
        };
    }
  }

  /**
   * 获取支持的语言列表
   * @returns {Array} 支持的语言列表
   */
  getSupportedLanguages() {
    return [
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
  }

  /**
   * 检查文件是否支持OCR识别
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否支持
   */
  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp',
      '.pdf'
    ];
    return supportedFormats.includes(ext);
  }

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   * @returns {Object} 文件信息
   */
  getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        extension: ext,
        isSupported: this.isSupported(filePath),
        isImage: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'].includes(ext),
        isPDF: ext === '.pdf'
      };
    } catch (error) {
      console.error('获取文件信息错误:', error);
      return null;
    }
  }

  /**
   * 终止OCR引擎
   */
  async terminate() {
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('终止OCR引擎错误:', error);
    }
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

module.exports = OCRProcessor;