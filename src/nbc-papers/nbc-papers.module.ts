import { Module } from '@nestjs/common';
import { NbcPapersController } from './nbc-papers.controller';
import { NbcPapersService } from './nbc-papers.service';
import { MongodbService } from '../mongodb/mongodb.service';
@Module({
  controllers: [NbcPapersController],
  providers: [NbcPapersService, MongodbService]
})
export class NbcPapersModule {
}
