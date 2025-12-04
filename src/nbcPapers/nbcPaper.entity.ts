import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NbcPaperDocument = NbcPaper & Document;

@Schema({ timestamps: true })
export class NbcPaper {
    @Prop({ required: true })
    companyName: string;

    @Prop({ required: true })
    transactionType: string;

    @Prop({ required: true })
    structuringLeads: string[];

    @Prop({ required: true })
    sponsors: string[];

    @Prop({ required: true })
    projectDetails: {
        location: string;
        debtNeed: string;
    };

    @Prop({ required: true })
    marketContext: string;

    @Prop({ required: true, isArray: true })
    dueDiligenceFlags: string[];
    
    @Prop({ required: false })
    author: string;

    @Prop({ required: false })
    collaborators: string[];

    @Prop({ required: false })
    content: any;

    @Prop({ required: false })
    htmlContent: string;
}   