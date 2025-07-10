import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { ConfigModule } from '@nestjs/config';
import { NbcPapersModule } from './nbc-papers/nbc-papers.module';
import { MarketReportsModule } from './market-reports/market-reports.module';
import { UsersModule } from './users/users.module';
import { MongodbService } from './mongodb/mongodb.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    DocumentsModule, 
    NbcPapersModule, 
    MarketReportsModule, 
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_ATLAS_URI || '', {
      dbName: process.env.MONGODB_ATLAS_DB_NAME || 'infracredit',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, MongodbService],
})
export class AppModule {}
