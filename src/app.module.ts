import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { ConfigModule } from '@nestjs/config';
import { NbcPapersModule } from './nbcPapers/nbcPapers.module';
import { MarketReportsModule } from './marketReports/marketReports.module';
import { UsersModule } from './users/users.module';
import { MongodbService } from './mongodb/mongodb.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryModule } from './history/history.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { PaperModule } from './paper/paper.module';
// import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    WebsocketsModule,
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
    HistoryModule,
    PaperModule,
  ],
  controllers: [AppController],
  providers: [AppService, MongodbService],
})
export class AppModule {}
