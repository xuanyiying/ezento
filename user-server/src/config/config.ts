import dotenv from 'dotenv';
dotenv.config();

export interface DefaultConfig {
    port: string | number;
    mongoURI: string;
    jwtSecret: string;
    nodeEnv: string;
    aliCloudApiKey: string;
    aliCloudApiEndpoint: string;
    aliCloudQwqModelName: string;
    aliCloudVoiceWsEndpoint: string;
    dashscopeApiKey: string;
    deepSeekApiKey: string;
    deepSeekApiEndpoint: string;
    deepSeekModelName: string;
}

export default {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ezento',
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    nodeEnv: process.env.NODE_ENV || 'development',
    aliCloudApiKey: process.env.ALI_CLOUD_API_KEY || '',
    aliCloudApiEndpoint: process.env.ALI_CLOUD_API_ENDPOINT || '',
    aliCloudQwqModelName: process.env.ALI_CLOUD_QWQ_MODEL_NAME || '',
    aliCloudVoiceWsEndpoint: process.env.ALIYUN_VOICE_WS_ENDPOINT || '',
    dashscopeApiKey: process.env.DASHSCOPE_API_KEY || '',
    deepSeekApiKey: process.env.DEEP_SEEK_API_KEY || '',
    deepSeekApiEndpoint: process.env.DEEP_SEEK_API_ENDPOINT || '',
    deepSeekModelName: process.env.DEEP_SEEK_MODEL_NAME || '',
}; 