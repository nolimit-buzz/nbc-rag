import { Controller, Get } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Get()
    async getHistory(@Req() req: any) {
        return this.historyService.getHistory(req.user);
    }
}
