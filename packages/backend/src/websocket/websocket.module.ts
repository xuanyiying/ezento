import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ConsultationModule } from '../consultation/consultation.module';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
    imports: [ConsultationModule, AIProvidersModule],
    providers: [ChatGateway],
    exports: [ChatGateway],
})
export class WebsocketModule { }
