import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Report, ReportSchema } from './schemas/report.schema';
import { OCRService } from '../common/ocr.service';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
        AIProvidersModule,
    ],
    controllers: [ReportController],
    providers: [ReportService, OCRService],
    exports: [ReportService],
})
export class ReportModule { }
