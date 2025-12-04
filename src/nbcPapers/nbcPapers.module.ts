import { Module } from '@nestjs/common';
import { NbcPapersController } from './nbcPapers.controller';
import { NbcPapersService } from './nbcPapers.service';
import { MongodbService } from '../mongodb/mongodb.service';
@Module({
  controllers: [NbcPapersController],
  providers: [NbcPapersService, MongodbService],
  exports: [NbcPapersService]
})
export class NbcPapersModule {
}
