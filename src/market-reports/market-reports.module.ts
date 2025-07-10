import { Module } from '@nestjs/common';
import { MarketReportsService } from './market-reports.service';
import { MongodbService } from '../mongodb/mongodb.service';
import { MarketReportsController } from './market-reports.controller';

@Module({
  controllers: [MarketReportsController],
  providers: [MarketReportsService, MongodbService],
  exports: [MarketReportsService],  
})
export class MarketReportsModule {} 