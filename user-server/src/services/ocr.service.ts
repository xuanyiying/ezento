import axios from 'axios';
import fs from 'fs';
import { logger } from '../utils/logger';

interface BaiduOCRResponse {
    error_code?: number;
    error_msg?: string;
    log_id: number;
    words_result_num?: number;
    words_result?: Array<{
        words: string;
    }>;
}

/**
 * 百度OCR服务
 * 负责处理图片和PDF文件的文字识别
 */
class OCRService {
    private static accessToken: string = '';
    private static tokenExpireTime: number = 0;

    /**
     * 获取百度OCR的访问令牌
     */
    private static async getAccessToken(): Promise<string> {
        // 检查是否已有有效的token
        const now = Date.now();
        if (this.accessToken && this.tokenExpireTime > now) {
            return this.accessToken;
        }

        try {
            // 获取环境变量中的API密钥和密钥
            const apiKey = process.env.BAIDU_OCR_API_KEY;
            const secretKey = process.env.BAIDU_OCR_SECRET_KEY;

            if (!apiKey || !secretKey) {
                throw new Error('百度OCR API密钥未配置');
            }

            // 获取新的access token
            const response = await axios.get(
                `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
            );

            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                // 设置token过期时间（提前10分钟过期，以确保安全）
                this.tokenExpireTime = now + (response.data.expires_in - 600) * 1000;
                return this.accessToken;
            } else {
                throw new Error('获取百度OCR访问令牌失败');
            }
        } catch (error: any) {
            logger.error(`获取百度OCR访问令牌失败: ${error.message}`);
            throw new Error(`获取百度OCR访问令牌失败: ${error.message}`);
        }
    }

    /**
     * 识别图片中的文字
     * @param imagePath 图片路径
     * @returns 识别出的文字
     */
    static async recognizeImage(imagePath: string): Promise<string> {
        try {
            const accessToken = await this.getAccessToken();
            
            // 读取图片文件并转为base64
            const imageData = fs.readFileSync(imagePath);
            const imageBase64 = Buffer.from(imageData).toString('base64');
            
            // 调用百度OCR API
            const response = await axios.post(
                `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
                `image=${encodeURIComponent(imageBase64)}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            
            const result = response.data as BaiduOCRResponse;
            
            if (result.error_code) {
                throw new Error(`百度OCR API错误: ${result.error_msg}`);
            }
            
            // 提取识别的文字
            const text = result.words_result?.map(item => item.words).join('\n') || '';
            return text;
        } catch (error: any) {
            logger.error(`图片文字识别失败: ${error.message}`);
            throw new Error(`图片文字识别失败: ${error.message}`);
        }
    }

    /**
     * 识别PDF中的文字（分页处理）
     * @param pdfPath PDF文件路径
     * @returns 识别出的文字
     */
    static async recognizePDF(pdfPath: string): Promise<string> {
        try {
            // 此处需要先将PDF转换为图片，然后对每一页进行OCR识别
            // 可以使用pdf-poppler或pdf2pic等库进行PDF到图片的转换
            // 由于实现较为复杂，这里只提供示例代码框架
            
            logger.info(`开始处理PDF文件: ${pdfPath}`);
            
            // 这里应该有PDF转图片的代码
            const images = await this.convertPDFToImages(pdfPath);
            
            // 假设我们已经有了图片路径数组
            
            // 对每一页进行OCR识别
            const textPromises = images.map((imagePath: string) => this.recognizeImage(imagePath));
            const textResults = await Promise.all(textPromises);
            
            // 合并所有页面的文字
            const fullText = textResults.join('\n\n===== 新页面 =====\n\n');
            
            return fullText;
        } catch (error: any) {
            logger.error(`PDF文字识别失败: ${error.message}`);
            throw new Error(`PDF文字识别失败: ${error.message}`);
        }
    }

    /**
     * 处理上传的医疗报告文件
     * @param filePath 文件路径
     * @returns 识别出的文字
     */
    static async processReportFile(filePath: string): Promise<string> {
        try {
            // 读取文件内容
            const fileData = fs.readFileSync(filePath);
            
            // 调用Buffer处理方法
            return await this.processReportBuffer(fileData);
        } catch (error) {
            logger.error(`处理报告文件失败: ${error}`);
            throw new Error(`OCR处理失败: ${error}`);
        }
    }

    /**
     * 处理报告文件内容，提取文本（支持从缓冲区直接处理）
     * @param fileBuffer 文件缓冲区
     * @returns 提取的文本
     */
    static async processReportBuffer(fileBuffer: Buffer): Promise<string> {
        try {
            // 转换为Base64以便OCR处理
            const fileBase64 = fileBuffer.toString('base64');
            
            // 使用OCR服务提取文本
            return await this.extractTextFromImage(fileBase64);
        } catch (error) {
            logger.error(`处理报告缓冲区失败: ${error}`);
            throw new Error(`OCR处理失败: ${error}`);
        }
    }
    
    /**
     * 从图像中提取文本
     * @param imageBase64 Base64编码的图像
     * @returns 提取的文本
     */
    private static async extractTextFromImage(imageBase64: string): Promise<string> {
        try {
            // 使用百度AI进行OCR处理
            const extractedText = await this.recognizeImage(imageBase64);
            return extractedText || '';
        } catch (error) {
            logger.error(`OCR文字提取失败: ${error}`);
            throw error;
        }
    }

    /**
     * 将PDF文件转换为图片
     * @param pdfPath PDF文件路径
     * @returns 图片路径数组
     */
    private static async convertPDFToImages(pdfPath: string): Promise<string[]> {
        try {
            const images: string[] = [];
            const { fromPath } = require('pdf2pic');
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            
            // 创建临时目录用于存储转换后的图片
            const tempDir = path.join(os.tmpdir(), 'pdf-images-' + Date.now());
            fs.mkdirSync(tempDir, { recursive: true });
            
            // 配置转换选项
            const options = {
                density: 300, // 分辨率
                saveFilename: "page", // 文件名前缀
                savePath: tempDir, // 保存路径
                format: "png", // 输出格式
                width: 2480, // 宽度（A4纸的像素宽度，300dpi）
                height: 3508 // 高度（A4纸的像素高度，300dpi）
            };
            
            // 创建转换实例
            const convert = fromPath(pdfPath, options);
            
            // 获取PDF页数
            const pdfjsLib = require('pdfjs-dist');
            const pdfData = fs.readFileSync(pdfPath);
            const pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const pageCount = pdfDocument.numPages;
            
            // 转换每一页
            for (let i = 1; i <= pageCount; i++) {
                const result = await convert(i);
                if (result && result.path) {
                    images.push(result.path);
                    logger.info(`PDF第${i}页已转换为图片: ${result.path}`);
                }
            }
            
            return images;
        } catch (error) {
            logger.error(`PDF转图片失败: ${error}`);
            throw new Error(`PDF转图片失败: ${error}`);
        }
    }
    
}

export default OCRService; 

