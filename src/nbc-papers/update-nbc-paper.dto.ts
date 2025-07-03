import { IsOptional, IsString, IsDate } from 'class-validator';

export class UpdateNbcPaperDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsString()
    transactionType?: string;

    @IsOptional()
    @IsString()
    structuringLeads?: string;

    @IsOptional()
    @IsString()
    sponsors?: string;

    @IsOptional()
    @IsString()
    projectDetails?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    content?: any;

    @IsOptional()
    @IsString()
    htmlContent?: string;

    @IsOptional()
    @IsDate()
    updatedAt?: Date;
} 