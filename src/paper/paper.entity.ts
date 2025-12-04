import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { MarketReport } from '../marketReports/marketReport.entity';
import { NbcPaper } from '../nbcPapers/nbcPaper.entity';

export type PaperDocument = Paper & Document;

@Schema({ timestamps: true })
export class Paper {

    @Prop({ required: true, enum: ['nbc_paper', 'market_report'] })
    paperType: 'nbc_paper' | 'market_report';

    @Prop({ required: true, type: MongooseSchema.Types.Mixed })
    details: MarketReport | NbcPaper;

    @Prop({ required: false })
    author: string;

    @Prop({ required: false })
    collaborators: string[];

    @Prop({ required: false })
    createdAt: Date;

    @Prop({ required: false })
    updatedAt: Date;

   
}

export const PaperSchema = SchemaFactory.createForClass(Paper);