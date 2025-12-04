import { Controller, Post, Get, Body, Param, Put, UseGuards, Req, Delete } from '@nestjs/common';
import { NbcPapersService } from './nbcPapers.service';
import { CreateNbcPaperDto } from './createNbcPaper.dto';
import { UpdateNbcPaperDto } from './update-nbc-paper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('nbc-papers')
@UseGuards(JwtAuthGuard)
export class NbcPapersController {
    constructor(private readonly nbcPapersService: NbcPapersService) { }

    @Get()
    async getNbcPapers(@Req() req: any) {
        console.log(req.user, req.user.sub)
        return this.nbcPapersService.getNbcPapers();
    }

    @Post('create')
    async createNbcPaper(
        @Body() nbcPaper: CreateNbcPaperDto,
        @Req() req: any
    ) {
        const user = req.user;
        return this.nbcPapersService.createNbcPaper(nbcPaper, user);
    }

    @Delete(':id')
    async deleteNbcPaper(@Param('id') id: string, @Req() req: any) {
        const user = req.user;
        return this.nbcPapersService.deleteNbcPaper(id, user);
    }

    @Put(':id')
    async updateNbcPaper(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any
    ) {
        const user = req.user;
        return this.nbcPapersService.updateNbcPaper(id, body, user);
    }

    @Put(':id/sections/:sectionKey')
    async updateNbcPaperSection(
        @Param('id') id: string,
        @Param('sectionKey') sectionKey: string,
        @Body() sectionData: { title: string; htmlContent: string },
        @Req() req: any
    ) {
        const user = req.user;
        return this.nbcPapersService.updateNbcPaperSection(id, sectionKey, sectionData, user);
    }

    @Post(':id/regenerate')
    async regenerateNbcPaper(
        @Param('id') id: string,
        @Body() body: { sectionKey: string, nbcPaper: CreateNbcPaperDto },
        @Req() req: any
    ) {
        const user = req.user;
        return this.nbcPapersService.regenerateNbcPaper(id, body.sectionKey, body.nbcPaper, user);
    }

    @Get(':id')
    async getById(@Param('id') id: string, @Req() req: any) {
        const user = req.user;
        return this.nbcPapersService.getNbcPaperById(id, user);
    }
}
