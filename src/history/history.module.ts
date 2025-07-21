import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { MongodbService } from 'src/mongodb/mongodb.service';

@Module({
  providers: [HistoryService, MongodbService],
  controllers: [HistoryController]
})
export class HistoryModule {}
