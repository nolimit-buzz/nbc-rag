import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { ConfigModule } from '@nestjs/config';
import { NbcPapersModule } from './nbc-papers/nbc-papers.module';
import { MongodbService } from './mongodb/mongodb.service';

@Module({
  imports: [DocumentsModule,NbcPapersModule, ConfigModule.forRoot({
    isGlobal: true,
  })],
  controllers: [AppController],
  providers: [AppService, MongodbService],
})
export class AppModule {}
