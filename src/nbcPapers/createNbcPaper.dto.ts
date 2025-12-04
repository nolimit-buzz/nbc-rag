import { IsOptional, IsNotEmpty, IsString, IsArray, IsObject } from "class-validator";

export class CreateNbcPaperDto {
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsString()
    @IsNotEmpty()
    transactionType: string;

    @IsArray()
    @IsNotEmpty()
    structuringLeads: string[];

    @IsArray()
    @IsNotEmpty()
    sponsors: string[];

    @IsObject()
    @IsOptional()
    projectDetails: {
        location: string;
        debtNeed: string;
    };

    @IsString()
    @IsOptional()
    marketContext: string;

    @IsArray()
    @IsOptional()
    dueDiligenceFlags: string[];
}