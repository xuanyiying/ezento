import { Client } from 'minio';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

let minioClient: Client | null = null;
let isMinioConnected = false;

// MinIO client configuration
try {
    minioClient = new Client({
        endPoint: process.env.MINIO_ENDPOINT?.replace(/^https?:\/\//, '') || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000'),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
    logger.info('MinIO client initialized successfully');
} catch (error) {
    logger.error(`MinIO client initialization error: ${error}`);
}

// Default bucket name
const defaultBucket = process.env.MINIO_BUCKET || 'ezento';

// Initialize bucket if it doesn't exist
const initializeBucket = async () => {
    if (!minioClient) {
        logger.warn('MinIO client not initialized, skipping bucket initialization');
        return;
    }

    try {
        const bucketExists = await minioClient.bucketExists(defaultBucket);
        if (!bucketExists) {
            await minioClient.makeBucket(defaultBucket, process.env.MINIO_REGION || 'us-east-1');
            logger.info(`Created MinIO bucket: ${defaultBucket}`);

            // Set bucket policy to allow public read access if needed
            if (process.env.MINIO_PUBLIC_BUCKET === 'true') {
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${defaultBucket}/*`],
                        },
                    ],
                };
                await minioClient.setBucketPolicy(defaultBucket, JSON.stringify(policy));
                logger.info(`Set public read policy for bucket: ${defaultBucket}`);
            }
        }
        isMinioConnected = true;
    } catch (error) {
        logger.error(`MinIO bucket initialization error: ${error}`);
        isMinioConnected = false;
    }
};

// Call initialization
initializeBucket().catch(err => {
    logger.error(`Failed to initialize MinIO: ${err}`);
    isMinioConnected = false;
});

// Export a function to check MinIO connection status
export const isMinioAvailable = () => isMinioConnected;

// Export the client and bucket name
export { minioClient, defaultBucket };
