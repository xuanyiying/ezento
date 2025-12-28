import { Controller, Get, Post, Body, Param, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportService } from './report.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Report')
@ApiBearerAuth()
@Controller('report')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Post('analyze')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload and analyze medical report' })
    @UseInterceptors(FileInterceptor('file'))
    async analyze(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { patientId: string; type: string },
        @Request() req,
    ) {
        const tenantId = req.tenantId;
        const userId = req.user.id;

        return this.reportService.createReport({
            tenantId,
            userId,
            patientId: body.patientId,
            type: body.type,
            fileUrl: 'mock-url', // In real app, upload to S3/MinIO first
            originalContent: 'extracted-text-from-file', // Real app calls OCRService
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get report details' })
    async findOne(@Param('id') id: string) {
        return this.reportService.getReportById(id);
    }

    @Get('patient/:patientId')
    @ApiOperation({ summary: 'Get reports by patient' })
    async findByPatient(@Param('patientId') patientId: string, @Request() req) {
        const tenantId = req.tenantId;
        return this.reportService.getReportsByPatient(patientId, tenantId);
    }
}
