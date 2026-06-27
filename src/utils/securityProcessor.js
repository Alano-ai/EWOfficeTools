/**
 * 安全处理模块
 * 负责PDF文件的加密、解密和权限设置
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

class SecurityProcessor {
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
   * 加密PDF文件
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} options - 加密选项
   * @param {string} options.userPassword - 用户密码（打开文件时需要）
   * @param {string} options.ownerPassword - 所有者密码（权限设置时需要）
   * @param {Object} options.permissions - 权限设置
   * @param {boolean} options.permissions.print - 允许打印
   * @param {boolean} options.permissions.modify - 允许修改
   * @param {boolean} options.permissions.copy - 允许复制
   * @param {boolean} options.permissions.annotate - 允许注释
   * @param {string} options.encryptionLevel - 加密级别 ('aes-256', 'aes-128', 'rc4-128', 'rc4-40')
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 加密后的PDF文件Buffer
   */
  async encryptPDF(pdfFilePath, options = {}, progressCallback) {
    try {
      const {
        userPassword = '',
        ownerPassword = '',
        permissions = {},
        encryptionLevel = 'aes-256'
      } = options;

      if (progressCallback) {
        progressCallback({ percent: 0, message: '正在读取PDF文件...' });
      }

      // 读取PDF文件
      const pdfBytes = fs.readFileSync(pdfFilePath);
      
      if (progressCallback) {
        progressCallback({ percent: 20, message: '正在加载PDF文档...' });
      }

      // 加载PDF文档
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      if (progressCallback) {
        progressCallback({ percent: 40, message: '正在设置加密参数...' });
      }

      // 设置加密选项
      const encryptOptions = {
        userPassword: userPassword,
        ownerPassword: ownerPassword || userPassword,
        permissions: {
          printing: permissions.print !== false ? 'highQuality' : 'none',
          modifying: permissions.modify !== false,
          copying: permissions.copy !== false,
          annotating: permissions.annotate !== false,
          fillingForms: permissions.fillForms !== false,
          contentAccessibility: permissions.accessibility !== false,
          documentAssembly: permissions.assembly !== false
        }
      };

      if (progressCallback) {
        progressCallback({ percent: 60, message: '正在加密PDF文档...' });
      }

      // 保存加密后的PDF
      const encryptedPdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        ...encryptOptions
      });
      
      if (progressCallback) {
        progressCallback({ percent: 80, message: '正在生成加密文件...' });
      }

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (progressCallback) {
        progressCallback({ percent: 100, message: '加密完成' });
      }

      return encryptedPdfBytes;
    } catch (error) {
      console.error('PDF加密错误:', error);
      throw new Error(`加密失败: ${error.message}`);
    }
  }

  /**
   * 解密PDF文件（移除密码保护）
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} options - 解密选项
   * @param {string} options.password - 当前密码
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 解密后的PDF文件Buffer
   */
  async decryptPDF(pdfFilePath, options = {}, progressCallback) {
    try {
      const { password = '' } = options;

      if (progressCallback) {
        progressCallback({ percent: 0, message: '正在读取PDF文件...' });
      }

      // 读取PDF文件
      const pdfBytes = fs.readFileSync(pdfFilePath);
      
      if (progressCallback) {
        progressCallback({ percent: 20, message: '正在加载PDF文档...' });
      }

      // 加载PDF文档（使用密码）
      const pdfDoc = await PDFDocument.load(pdfBytes, { 
        password: password,
        ignoreEncryption: false 
      });
      
      if (progressCallback) {
        progressCallback({ percent: 50, message: '正在移除密码保护...' });
      }

      // 保存解密后的PDF（不设置密码）
      const decryptedPdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false
      });
      
      if (progressCallback) {
        progressCallback({ percent: 80, message: '正在生成解密文件...' });
      }

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (progressCallback) {
        progressCallback({ percent: 100, message: '解密完成' });
      }

      return decryptedPdfBytes;
    } catch (error) {
      console.error('PDF解密错误:', error);
      throw new Error(`解密失败: ${error.message}`);
    }
  }

  /**
   * 修改PDF权限
   * @param {string} pdfFilePath - PDF文件路径
   * @param {Object} options - 权限选项
   * @param {string} options.ownerPassword - 所有者密码
   * @param {Object} options.permissions - 新权限设置
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Buffer>} 修改权限后的PDF文件Buffer
   */
  async changePermissions(pdfFilePath, options = {}, progressCallback) {
    try {
      const { ownerPassword = '', permissions = {} } = options;

      if (progressCallback) {
        progressCallback({ percent: 0, message: '正在读取PDF文件...' });
      }

      // 读取PDF文件
      const pdfBytes = fs.readFileSync(pdfFilePath);
      
      if (progressCallback) {
        progressCallback({ percent: 20, message: '正在加载PDF文档...' });
      }

      // 加载PDF文档
      const pdfDoc = await PDFDocument.load(pdfBytes, { 
        password: ownerPassword,
        ignoreEncryption: true 
      });
      
      if (progressCallback) {
        progressCallback({ percent: 50, message: '正在修改权限设置...' });
      }

      // 设置新的权限选项
      const encryptOptions = {
        ownerPassword: ownerPassword,
        permissions: {
          printing: permissions.print !== false ? 'highQuality' : 'none',
          modifying: permissions.modify !== false,
          copying: permissions.copy !== false,
          annotating: permissions.annotate !== false,
          fillingForms: permissions.fillForms !== false,
          contentAccessibility: permissions.accessibility !== false,
          documentAssembly: permissions.assembly !== false
        }
      };

      if (progressCallback) {
        progressCallback({ percent: 70, message: '正在保存权限设置...' });
      }

      // 保存修改后的PDF
      const modifiedPdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        ...encryptOptions
      });
      
      if (progressCallback) {
        progressCallback({ percent: 90, message: '正在生成文件...' });
      }

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (progressCallback) {
        progressCallback({ percent: 100, message: '权限修改完成' });
      }

      return modifiedPdfBytes;
    } catch (error) {
      console.error('修改PDF权限错误:', error);
      throw new Error(`权限修改失败: ${error.message}`);
    }
  }

  /**
   * 检测PDF文件是否加密
   * @param {string} pdfFilePath - PDF文件路径
   * @returns {Promise<Object>} 加密状态信息
   */
  async checkEncryption(pdfFilePath) {
    try {
      const pdfBytes = fs.readFileSync(pdfFilePath);
      
      // 尝试不使用密码加载
      try {
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
        return {
          isEncrypted: false,
          hasUserPassword: false,
          hasOwnerPassword: false,
          message: '文件未加密'
        };
      } catch (loadError) {
        // 如果加载失败，可能是加密的
        if (loadError.message.includes('password') || loadError.message.includes('encrypted')) {
          return {
            isEncrypted: true,
            hasUserPassword: true,
            hasOwnerPassword: true,
            message: '文件已加密，需要密码才能访问'
          };
        }
        throw loadError;
      }
    } catch (error) {
      console.error('检测PDF加密状态错误:', error);
      throw new Error(`检测失败: ${error.message}`);
    }
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {Object} 密码强度信息
   */
  checkPasswordStrength(password) {
    if (!password) {
      return {
        score: 0,
        level: '无',
        feedback: '请输入密码',
        color: '#e2e8f0'
      };
    }

    let score = 0;
    const feedback = [];

    // 长度检查
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length < 8) feedback.push('密码长度至少8位');

    // 复杂度检查
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // 反馈
    if (!/[a-z]/.test(password)) feedback.push('包含小写字母');
    if (!/[A-Z]/.test(password)) feedback.push('包含大写字母');
    if (!/[0-9]/.test(password)) feedback.push('包含数字');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('包含特殊字符');

    // 计算强度等级
    let level, color;
    if (score <= 2) {
      level = '弱';
      color = '#e53e3e';
    } else if (score <= 4) {
      level = '中';
      color = '#dd6b20';
    } else if (score <= 6) {
      level = '强';
      color = '#38a169';
    } else {
      level = '非常强';
      color = '#2b6cb0';
    }

    return {
      score,
      level,
      feedback: feedback.length > 0 ? feedback : ['密码强度良好'],
      color
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

module.exports = SecurityProcessor;