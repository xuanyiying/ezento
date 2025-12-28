import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { GuideService } from './guide.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Guide')
@ApiBearerAuth()
@Controller('guide')
export class GuideController {
    constructor(private readonly guideService: GuideService) { }

    @Post()
    @ApiOperation({ summary: 'Create a symptom-based guide' })
    async create(@Body() data: any, @Request() req) {
        const tenantId = req.tenantId;
        const userId = req.user.id;
        return this.guideService.createGuide({
            ...data,
            tenantId,
            userId,
        });
    }

    @Get('history')
    @ApiOperation({ summary: 'Get guide history' })
    async getHistory(@Request() req) {
        const tenantId = req.tenantId;
        const userId = req.user.id;
        return this.guideService.getGuideHistory(userId, tenantId);
    }
}
