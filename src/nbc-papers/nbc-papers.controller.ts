import { Controller, Post ,Get, Body} from '@nestjs/common';
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
}
