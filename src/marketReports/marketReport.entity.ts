import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketReportDocument = MarketReport & Document;

@Schema({ timestamps: true })
export class MarketReport {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    countryName: string;

    @Prop({ required: false })
    year: string;

    @Prop({ required: false })
    description: string;

    @Prop({ required: false })
    author: string;

    @Prop({ required: false })
    collaborators: string[];

    @Prop({ required: false })
    content: any;

    @Prop({ required: false })
    htmlContent: string;

    @Prop({ required: false })
    status: string;

    
}