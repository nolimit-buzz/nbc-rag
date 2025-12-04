import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { MongodbService } from '../mongodb/mongodb.service';
import { MarketReportsService } from '../marketReports/marketReports.service';
import { NbcPapersService } from '../nbcPapers/nbcPapers.service';
import { Paper } from './paper.entity';
@Injectable()
export class PaperService {
    constructor(
        private readonly mongodbService: MongodbService, 
        @Inject(forwardRef(() => MarketReportsService)) private readonly marketReportsService: MarketReportsService, 
        @Inject(forwardRef(() => NbcPapersService)) private readonly nbcPaperService: NbcPapersService
    ) { }

    async createPaper(user: any, body: any) {
        const paperType = body.paperType;
        console.log("paperType", paperType);
        let res: any;
        if (paperType === "market_report") {
           res= await this.marketReportsService.createMarketReport(body, user);
        } else if (paperType === "nbc_paper") {
            res = await this.nbcPaperService.createNbcPaper(body, user);
        }
        console.log("res", res);
        return res;
    }
    async getAllPapers(user: any) {
        const papers = await Paper.find({});
        console.log("papers", papers);
        return papers;
    }
}
