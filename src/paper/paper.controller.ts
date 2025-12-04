import { Module, Post, Req, Body, Controller } from '@nestjs/common';
import { PaperService } from './paper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('papers')
export class PaperController {
  constructor(private readonly paperService: PaperService) {}
  
  @Post('create')
  async createPaper(@Req() req: any, @Body() body: any) {
    return this.paperService.createPaper(req.user, body);
  }
  // @Get('all')
  // async getAllPapers(@Req() req: any) {
  //   return this.paperService.getAllPapers(req.user);
  // }
}
