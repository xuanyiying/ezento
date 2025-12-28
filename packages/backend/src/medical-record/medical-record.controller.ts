import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('MedicalRecord')
@ApiBearerAuth()
@Controller('medical-record')
export class MedicalRecordController {
    constructor(private readonly medicalRecordService: MedicalRecordService) { }

    @Post('generate')
    @ApiOperation({ summary: 'Generate medical record from consultation' })
    async generate(@Body() data: { consultationId: string }, @Request() req) {
        const tenantId = req.tenantId;
        const doctorId = req.user.id;
        return this.medicalRecordService.generateFromConsultation(
            data.consultationId,
            tenantId,
            doctorId,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get medical record details' })
    async findOne(@Param('id') id: string) {
        return this.medicalRecordService.getRecordById(id);
    }

    @Get('patient/:patientId')
    @ApiOperation({ summary: 'Get medical records by patient' })
    async findByPatient(@Param('patientId') patientId: string, @Request() req) {
        const tenantId = req.tenantId;
        return this.medicalRecordService.getRecordsByPatient(patientId, tenantId);
    }
}
