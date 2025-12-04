import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class UpdateMarketReportDto {
    @IsString()
    @IsNotEmpty()
    countryName: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsOptional()
    @IsArray()
    collaborators?: string[];

    @IsOptional()
    @IsString()
    content?: any;

    @IsOptional()
    @IsString()
    htmlContent?: string;
    
} 