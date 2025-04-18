import { minioClient, defaultBucket, isMinioAvailable } from '../config/minio';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { Readable } from 'stream';
import * as Minio from 'minio';

interface FileUpload {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

/**
 * MinIO服务类
 * 处理文件上传到MinIO对象存储
 */
export class MinioService {
    /**
     * 上传文件到MinIO
     * @param file 文件对象
     * @param bucket 存储桶名称
     * @returns 文件信息
     */
    static async uploadFile(file: FileUpload, bucket: string = defaultBucket): Promise<any> {
        if (!isMinioAvailable() || !minioClient) {
            logger.warn('MinIO is not available, skipping file upload');
            return {
                success: false,
                message: 'Storage service is temporarily unavailable',
                file: {
                    originalname: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                },
            };
        }

        try {
            const key = `${Date.now()}-${file.originalname}`;
            const stream = Readable.from(file.buffer);

            const result = await minioClient.putObject(bucket, key, stream, file.size, {
                'Content-Type': file.mimetype,
            });

            return {
                success: true,
                file: {
                    originalname: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    key: key,
                    bucket: bucket,
                    etag: result.etag,
                },
            };
        } catch (error) {
            logger.error(`Error uploading file to MinIO: ${error}`);
            return {
                success: false,
                message: 'Failed to upload file',
                file: {
                    originalname: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                },
            };
        }
    }

    /**
     * 上传多个文件到MinIO
     * @param files 文件对象数组
     * @param customPath 自定义路径 (可选)
     * @returns 上传文件的详细信息数组
     */
    static async uploadMultipleFiles(
        files: Array<{
            buffer: Buffer;
            originalname: string;
            mimetype: string;
            size: number;
        }>,
        customPath?: string
    ) {
        const uploadPromises = files.map(file => this.uploadFile(file, customPath));
        return Promise.all(uploadPromises);
    }

    /**
     * 从MinIO删除文件
     * @param key 文件键
     * @param bucket 存储桶名称
     * @returns 删除结果
     */
    static async deleteFile(key: string, bucket: string = defaultBucket): Promise<boolean> {
        if (!isMinioAvailable() || !minioClient) {
            logger.warn('MinIO is not available, skipping file deletion');
            return false;
        }

        try {
            await minioClient.removeObject(bucket, key);
            return true;
        } catch (error) {
            logger.error(`Error deleting file from MinIO: ${error}`);
            return false;
        }
    }

    /**
     * 获取文件的预签名URL
     * @param key 文件键
     * @param expirySeconds 过期时间（秒）
     * @param bucket 存储桶名称
     * @returns 预签名URL
     */
    static async getPresignedUrl(
        key: string,
        expirySeconds: number = 3600,
        bucket: string = defaultBucket
    ): Promise<string | null> {
        if (!isMinioAvailable() || !minioClient) {
            logger.warn('MinIO is not available, cannot generate presigned URL');
            return null;
        }

        try {
            return await minioClient.presignedGetObject(bucket, key, expirySeconds);
        } catch (error) {
            logger.error(`Error generating presigned URL: ${error}`);
            return null;
        }
    }
}

export default MinioService;
