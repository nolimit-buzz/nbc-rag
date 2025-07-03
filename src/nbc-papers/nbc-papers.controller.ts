import { Controller, Post ,Get, Body, Param} from '@nestjs/common';
import { NbcPapersService } from './nbc-papers.service';
import { CreateNbcPaperDto } from './create-nbc-paper.dto';

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
