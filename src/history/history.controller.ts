import { Controller, Get, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Get()
    async getHistory(
        @Req() req: any,
        @Query('documentType') documentType?: string,
        @Query('skip') skip?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string
    ) {
        // Parse skip/limit as integers, default to 0/10
        const skipNum = skip ? parseInt(skip, 10) : 0;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.historyService.getHistory(req.user, documentType, skipNum, limitNum, search, status);
    }
}
