import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaperService } from './paper.service';
import { PaperController } from './paper.controller';
import { MongodbService } from '../mongodb/mongodb.service';
import { MarketReportsModule } from '../marketReports/marketReports.module';
import { NbcPapersModule } from '../nbcPapers/nbcPapers.module';
import { Paper, PaperSchema } from './paper.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Paper.name, schema: PaperSchema }
    ]),
    forwardRef(() => MarketReportsModule),
    forwardRef(() => NbcPapersModule)
  ],
  providers: [PaperService, MongodbService],
  controllers: [PaperController],
  exports: [MongooseModule]
})
export class PaperModule {}
