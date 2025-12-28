import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Consultation')
@ApiBearerAuth()
@Controller('consultation')
export class ConsultationController {
    constructor(private readonly consultationService: ConsultationService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new consultation' })
    async create(@Body() createDto: any, @Request() req) {
        const tenantId = req.tenantId; // From TenantMiddleware
        const userId = req.user.id;
        return this.consultationService.createConsultation({
            ...createDto,
            tenantId,
            userId,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get consultation details' })
    async findOne(@Param('id') id: string) {
        return this.consultationService.getConsultationById(id);
    }

    @Get('patient/:patientId')
    @ApiOperation({ summary: 'Get consultations by patient' })
    async findByPatient(@Param('patientId') patientId: string, @Request() req) {
        const tenantId = req.tenantId;
        return this.consultationService.getConsultationsByPatient(patientId, tenantId);
    }
}
