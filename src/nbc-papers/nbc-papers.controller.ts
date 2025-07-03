import { Controller, Post ,Get, Body, Param, Put} from '@nestjs/common';
import { NbcPapersService } from './nbc-papers.service';
import { CreateNbcPaperDto } from './create-nbc-paper.dto';
import { UpdateNbcPaperDto } from './update-nbc-paper.dto';

@Controller('nbc-papers')
export class NbcPapersController {
    constructor(private readonly nbcPapersService: NbcPapersService) {}

    @Get()
    async getNbcPapers() {
        return this.nbcPapersService.getNbcPapers();
    }

    @Post('create')
    async createNbcPaper(@Body() nbcPaper: CreateNbcPaperDto) {
        return this.nbcPapersService.createNbcPaper(nbcPaper);
    }

    @Put(':id')
    async updateNbcPaper(@Param('id') id: string, @Body() updateNbcPaperDto: UpdateNbcPaperDto) {
        return this.nbcPapersService.updateNbcPaper(id, updateNbcPaperDto);
    }

    @Put(':id/section/:sectionKey')
    async updateNbcPaperSection(
        @Param('id') id: string, 
        @Param('sectionKey') sectionKey: string,
        @Body() sectionData: { title: string; htmlContent: string }
    ) {
        return this.nbcPapersService.updateNbcPaperSection(id, sectionKey, sectionData);
    }

    @Post('regenerate/:id')
    async regenerateNbcPaper(@Param('id') id: string, @Body() body: {section: string, nbcPaper: CreateNbcPaperDto}) {
        return this.nbcPapersService.regenerateNbcPaper(id, body.section, body.nbcPaper);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        console.log(id);
        return this.nbcPapersService.getNbcPaperById(id);
    }
}
