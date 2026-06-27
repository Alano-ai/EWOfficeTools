/**
 * 文件处理服务
 * 负责处理各种文档格式的合并、拆分、转换和调整操作
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const PptxGenJS = require('pptxgenjs');
const PDFProcessor = require('./pdfProcessor');
const WordProcessor = require('./wordProcessor');
const ExcelProcessor = require('./excelProcessor');
const PPTProcessor = require('./pptProcessor');
const WatermarkProcessor = require('./watermarkProcessor');
const CompressionProcessor = require('./compressionProcessor');
const ImageProcessor = require('./imageProcessor');
const SecurityProcessor = require('./securityProcessor');
const OCRProcessor = require('./ocrProcessor');

class FileProcessor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
    this.pdfProcessor = new PDFProcessor();
    this.wordProcessor = new WordProcessor();
    this.excelProcessor = new ExcelProcessor();
    this.pptProcessor = new PPTProcessor();
    this.imageProcessor = new ImageProcessor();
    this.securityProcessor = new SecurityProcessor();
    this.ocrProcessor = new OCRProcessor();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 处理文件操作
   * @param {string} operation - 操作类型
   * @param {Array} files - 文件列表
   * @param {Object} options - 操作选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 处理结果
   */
  async processFiles(operation, files, options, progressCallback) {
    try {
      switch (operation) {
        case 'merge':
          return await this.mergeFiles(files, options, progressCallback);
        case 'split':
          return await this.splitFiles(files, options, progressCallback);
        case 'convert':
          return await this.convertFiles(files, options, progressCallback);
        case 'adjust':
          return await this.adjustFiles(files, options, progressCallback);
        case 'watermark':
          return await this.addWatermark(files, options, progressCallback);
        case 'compress':
          return await this.compressFiles(files, options, progressCallback);
        case 'encrypt':
          return await this.encryptFiles(files, options, progressCallback);
        case 'decrypt':
          return await this.decryptFiles(files, options, progressCallback);
        case 'permissions':
          return await this.changePermissions(files, options, progressCallback);
        case 'ocr':
          return await this.ocrFiles(files, options, progressCallback);
        default:
          throw new Error(`不支持的操作类型: ${operation}`);
      }
    } catch (error) {
      console.error('文件处理错误:', error);
      throw error;
    }
  }

  /**
   * 合并文件
   */
  async mergeFiles(files, options, progressCallback) {
    try {
      // 检查文件类型，如果是PDF文件则使用PDF处理器
      const pdfFiles = files.filter(file => file.type === 'pdf');
      const otherFiles = files.filter(file => file.type !== 'pdf');
      
      const results = [];
      
      // 处理PDF文件合并
      if (pdfFiles.length > 0) {
        const pdfPaths = pdfFiles.map(file => file.path);
        const mergedPdfBuffer = await this.pdfProcessor.mergePDFs(pdfPaths, options, progressCallback);
        
        // 保存合并后的PDF
        const outputPath = path.join(this.tempDir, 'merged_document.pdf');
        fs.writeFileSync(outputPath, mergedPdfBuffer);
        
        results.push({
          id: 0,
          name: 'merged_document.pdf',
          path: outputPath,
          size: mergedPdfBuffer.length,
          type: 'pdf'
        });
      }
      
      // 处理Word文档合并
      const wordFiles = otherFiles.filter(file => file.type === 'docx' || file.type === 'doc');
      if (wordFiles.length > 0) {
        const wordPaths = wordFiles.map(file => file.path);
        const mergedWordBuffer = await this.wordProcessor.mergeWordDocs(wordPaths, options, (wordProgress) => {
          const overallProgress = 50 + (wordProgress.percent / 2);
          if (progressCallback) {
            progressCallback({ percent: overallProgress });
          }
        });
        
        // 保存合并后的Word文档
        const outputPath = path.join(this.tempDir, 'merged_document.docx');
        fs.writeFileSync(outputPath, mergedWordBuffer);
        
        results.push({
          id: results.length,
          name: 'merged_document.docx',
          path: outputPath,
          size: mergedWordBuffer.length,
          type: 'docx'
        });
      }
      
      // 处理Excel文件合并
      const excelFiles = otherFiles.filter(file => file.type === 'xlsx' || file.type === 'xls');
      if (excelFiles.length > 0) {
        const excelPaths = excelFiles.map(file => file.path);
        const mergedExcelBuffer = await this.excelProcessor.mergeExcelFiles(excelPaths, options, (excelProgress) => {
          const overallProgress = 75 + (excelProgress.percent / 4);
          if (progressCallback) {
            progressCallback({ percent: overallProgress });
          }
        });
        
        // 保存合并后的Excel文件
        const outputPath = path.join(this.tempDir, 'merged_document.xlsx');
        fs.writeFileSync(outputPath, mergedExcelBuffer);
        
        results.push({
          id: results.length,
          name: 'merged_document.xlsx',
          path: outputPath,
          size: mergedExcelBuffer.length,
          type: 'xlsx'
        });
      }
      
      // 处理PPT文件合并
      const pptFiles = otherFiles.filter(file => file.type === 'pptx' || file.type === 'ppt');
      if (pptFiles.length > 0) {
        const pptPaths = pptFiles.map(file => file.path);
        const mergedPptBuffer = await this.pptProcessor.mergePPTFiles(pptPaths, options, (pptProgress) => {
          const overallProgress = 85 + (pptProgress.percent / 6);
          if (progressCallback) {
            progressCallback({ percent: overallProgress });
          }
        });
        
        // 保存合并后的PPT文件
        const outputPath = path.join(this.tempDir, 'merged_presentation.pptx');
        fs.writeFileSync(outputPath, mergedPptBuffer);
        
        results.push({
          id: results.length,
          name: 'merged_presentation.pptx',
          path: outputPath,
          size: mergedPptBuffer.length,
          type: 'pptx'
        });
      }
      
      // 处理图片文件
      const imageFiles = otherFiles.filter(file => 
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'].includes(file.type)
      );
      if (imageFiles.length > 0) {
        const imagePaths = imageFiles.map(file => file.path);
        const outputPath = path.join(this.tempDir, 'merged_images.pdf');
        
        const result = await this.imageProcessor.convertImagesToPDFFile(imagePaths, outputPath, options, (imageProgress) => {
          const overallProgress = 85 + (imageProgress.percent / 6);
          if (progressCallback) {
            progressCallback({ percent: overallProgress });
          }
        });
        
        results.push({
          id: results.length,
          name: 'merged_images.pdf',
          path: result.outputPath,
          size: result.size,
          type: 'pdf',
          imageCount: result.imageCount
        });
      }
      
      // 处理其他类型文件（模拟处理）
      const remainingFiles = otherFiles.filter(file => 
        file.type !== 'docx' && file.type !== 'doc' && 
        file.type !== 'xlsx' && file.type !== 'xls' && 
        file.type !== 'pptx' && file.type !== 'ppt' &&
        !['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'].includes(file.type)
      );
      for (let i = 0; i < remainingFiles.length; i++) {
        const file = remainingFiles[i];
        const progress = ((i + 1) / remainingFiles.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: remainingFiles.length });
        }
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 500));
        
        results.push({
          id: results.length,
          name: `merged_${file.name}`,
          path: file.path,
          size: file.size,
          type: file.type
        });
      }
      
      return results;
    } catch (error) {
      console.error('文件合并错误:', error);
      throw error;
    }
  }

  /**
   * 拆分文件
   */
  async splitFiles(files, options, progressCallback) {
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: files.length });
        }
        
        if (file.type === 'pdf') {
          // 使用PDF处理器拆分PDF文件
          const splitResults = await this.pdfProcessor.splitPDF(file.path, options, (splitProgress) => {
            // 合并进度
            const overallProgress = (i / files.length * 100) + (splitProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push(...splitResults.map((result, index) => ({
            id: results.length + index,
            name: result.name,
            path: result.path,
            size: result.size,
            type: 'pdf',
            pages: result.pages,
            startPage: result.startPage,
            endPage: result.endPage
          })));
        } else if (file.type === 'docx' || file.type === 'doc') {
          // 使用Word处理器拆分Word文档
          const splitResults = await this.wordProcessor.splitWordDoc(file.path, options, (splitProgress) => {
            const overallProgress = (i / files.length * 100) + (splitProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push(...splitResults.map((result, index) => ({
            id: results.length + index,
            name: result.name,
            path: result.path,
            size: result.size,
            type: 'docx',
            paragraphs: result.paragraphs,
            startParagraph: result.startParagraph,
            endParagraph: result.endParagraph
          })));
        } else if (file.type === 'xlsx' || file.type === 'xls') {
          // 使用Excel处理器拆分Excel文件
          const splitResults = await this.excelProcessor.splitExcelFile(file.path, options, (splitProgress) => {
            const overallProgress = (i / files.length * 100) + (splitProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push(...splitResults.map((result, index) => ({
            id: results.length + index,
            name: result.name,
            path: result.path,
            size: result.size,
            type: 'xlsx',
            sheetName: result.sheetName,
            rows: result.rows,
            startRow: result.startRow,
            endRow: result.endRow
          })));
        } else if (file.type === 'pptx' || file.type === 'ppt') {
          // 使用PPT处理器拆分PPT文件
          const splitResults = await this.pptProcessor.splitPPTFile(file.path, options, (splitProgress) => {
            const overallProgress = (i / files.length * 100) + (splitProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push(...splitResults.map((result, index) => ({
            id: results.length + index,
            name: result.name,
            path: result.path,
            size: result.size,
            type: 'pptx',
            slides: result.slides,
            startSlide: result.startSlide,
            endSlide: result.endSlide
          })));
        } else {
          // 模拟其他类型文件的拆分
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const splitCount = options.splitMethod === 'byPage' ? 
            Math.ceil(10 / (options.pagesPerFile || 1)) : 2;
          
          for (let j = 0; j < splitCount; j++) {
            results.push({
              id: results.length,
              name: `split_${j + 1}_${file.name}`,
              path: file.path,
              size: file.size / splitCount,
              type: file.type
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('文件拆分错误:', error);
      throw error;
    }
  }

  /**
   * 转换文件格式
   */
  async convertFiles(files, options, progressCallback) {
    try {
      const results = [];
      const targetFormat = options.targetFormat || 'pdf';
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: files.length });
        }
        
        if (file.type === 'pdf' && targetFormat !== 'pdf') {
          // 将PDF转换为其他格式
          const conversionResult = await this.pdfProcessor.convertPDF(file.path, targetFormat, options, (convertProgress) => {
            const overallProgress = (i / files.length * 100) + (convertProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push({
            id: results.length,
            name: conversionResult.name,
            path: conversionResult.path,
            size: conversionResult.size,
            type: conversionResult.format,
            pages: conversionResult.pages
          });
        } else if (file.type === 'docx' || file.type === 'doc') {
          // 使用Word处理器转换Word文档
          const conversionResult = await this.wordProcessor.convertWordDoc(file.path, targetFormat, options, (convertProgress) => {
            const overallProgress = (i / files.length * 100) + (convertProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push({
            id: results.length,
            name: conversionResult.name,
            path: conversionResult.path,
            size: conversionResult.size,
            type: conversionResult.format,
            paragraphs: conversionResult.paragraphs
          });
        } else if (file.type === 'xlsx' || file.type === 'xls') {
          // 使用Excel处理器转换Excel文件
          const conversionResult = await this.excelProcessor.convertExcelFile(file.path, targetFormat, options, (convertProgress) => {
            const overallProgress = (i / files.length * 100) + (convertProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push({
            id: results.length,
            name: conversionResult.name,
            path: conversionResult.path,
            size: conversionResult.size,
            type: conversionResult.format,
            worksheets: conversionResult.worksheets,
            rows: conversionResult.rows
          });
        } else if (file.type === 'pptx' || file.type === 'ppt') {
          // 使用PPT处理器转换PPT文件
          const conversionResult = await this.pptProcessor.convertPPTFile(file.path, targetFormat, options, (convertProgress) => {
            const overallProgress = (i / files.length * 100) + (convertProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          results.push({
            id: results.length,
            name: conversionResult.name,
            path: conversionResult.path,
            size: conversionResult.size,
            type: conversionResult.format,
            slides: conversionResult.slides
          });
        } else if (file.type !== 'pdf' && targetFormat === 'pdf') {
          // 将其他格式转换为PDF（模拟）
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newName = file.name.replace(/\.[^/.]+$/, '.pdf');
          results.push({
            id: results.length,
            name: newName,
            path: file.path,
            size: file.size,
            type: 'pdf'
          });
        } else {
          // 相同格式或不支持的转换
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const newName = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
          results.push({
            id: results.length,
            name: newName,
            path: file.path,
            size: file.size,
            type: targetFormat
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('文件转换错误:', error);
      throw error;
    }
  }

  /**
   * 调整页面
   */
  async adjustFiles(files, options, progressCallback) {
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: files.length });
        }
        
        if (file.type === 'pdf') {
          // 使用PDF处理器调整PDF文件
          const adjustedPdfBuffer = await this.pdfProcessor.adjustPDF(file.path, options, (adjustProgress) => {
            const overallProgress = (i / files.length * 100) + (adjustProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          // 保存调整后的PDF
          const originalName = path.basename(file.name, '.pdf');
          const outputFileName = `adjusted_${originalName}.pdf`;
          const outputPath = path.join(this.tempDir, outputFileName);
          fs.writeFileSync(outputPath, adjustedPdfBuffer);
          
          results.push({
            id: results.length,
            name: outputFileName,
            path: outputPath,
            size: adjustedPdfBuffer.length,
            type: 'pdf'
          });
        } else if (file.type === 'docx' || file.type === 'doc') {
          // 使用Word处理器调整Word文档
          const adjustedWordBuffer = await this.wordProcessor.adjustWordDoc(file.path, options, (adjustProgress) => {
            const overallProgress = (i / files.length * 100) + (adjustProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          // 保存调整后的Word文档
          const originalName = path.basename(file.name, '.docx');
          const outputFileName = `adjusted_${originalName}.docx`;
          const outputPath = path.join(this.tempDir, outputFileName);
          fs.writeFileSync(outputPath, adjustedWordBuffer);
          
          results.push({
            id: results.length,
            name: outputFileName,
            path: outputPath,
            size: adjustedWordBuffer.length,
            type: 'docx'
          });
        } else if (file.type === 'xlsx' || file.type === 'xls') {
          // 使用Excel处理器调整Excel文件
          const adjustedExcelBuffer = await this.excelProcessor.adjustExcelFile(file.path, options, (adjustProgress) => {
            const overallProgress = (i / files.length * 100) + (adjustProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          // 保存调整后的Excel文件
          const originalName = path.basename(file.name, '.xlsx');
          const outputFileName = `adjusted_${originalName}.xlsx`;
          const outputPath = path.join(this.tempDir, outputFileName);
          fs.writeFileSync(outputPath, adjustedExcelBuffer);
          
          results.push({
            id: results.length,
            name: outputFileName,
            path: outputPath,
            size: adjustedExcelBuffer.length,
            type: 'xlsx'
          });
        } else if (file.type === 'pptx' || file.type === 'ppt') {
          // 使用PPT处理器调整PPT文件
          const adjustedPptBuffer = await this.pptProcessor.adjustPPTFile(file.path, options, (adjustProgress) => {
            const overallProgress = (i / files.length * 100) + (adjustProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          // 保存调整后的PPT文件
          const originalName = path.basename(file.name, '.pptx');
          const outputFileName = `adjusted_${originalName}.pptx`;
          const outputPath = path.join(this.tempDir, outputFileName);
          fs.writeFileSync(outputPath, adjustedPptBuffer);
          
          results.push({
            id: results.length,
            name: outputFileName,
            path: outputPath,
            size: adjustedPptBuffer.length,
            type: 'pptx'
          });
        } else {
          // 模拟其他类型文件的调整
          await new Promise(resolve => setTimeout(resolve, 500));
          
          results.push({
            id: results.length,
            name: `adjusted_${file.name}`,
            path: file.path,
            size: file.size,
            type: file.type
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('文件调整错误:', error);
      throw error;
    }
  }

  /**
   * 添加水印
   */
  async addWatermark(files, options, progressCallback) {
    try {
      const results = [];
      const pdfFiles = files.filter(file => file.type === 'pdf');
      
      if (pdfFiles.length === 0) {
        throw new Error('请选择PDF文件进行水印处理');
      }
      
      const pdfPaths = pdfFiles.map(file => file.path);
      
      const watermarkResults = await this.watermarkProcessor.batchAddWatermark(
        pdfPaths,
        options,
        progressCallback
      );
      
      for (let i = 0; i < watermarkResults.length; i++) {
        const result = watermarkResults[i];
        const savedResult = this.watermarkProcessor.saveWatermarkedPdf(
          result.buffer,
          result.name.replace('watermarked_', '')
        );
        
        results.push({
          id: results.length,
          name: savedResult.name,
          path: savedResult.path,
          size: savedResult.size,
          type: 'pdf'
        });
      }
      
      return results;
    } catch (error) {
      console.error('添加水印错误:', error);
      throw error;
    }
  }

  /**
   * 压缩文件
   */
  async compressFiles(files, options, progressCallback) {
    try {
      const results = [];
      const pdfFiles = files.filter(file => file.type === 'pdf');
      
      if (pdfFiles.length === 0) {
        throw new Error('请选择PDF文件进行压缩处理');
      }
      
      const pdfPaths = pdfFiles.map(file => file.path);
      
      const compressionResults = await this.compressionProcessor.batchCompress(
        pdfPaths,
        options,
        progressCallback
      );
      
      for (let i = 0; i < compressionResults.length; i++) {
        const result = compressionResults[i];
        results.push({
          id: results.length,
          name: result.compressedName,
          path: result.compressedPath,
          size: result.compressedSize,
          type: 'pdf',
          originalSize: result.originalSize,
          compressionRatio: result.compressionRatio
        });
      }
      
      return results;
    } catch (error) {
      console.error('压缩文件错误:', error);
      throw error;
    }
  }

  /**
   * 加密PDF文件
   */
  async encryptFiles(files, options, progressCallback) {
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: files.length });
        }
        
        if (file.type === 'pdf') {
          // 使用安全处理器加密PDF文件
          const encryptedPdfBuffer = await this.securityProcessor.encryptPDF(file.path, options, (encryptProgress) => {
            const overallProgress = (i / files.length * 100) + (encryptProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          // 保存加密后的PDF
          const originalName = path.basename(file.name, '.pdf');
          const outputFileName = `encrypted_${originalName}.pdf`;
          const outputPath = path.join(this.tempDir, outputFileName);
          fs.writeFileSync(outputPath, encryptedPdfBuffer);
          
          results.push({
            id: results.length,
            name: outputFileName,
            path: outputPath,
            size: encryptedPdfBuffer.length,
            type: 'pdf'
          });
        } else {
          // 非PDF文件跳过加密
          results.push({
            id: results.length,
            name: file.name,
            path: file.path,
            size: file.size,
            type: file.type,
            warning: '仅支持PDF文件加密'
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('加密文件错误:', error);
      throw error;
    }
  }

  /**
   * 解密PDF文件
   */
  async decryptFiles(files, options, progressCallback) {
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: files.length });
        }
        
        if (file.type === 'pdf') {
          // 使用安全处理器解密PDF文件
          const decryptedPdfBuffer = await this.securityProcessor.decryptPDF(file.path, options, (decryptProgress) => {
            const overallProgress = (i / files.length * 100) + (decryptProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          // 保存解密后的PDF
          const originalName = path.basename(file.name, '.pdf');
          const outputFileName = `decrypted_${originalName}.pdf`;
          const outputPath = path.join(this.tempDir, outputFileName);
          fs.writeFileSync(outputPath, decryptedPdfBuffer);
          
          results.push({
            id: results.length,
            name: outputFileName,
            path: outputPath,
            size: decryptedPdfBuffer.length,
            type: 'pdf'
          });
        } else {
          // 非PDF文件跳过解密
          results.push({
            id: results.length,
            name: file.name,
            path: file.path,
            size: file.size,
            type: file.type,
            warning: '仅支持PDF文件解密'
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('解密文件错误:', error);
      throw error;
    }
  }

  /**
   * 修改PDF权限
   */
  async changePermissions(files, options, progressCallback) {
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: files.length });
        }
        
        if (file.type === 'pdf') {
          // 使用安全处理器修改PDF权限
          const modifiedPdfBuffer = await this.securityProcessor.changePermissions(file.path, options, (permissionProgress) => {
            const overallProgress = (i / files.length * 100) + (permissionProgress.percent / files.length);
            if (progressCallback) {
              progressCallback({ percent: overallProgress });
            }
          });
          
          // 保存修改后的PDF
          const originalName = path.basename(file.name, '.pdf');
          const outputFileName = `permissions_${originalName}.pdf`;
          const outputPath = path.join(this.tempDir, outputFileName);
          fs.writeFileSync(outputPath, modifiedPdfBuffer);
          
          results.push({
            id: results.length,
            name: outputFileName,
            path: outputPath,
            size: modifiedPdfBuffer.length,
            type: 'pdf'
          });
        } else {
          // 非PDF文件跳过权限修改
          results.push({
            id: results.length,
            name: file.name,
            path: file.path,
            size: file.size,
            type: file.type,
            warning: '仅支持PDF文件权限修改'
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('修改权限错误:', error);
      throw error;
    }
  }

  /**
   * OCR文字识别
   */
  async ocrFiles(files, options, progressCallback) {
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: files.length });
        }
        
        // 使用OCR处理器识别文件
        const ocrResult = await this.ocrProcessor.recognizeFile(file.path, options, (ocrProgress) => {
          const overallProgress = (i / files.length * 100) + (ocrProgress.percent / files.length);
          if (progressCallback) {
            progressCallback({ percent: overallProgress });
          }
        });
        
        // 保存OCR结果为文本文件
        const originalName = path.basename(file.name, path.extname(file.name));
        const outputFileName = `${originalName}_ocr.txt`;
        const outputPath = path.join(this.tempDir, outputFileName);
        fs.writeFileSync(outputPath, ocrResult.text || '');
        
        results.push({
          id: results.length,
          name: outputFileName,
          path: outputPath,
          size: Buffer.byteLength(ocrResult.text || ''),
          type: 'txt',
          confidence: ocrResult.confidence,
          words: ocrResult.words,
          lines: ocrResult.lines,
          paragraphs: ocrResult.paragraphs
        });
      }
      
      return results;
    } catch (error) {
      console.error('OCR识别错误:', error);
      throw error;
    }
  }

  /**
   * 清理临时文件
   */
  async cleanup() {
    try {
      // 清理PDF处理器的临时文件
      await this.pdfProcessor.cleanup();
      
      // 清理Word处理器的临时文件
      await this.wordProcessor.cleanup();
      
      // 清理Excel处理器的临时文件
      await this.excelProcessor.cleanup();
      
      // 清理PPT处理器的临时文件
      await this.pptProcessor.cleanup();
      
      // 清理水印处理器的临时文件
      await this.watermarkProcessor.cleanup();
      
      // 清理压缩处理器的临时文件
      await this.compressionProcessor.cleanup();
      
      // 清理图片处理器的临时文件
      await this.imageProcessor.cleanup();
      
      // 清理安全处理器的临时文件
      await this.securityProcessor.cleanup();
      
      // 清理OCR处理器的临时文件
      await this.ocrProcessor.cleanup();
      
      // 清理主临时目录
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

module.exports = FileProcessor;
