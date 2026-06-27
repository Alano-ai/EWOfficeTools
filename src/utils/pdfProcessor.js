/**
 * PDF处理模块
 * 负责PDF文件的合并、拆分、转换和页面调整
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

class PDFProcessor {
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
   * 合并多个PDF文件
   * @param {Array} pdfFiles - PDF文件路径数组
   * @param {Object} options - 合并选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 合并后的PDF文件Buffer
   */
  async mergePDFs(pdfFiles, options = {}, progressCallback) {
    try {
      const mergedPdf = await PDFDocument.create();
      const totalPages = 0;

      for (let i = 0; i < pdfFiles.length; i++) {
        const filePath = pdfFiles[i];
        const progress = ((i + 1) / pdfFiles.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: pdfFiles.length });
        }

        // 读取PDF文件
        const pdfBytes = fs.readFileSync(filePath);
        const pdf = await PDFDocument.load(pdfBytes);
        
        // 复制所有页面
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 生成合并后的PDF
      const mergedPdfBytes = await mergedPdf.save();
      return mergedPdfBytes;
    } catch (error) {
      console.error('PDF合并错误:', error);
      throw error;
    }
  }

  /**
   * 拆分PDF文件
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} options - 拆分选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 拆分后的PDF文件信息数组
   */
  async splitPDF(pdfFilePath, options = {}, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const totalPages = pdf.getPageCount();
      
      const splitMethod = options.splitMethod || 'byPage';
      const pagesPerFile = options.pagesPerFile || 1;
      const results = [];

      let startPage = 0;
      let fileIndex = 1;

      while (startPage < totalPages) {
        const progress = (startPage / totalPages) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: fileIndex });
        }

        let endPage;
        switch (splitMethod) {
          case 'byPage':
            endPage = Math.min(startPage + pagesPerFile, totalPages);
            break;
          case 'bySize':
            // 简化处理：每5页一个文件
            endPage = Math.min(startPage + 5, totalPages);
            break;
          case 'byBookmark':
            // 简化处理：每10页一个文件
            endPage = Math.min(startPage + 10, totalPages);
            break;
          default:
            endPage = Math.min(startPage + pagesPerFile, totalPages);
        }

        // 创建新的PDF文档
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdf, Array.from({ length: endPage - startPage }, (_, i) => startPage + i));
        pages.forEach(page => newPdf.addPage(page));

        // 生成文件名
        const originalName = path.basename(pdfFilePath, '.pdf');
        const newFileName = `${originalName}_part${fileIndex}.pdf`;
        const newFilePath = path.join(this.tempDir, newFileName);

        // 保存文件
        const newPdfBytes = await newPdf.save();
        fs.writeFileSync(newFilePath, newPdfBytes);

        results.push({
          name: newFileName,
          path: newFilePath,
          size: newPdfBytes.length,
          pages: endPage - startPage,
          startPage: startPage + 1,
          endPage: endPage
        });

        startPage = endPage;
        fileIndex++;
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;
    } catch (error) {
      console.error('PDF拆分错误:', error);
      throw error;
    }
  }

  /**
   * 调整PDF页面
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} options - 调整选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 调整后的PDF文件Buffer
   */
  async adjustPDF(pdfFilePath, options = {}, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      const pageSize = options.pageSize || 'a4';
      const orientation = options.orientation || 'portrait';
      const marginTop = options.marginTop || 25;
      const marginBottom = options.marginBottom || 25;
      const marginLeft = options.marginLeft || 25;
      const marginRight = options.marginRight || 25;

      // 页面尺寸映射（单位：点，1点=1/72英寸）
      const pageSizes = {
        'a4': { width: 595.28, height: 841.89 },
        'letter': { width: 612, height: 792 },
        'legal': { width: 612, height: 1008 }
      };

      const targetSize = pageSizes[pageSize] || pageSizes['a4'];
      const targetWidth = orientation === 'portrait' ? targetSize.width : targetSize.height;
      const targetHeight = orientation === 'portrait' ? targetSize.height : targetSize.width;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const progress = ((i + 1) / pages.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: pages.length });
        }

        // 设置页面尺寸
        page.setSize(targetWidth, targetHeight);
        
        // 设置边距（通过裁剪框实现）
        const { width, height } = page.getSize();
        page.setMediaBox(marginLeft, marginBottom, width - marginLeft - marginRight, height - marginTop - marginBottom);
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 生成调整后的PDF
      const adjustedPdfBytes = await pdf.save();
      return adjustedPdfBytes;
    } catch (error) {
      console.error('PDF调整错误:', error);
      throw error;
    }
  }

  /**
   * 将PDF转换为其他格式
   * @param {string} pdfFilePath - PDF文件路径
   * @param {string} targetFormat - 目标格式
   * @param {Object} options - 转换选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 转换结果
   */
  async convertPDF(pdfFilePath, targetFormat, options = {}, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const totalPages = pdf.getPageCount();

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: totalPages });
      }

      // 模拟转换过程
      for (let i = 0; i < totalPages; i++) {
        const progress = ((i + 1) / totalPages) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: totalPages });
        }
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 生成输出文件名
      const originalName = path.basename(pdfFilePath, '.pdf');
      const outputFileName = `${originalName}.${targetFormat}`;
      const outputPath = path.join(this.tempDir, outputFileName);

      // 根据目标格式生成不同的内容
      let outputContent;
      switch (targetFormat) {
        case 'txt':
          // 简化处理：生成模拟文本内容
          outputContent = `这是从PDF转换的文本文件\n原始文件: ${originalName}.pdf\n页数: ${totalPages}\n转换时间: ${new Date().toLocaleString()}`;
          break;
        case 'html':
          outputContent = `<!DOCTYPE html><html><head><title>${originalName}</title></head><body><h1>PDF转换结果</h1><p>原始文件: ${originalName}.pdf</p><p>页数: ${totalPages}</p></body></html>`;
          break;
        default:
          outputContent = `PDF转换结果 - ${originalName}`;
      }

      // 保存文件
      fs.writeFileSync(outputPath, outputContent);

      return {
        name: outputFileName,
        path: outputPath,
        size: Buffer.byteLength(outputContent),
        format: targetFormat,
        pages: totalPages
      };
    } catch (error) {
      console.error('PDF转换错误:', error);
      throw error;
    }
  }

  /**
   * 获取PDF页面详细信息（用于页面编辑器预览）
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} PDF页面详细信息
   */
  async getPageDetails(pdfFilePath, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pageCount = pdf.getPageCount();
      const pages = pdf.getPages();

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: pageCount });
      }

      const pageDetails = [];

      for (let i = 0; i < pageCount; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const rotation = page.getRotation().angle;

        pageDetails.push({
          index: i,
          pageNumber: i + 1,
          width: Math.round(width * 100) / 100,
          height: Math.round(height * 100) / 100,
          rotation: rotation,
          mediaBox: page.getMediaBox(),
          cropBox: page.getCropBox()
        });

        const progress = ((i + 1) / pageCount) * 100;
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: pageCount });
        }
      }

      return {
        filePath: pdfFilePath,
        fileName: path.basename(pdfFilePath),
        pageCount,
        title: pdf.getTitle() || '',
        pages: pageDetails
      };
    } catch (error) {
      console.error('获取PDF页面详情错误:', error);
      throw error;
    }
  }

  /**
   * 旋转PDF页面
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Array} pageRotations - 页面旋转配置数组 [{ pageIndex: 0, angle: 90 }]
   *   angle 支持: 0, 90, 180, 270（顺时针角度）
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 旋转后的PDF文件Buffer
   */
  async rotatePages(pdfFilePath, pageRotations, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const totalPages = pdf.getPageCount();
      const pages = pdf.getPages();

      // 验证旋转配置
      const validAngles = [0, 90, 180, 270];

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: pageRotations.length });
      }

      for (let i = 0; i < pageRotations.length; i++) {
        const { pageIndex, angle } = pageRotations[i];

        // 验证页面索引
        if (pageIndex < 0 || pageIndex >= totalPages) {
          throw new Error(`页面索引 ${pageIndex} 超出范围 (0-${totalPages - 1})`);
        }

        // 验证旋转角度
        if (!validAngles.includes(angle)) {
          throw new Error(`旋转角度 ${angle} 无效，支持的角度: 0, 90, 180, 270`);
        }

        const page = pages[pageIndex];

        // 获取当前旋转角度，与新角度叠加
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + angle) % 360;

        // 设置旋转角度（pdf-lib使用degrees对象）
        page.setRotation({ type: 'degrees', angle: newRotation });

        const progress = ((i + 1) / pageRotations.length) * 100;
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: pageRotations.length });
        }
      }

      // 生成旋转后的PDF
      const rotatedPdfBytes = await pdf.save();
      return rotatedPdfBytes;
    } catch (error) {
      console.error('PDF页面旋转错误:', error);
      throw error;
    }
  }

  /**
   * 删除PDF页面
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Array} pageIndices - 要删除的页面索引数组（从0开始）
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 删除页面后的PDF文件Buffer
   */
  async deletePages(pdfFilePath, pageIndices, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const totalPages = pdf.getPageCount();

      // 验证页面索引
      const sortedIndices = [...pageIndices].sort((a, b) => b - a); // 从大到小排序
      for (const idx of sortedIndices) {
        if (idx < 0 || idx >= totalPages) {
          throw new Error(`页面索引 ${idx} 超出范围 (0-${totalPages - 1})`);
        }
      }

      // 检查是否删除所有页面
      if (sortedIndices.length >= totalPages) {
        throw new Error('不能删除所有页面，至少需要保留一页');
      }

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: sortedIndices.length });
      }

      // 从后往前删除，避免索引偏移问题
      for (let i = 0; i < sortedIndices.length; i++) {
        pdf.removePage(sortedIndices[i]);

        const progress = ((i + 1) / sortedIndices.length) * 100;
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: sortedIndices.length });
        }
      }

      // 生成删除页面后的PDF
      const resultPdfBytes = await pdf.save();
      return resultPdfBytes;
    } catch (error) {
      console.error('PDF页面删除错误:', error);
      throw error;
    }
  }

  /**
   * 裁剪PDF页面
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Array} pageCrops - 页面裁剪配置数组
   *   每项: { pageIndex: 0, cropBox: { x, y, width, height } }
   *   x, y 为裁剪框左下角坐标，width/height 为裁剪框尺寸（单位：点）
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 裁剪后的PDF文件Buffer
   */
  async cropPages(pdfFilePath, pageCrops, progressCallback) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const totalPages = pdf.getPageCount();
      const pages = pdf.getPages();

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: pageCrops.length });
      }

      for (let i = 0; i < pageCrops.length; i++) {
        const { pageIndex, cropBox } = pageCrops[i];

        // 验证页面索引
        if (pageIndex < 0 || pageIndex >= totalPages) {
          throw new Error(`页面索引 ${pageIndex} 超出范围 (0-${totalPages - 1})`);
        }

        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // 验证裁剪框参数
        const { x = 0, y = 0, width = pageWidth, height = pageHeight } = cropBox;

        if (x < 0 || y < 0) {
          throw new Error('裁剪框坐标不能为负数');
        }
        if (width <= 0 || height <= 0) {
          throw new Error('裁剪框宽高必须大于0');
        }
        if (x + width > pageWidth || y + height > pageHeight) {
          throw new Error(`裁剪框超出页面范围 (页面尺寸: ${pageWidth}x${pageHeight})`);
        }

        // 设置裁剪框
        page.setCropBox(x, y, width, height);

        const progress = ((i + 1) / pageCrops.length) * 100;
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: pageCrops.length });
        }
      }

      // 生成裁剪后的PDF
      const croppedPdfBytes = await pdf.save();
      return croppedPdfBytes;
    } catch (error) {
      console.error('PDF页面裁剪错误:', error);
      throw error;
    }
  }

  /**
   * 获取PDF文件信息
   * @param {string} pdfFilePath - PDF文件路径
   * @returns {Promise<Object>} PDF文件信息
   */
  async getPDFInfo(pdfFilePath) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      return {
        pages: pages.length,
        title: pdf.getTitle() || '',
        author: pdf.getAuthor() || '',
        subject: pdf.getSubject() || '',
        creator: pdf.getCreator() || '',
        producer: pdf.getProducer() || '',
        creationDate: pdf.getCreationDate() || null,
        modificationDate: pdf.getModificationDate() || null
      };
    } catch (error) {
      console.error('获取PDF信息错误:', error);
      throw error;
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

module.exports = PDFProcessor;
