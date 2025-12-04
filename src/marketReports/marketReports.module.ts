import { Module, forwardRef } from '@nestjs/common';
import { MarketReportsService } from './marketReports.service';
import { MongodbService } from '../mongodb/mongodb.service';
import { MarketReportsController } from './marketReports.controller';
import { PaperModule } from '../paper/paper.module';

@Module({
  imports: [forwardRef(() => PaperModule)],
  controllers: [MarketReportsController],
  providers: [MarketReportsService, MongodbService],
  exports: [MarketReportsService],  
})
export class MarketReportsModule {} 