/**
 * Excel处理模块
 * 负责Excel文件的合并、拆分、转换和页面调整
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

class ExcelProcessor {
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
   * 合并多个Excel文件
   * @param {Array} excelFiles - Excel文件路径数组
   * @param {Object} options - 合并选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 合并后的Excel文件Buffer
   */
  async mergeExcelFiles(excelFiles, options = {}, progressCallback) {
    try {
      const mergedWorkbook = new ExcelJS.Workbook();
      let sheetIndex = 1;

      for (let i = 0; i < excelFiles.length; i++) {
        const filePath = excelFiles[i];
        const progress = ((i + 1) / excelFiles.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: excelFiles.length });
        }

        // 读取Excel文件
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        // 复制所有工作表
        workbook.eachSheet((worksheet, sheetId) => {
          const newSheet = mergedWorkbook.addWorksheet(`Sheet${sheetIndex}`);
          
          // 复制数据
          worksheet.eachRow((row, rowNumber) => {
            const newRow = newSheet.getRow(rowNumber);
            row.eachCell((cell, colNumber) => {
              const newCell = newRow.getCell(colNumber);
              newCell.value = cell.value;
              if (cell.style) {
                newCell.style = cell.style;
              }
            });
            newRow.commit();
          });
          
          // 复制列宽
          worksheet.columns.forEach((column, index) => {
            if (column.width) {
              newSheet.getColumn(index + 1).width = column.width;
            }
          });
          
          sheetIndex++;
        });
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 生成Buffer
      const buffer = await mergedWorkbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('Excel文件合并错误:', error);
      throw error;
    }
  }

  /**
   * 拆分Excel文件
   * @param {string} excelFilePath - Excel文件路径
   * @param {Object} options - 拆分选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 拆分后的Excel文件信息数组
   */
  async splitExcelFile(excelFilePath, options = {}, progressCallback) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelFilePath);
      
      const splitMethod = options.splitMethod || 'bySheet';
      const results = [];
      let fileIndex = 1;

      if (splitMethod === 'bySheet') {
        // 按工作表拆分
        const sheets = workbook.worksheets;
        
        for (let i = 0; i < sheets.length; i++) {
          const worksheet = sheets[i];
          const progress = ((i + 1) / sheets.length) * 100;
          
          if (progressCallback) {
            progressCallback({ percent: progress, current: i + 1, total: sheets.length });
          }

          // 创建新的工作簿
          const newWorkbook = new ExcelJS.Workbook();
          const newSheet = newWorkbook.addWorksheet(worksheet.name);
          
          // 复制数据
          worksheet.eachRow((row, rowNumber) => {
            const newRow = newSheet.getRow(rowNumber);
            row.eachCell((cell, colNumber) => {
              const newCell = newRow.getCell(colNumber);
              newCell.value = cell.value;
              if (cell.style) {
                newCell.style = cell.style;
              }
            });
            newRow.commit();
          });
          
          // 复制列宽
          worksheet.columns.forEach((column, index) => {
            if (column.width) {
              newSheet.getColumn(index + 1).width = column.width;
            }
          });

          // 生成文件名
          const originalName = path.basename(excelFilePath, '.xlsx');
          const newFileName = `${originalName}_${worksheet.name}.xlsx`;
          const newFilePath = path.join(this.tempDir, newFileName);

          // 保存文件
          const buffer = await newWorkbook.xlsx.writeBuffer();
          fs.writeFileSync(newFilePath, buffer);

          results.push({
            name: newFileName,
            path: newFilePath,
            size: buffer.length,
            sheetName: worksheet.name,
            rows: worksheet.rowCount,
            columns: worksheet.columnCount
          });

          fileIndex++;
          
          // 模拟处理时间
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else if (splitMethod === 'byRows') {
        // 按行数拆分
        const worksheet = workbook.worksheets[0]; // 取第一个工作表
        const rowsPerFile = options.rowsPerFile || 100;
        const totalRows = worksheet.rowCount;
        
        let startRow = 1;
        
        while (startRow <= totalRows) {
          const progress = (startRow / totalRows) * 100;
          
          if (progressCallback) {
            progressCallback({ percent: progress, current: fileIndex });
          }

          const endRow = Math.min(startRow + rowsPerFile - 1, totalRows);
          
          // 创建新的工作簿
          const newWorkbook = new ExcelJS.Workbook();
          const newSheet = newWorkbook.addWorksheet(worksheet.name);
          
          // 复制指定行范围的数据
          for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
            const row = worksheet.getRow(rowNum);
            const newRow = newSheet.getRow(rowNum - startRow + 1);
            
            row.eachCell((cell, colNumber) => {
              const newCell = newRow.getCell(colNumber);
              newCell.value = cell.value;
              if (cell.style) {
                newCell.style = cell.style;
              }
            });
            newRow.commit();
          }
          
          // 复制列宽
          worksheet.columns.forEach((column, index) => {
            if (column.width) {
              newSheet.getColumn(index + 1).width = column.width;
            }
          });

          // 生成文件名
          const originalName = path.basename(excelFilePath, '.xlsx');
          const newFileName = `${originalName}_rows${startRow}-${endRow}.xlsx`;
          const newFilePath = path.join(this.tempDir, newFileName);

          // 保存文件
          const buffer = await newWorkbook.xlsx.writeBuffer();
          fs.writeFileSync(newFilePath, buffer);

          results.push({
            name: newFileName,
            path: newFilePath,
            size: buffer.length,
            sheetName: worksheet.name,
            startRow: startRow,
            endRow: endRow,
            rows: endRow - startRow + 1
          });

          startRow = endRow + 1;
          fileIndex++;
          
          // 模拟处理时间
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Excel文件拆分错误:', error);
      throw error;
    }
  }

  /**
   * 调整Excel文件页面
   * @param {string} excelFilePath - Excel文件路径
   * @param {Object} options - 调整选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 调整后的Excel文件Buffer
   */
  async adjustExcelFile(excelFilePath, options = {}, progressCallback) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelFilePath);
      
      const worksheets = workbook.worksheets;
      
      for (let i = 0; i < worksheets.length; i++) {
        const worksheet = worksheets[i];
        const progress = ((i + 1) / worksheets.length) * 100;
        
        if (progressCallback) {
          progressCallback({ percent: progress, current: i + 1, total: worksheets.length });
        }

        // 设置页面属性
        worksheet.pageSetup = {
          paperSize: options.paperSize || 9, // A4
          orientation: options.orientation || 'portrait',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: {
            left: (options.marginLeft || 25) / 25.4, // 转换为英寸
            right: (options.marginRight || 25) / 25.4,
            top: (options.marginTop || 25) / 25.4,
            bottom: (options.marginBottom || 25) / 25.4,
            header: 0.5,
            footer: 0.5
          }
        };
        
        // 设置打印区域
        if (options.printArea) {
          worksheet.pageSetup.printArea = options.printArea;
        }
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 生成Buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('Excel文件调整错误:', error);
      throw error;
    }
  }

  /**
   * 将Excel文件转换为其他格式
   * @param {string} excelFilePath - Excel文件路径
   * @param {string} targetFormat - 目标格式
   * @param {Object} options - 转换选项
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} 转换结果
   */
  async convertExcelFile(excelFilePath, targetFormat, options = {}, progressCallback) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelFilePath);
      
      const worksheets = workbook.worksheets;
      const totalRows = worksheets.reduce((sum, sheet) => sum + sheet.rowCount, 0);
      let processedRows = 0;

      if (progressCallback) {
        progressCallback({ percent: 0, current: 0, total: totalRows });
      }

      // 生成输出文件名
      const originalName = path.basename(excelFilePath, '.xlsx');
      const outputFileName = `${originalName}.${targetFormat}`;
      const outputPath = path.join(this.tempDir, outputFileName);

      // 根据目标格式生成不同的内容
      let outputContent;
      
      switch (targetFormat) {
        case 'csv':
          // 转换为CSV（取第一个工作表）
          const worksheet = worksheets[0];
          const csvRows = [];
          
          worksheet.eachRow((row, rowNumber) => {
            const csvRow = [];
            row.eachCell((cell, colNumber) => {
              let cellValue = cell.value;
              if (cellValue === null || cellValue === undefined) {
                cellValue = '';
              } else if (typeof cellValue === 'object') {
                cellValue = cellValue.toString();
              }
              // CSV转义
              if (typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n'))) {
                cellValue = `"${cellValue.replace(/"/g, '""')}"`;
              }
              csvRow.push(cellValue);
            });
            csvRows.push(csvRow.join(','));
            
            processedRows++;
            if (progressCallback && processedRows % 100 === 0) {
              progressCallback({ percent: (processedRows / totalRows) * 100, current: processedRows, total: totalRows });
            }
          });
          
          outputContent = csvRows.join('\n');
          break;
          
        case 'txt':
          // 转换为TXT（制表符分隔）
          const txtWorksheet = worksheets[0];
          const txtRows = [];
          
          txtWorksheet.eachRow((row, rowNumber) => {
            const txtRow = [];
            row.eachCell((cell, colNumber) => {
              let cellValue = cell.value;
              if (cellValue === null || cellValue === undefined) {
                cellValue = '';
              } else if (typeof cellValue === 'object') {
                cellValue = cellValue.toString();
              }
              txtRow.push(cellValue);
            });
            txtRows.push(txtRow.join('\t'));
            
            processedRows++;
            if (progressCallback && processedRows % 100 === 0) {
              progressCallback({ percent: (processedRows / totalRows) * 100, current: processedRows, total: totalRows });
            }
          });
          
          outputContent = txtRows.join('\n');
          break;
          
        case 'html':
          // 转换为HTML表格
          const htmlWorksheet = worksheets[0];
          let htmlContent = `<!DOCTYPE html><html><head><title>${originalName}</title>`;
          htmlContent += '<style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>';
          htmlContent += '</head><body><table>';
          
          htmlWorksheet.eachRow((row, rowNumber) => {
            htmlContent += '<tr>';
            row.eachCell((cell, colNumber) => {
              let cellValue = cell.value;
              if (cellValue === null || cellValue === undefined) {
                cellValue = '';
              } else if (typeof cellValue === 'object') {
                cellValue = cellValue.toString();
              }
              const tag = rowNumber === 1 ? 'th' : 'td';
              htmlContent += `<${tag}>${cellValue}</${tag}>`;
            });
            htmlContent += '</tr>';
            
            processedRows++;
            if (progressCallback && processedRows % 100 === 0) {
              progressCallback({ percent: (processedRows / totalRows) * 100, current: processedRows, total: totalRows });
            }
          });
          
          htmlContent += '</table></body></html>';
          outputContent = htmlContent;
          break;
          
        default:
          // 默认转换为CSV
          outputContent = 'Unsupported format';
      }

      // 保存文件
      fs.writeFileSync(outputPath, outputContent);

      return {
        name: outputFileName,
        path: outputPath,
        size: Buffer.byteLength(outputContent),
        format: targetFormat,
        worksheets: worksheets.length,
        rows: totalRows
      };
    } catch (error) {
      console.error('Excel文件转换错误:', error);
      throw error;
    }
  }

  /**
   * 获取Excel文件信息
   * @param {string} excelFilePath - Excel文件路径
   * @returns {Promise<Object>} Excel文件信息
   */
  async getExcelInfo(excelFilePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelFilePath);
      
      const worksheets = workbook.worksheets;
      const sheetInfo = worksheets.map(sheet => ({
        name: sheet.name,
        rows: sheet.rowCount,
        columns: sheet.columnCount
      }));
      
      const totalRows = worksheets.reduce((sum, sheet) => sum + sheet.rowCount, 0);
      const totalColumns = Math.max(...worksheets.map(sheet => sheet.columnCount));

      return {
        worksheets: worksheets.length,
        sheets: sheetInfo,
        totalRows: totalRows,
        totalColumns: totalColumns
      };
    } catch (error) {
      console.error('获取Excel文件信息错误:', error);
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
          if (file.endsWith('.xlsx') || file.endsWith('.csv') || file.endsWith('.txt') || file.endsWith('.html')) {
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

module.exports = ExcelProcessor;
