import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OCRService {
    private readonly logger = new Logger(OCRService.name);
    private accessToken: string = '';
    private tokenExpireTime: number = 0;

    constructor(private configService: ConfigService) { }

    private async getAccessToken(): Promise<string> {
        const now = Date.now();
        if (this.accessToken && this.tokenExpireTime > now) {
            return this.accessToken;
        }

        const apiKey = this.configService.get<string>('BAIDU_OCR_API_KEY');
        const secretKey = this.configService.get<string>('BAIDU_OCR_SECRET_KEY');

        if (!apiKey || !secretKey) {
            this.logger.warn('Baidu OCR API Key or Secret Key not configured');
            return '';
        }

        try {
            const response = await axios.get(
                `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
            );
            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                this.tokenExpireTime = now + (response.data.expires_in - 600) * 1000;
                return this.accessToken;
            }
        } catch (error) {
            this.logger.error(`Failed to get Baidu OCR access token: ${error.message}`);
        }
        return '';
    }

    async recognizeImage(imageBase64: string): Promise<string> {
        const token = await this.getAccessToken();
        if (!token) return '';

        try {
            const response = await axios.post(
                `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
                `image=${encodeURIComponent(imageBase64)}`,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                },
            );
            return response.data.words_result?.map((item: any) => item.words).join('\n') || '';
        } catch (error) {
            this.logger.error(`OCR recognition failed: ${error.message}`);
            return '';
        }
    }
}
