import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { MongodbService } from '../mongodb/mongodb.service';
@Module({
    controllers: [DocumentsController],
    providers: [DocumentsService, MongodbService],
})
export class DocumentsModule {}
