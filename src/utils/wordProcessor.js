/**
 * Word处理模块
 * 负责Word文档的合并、拆分、转换和页面调整
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun } = require('docx');

class WordProcessor {
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
   * 合并多个Word文档
   * @param {Array} wordFiles - Word文件路径数组
   * @param {Object} options - 合并选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 合并后的Word文档Buffer
   */
  async mergeWordDocs(wordFiles, options = {}, progressCallback) {
    try {
      const allParagraphs = [];
      
      for (let i = 0; i < wordFiles.length; i++) {
        const filePath = wordFiles[i];
        const progress = ((i + 1) / wordFiles.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: wordFiles.length });
        }

        // 读取Word文档内容
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value;
        
        // 将文本分割为段落
        const paragraphs = text.split('\n').filter(p => p.trim()).map(p => 
          new Paragraph({
            children: [
              new TextRun({
                text: p,
                size: 24 // 12pt
              })
            ]
          })
        );
        
        allParagraphs.push(...paragraphs);
        
        // 添加分页符（除了最后一个文件）
        if (i < wordFiles.length - 1) {
          allParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  break: 1
                })
              ]
            })
          );
        }
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 创建新的Word文档
      const doc = new Document({
        sections: [{
          properties: {},
          children: allParagraphs
        }]
      });

      // 生成文档Buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      console.error('Word文档合并错误:', error);
      throw error;
    }
  }

  /**
   * 拆分Word文档
   * @param {string} wordFilePath - Word文件路径
   * @param {Object} options - 拆分选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 拆分后的文档信息数组
   */
  async splitWordDoc(wordFilePath, options = {}, progressCallback) {
    try {
      // 读取Word文档内容
      const result = await mammoth.extractRawText({ path: wordFilePath });
      const text = result.value;
      const paragraphs = text.split('\n').filter(p => p.trim());
      
      const splitMethod = options.splitMethod || 'byPage';
      const paragraphsPerFile = options.paragraphsPerFile || 10;
      const results = [];

      let startParagraph = 0;
      let fileIndex = 1;

      while (startParagraph < paragraphs.length) {
        const progress = (startParagraph / paragraphs.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: fileIndex });
        }

        let endParagraph;
        switch (splitMethod) {
          case 'byPage':
            endParagraph = Math.min(startParagraph + paragraphsPerFile, paragraphs.length);
            break;
          case 'bySize':
            // 简化处理：每20个段落一个文件
            endParagraph = Math.min(startParagraph + 20, paragraphs.length);
            break;
          case 'byBookmark':
            // 简化处理：每30个段落一个文件
            endParagraph = Math.min(startParagraph + 30, paragraphs.length);
            break;
          default:
            endParagraph = Math.min(startParagraph + paragraphsPerFile, paragraphs.length);
        }

        // 创建新的Word文档
        const docParagraphs = paragraphs.slice(startParagraph, endParagraph).map(p => 
          new Paragraph({
            children: [
              new TextRun({
                text: p,
                size: 24
              })
            ]
          })
        );

        const doc = new Document({
          sections: [{
            properties: {},
            children: docParagraphs
          }]
        });

        // 生成文件名
        const originalName = path.basename(wordFilePath, '.docx');
        const newFileName = `${originalName}_part${fileIndex}.docx`;
        const newFilePath = path.join(this.tempDir, newFileName);

        // 保存文件
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(newFilePath, buffer);

        results.push({
          name: newFileName,
          path: newFilePath,
          size: buffer.length,
          paragraphs: endParagraph - startParagraph,
          startParagraph: startParagraph + 1,
          endParagraph: endParagraph
        });

        startParagraph = endParagraph;
        fileIndex++;
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;
    } catch (error) {
      console.error('Word文档拆分错误:', error);
      throw error;
    }
  }

  /**
   * 调整Word文档页面
   * @param {string} wordFilePath - Word文件路径
   * @param {Object} options - 调整选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 调整后的Word文档Buffer
   */
  async adjustWordDoc(wordFilePath, options = {}, progressCallback) {
    try {
      // 读取Word文档内容
      const result = await mammoth.extractRawText({ path: wordFilePath });
      const text = result.value;
      const paragraphs = text.split('\n').filter(p => p.trim());

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: paragraphs.length });
      }

      // 创建新的Word文档
      const docParagraphs = paragraphs.map((p, index) => {
        const progress = ((index + 1) / paragraphs.length) * 100;
        
        if (progressCallback && index % 10 === 0) {
          progressCallback({ percent: progress, current: index + 1, total: paragraphs.length });
        }

        return new Paragraph({
          children: [
            new TextRun({
              text: p,
              size: 24
            })
          ]
        });
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                width: options.pageSize === 'letter' ? 12240 : 11906, // A4 or Letter
                height: options.pageSize === 'letter' ? 15840 : 16838
              },
              margin: {
                top: (options.marginTop || 25) * 56.7, // 转换为twips
                bottom: (options.marginBottom || 25) * 56.7,
                left: (options.marginLeft || 25) * 56.7,
                right: (options.marginRight || 25) * 56.7
              }
            }
          },
          children: docParagraphs
        }]
      });

      // 生成文档Buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      console.error('Word文档调整错误:', error);
      throw error;
    }
  }

  /**
   * 将Word文档转换为其他格式
   * @param {string} wordFilePath - Word文件路径
   * @param {string} targetFormat - 目标格式
   * @param {Object} options - 转换选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 转换结果
   */
  async convertWordDoc(wordFilePath, targetFormat, options = {}, progressCallback) {
    try {
      // 读取Word文档内容
      const result = await mammoth.extractRawText({ path: wordFilePath });
      const text = result.value;
      const paragraphs = text.split('\n').filter(p => p.trim());

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: paragraphs.length });
      }

      // 模拟转换过程
      for (let i = 0; i < paragraphs.length; i++) {
        const progress = ((i + 1) / paragraphs.length) * 100;
        
        if (progressCallback && i % 10 === 0) {
          progressCallback({ percent: progress, current: i + 1, total: paragraphs.length });
        }
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 生成输出文件名
      const originalName = path.basename(wordFilePath, '.docx');
      const outputFileName = `${originalName}.${targetFormat}`;
      const outputPath = path.join(this.tempDir, outputFileName);

      // 根据目标格式生成不同的内容
      let outputContent;
      switch (targetFormat) {
        case 'txt':
          outputContent = text;
          break;
        case 'html':
          outputContent = `<!DOCTYPE html><html><head><title>${originalName}</title></head><body>`;
          paragraphs.forEach(p => {
            outputContent += `<p>${p}</p>`;
          });
          outputContent += '</body></html>';
          break;
        case 'pdf':
          // 简化处理：生成模拟PDF内容
          outputContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${text.length} >>\nstream\n${text}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n364\n%%EOF`;
          break;
        default:
          outputContent = text;
      }

      // 保存文件
      fs.writeFileSync(outputPath, outputContent);

      return {
        name: outputFileName,
        path: outputPath,
        size: Buffer.byteLength(outputContent),
        format: targetFormat,
        paragraphs: paragraphs.length
      };
    } catch (error) {
      console.error('Word文档转换错误:', error);
      throw error;
    }
  }

  /**
   * 获取Word文档信息
   * @param {string} wordFilePath - Word文件路径
   * @returns {Promise<Object>} Word文档信息
   */
  async getWordInfo(wordFilePath) {
    try {
      const result = await mammoth.extractRawText({ path: wordFilePath });
      const text = result.value;
      const paragraphs = text.split('\n').filter(p => p.trim());
      const words = text.split(/\s+/).filter(w => w);
      const characters = text.length;

      return {
        paragraphs: paragraphs.length,
        words: words.length,
        characters: characters,
        pages: Math.ceil(paragraphs.length / 30) // 估算页数
      };
    } catch (error) {
      console.error('获取Word文档信息错误:', error);
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
          if (file.endsWith('.docx') || file.endsWith('.txt') || file.endsWith('.html')) {
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

module.exports = WordProcessor;
