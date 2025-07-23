import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMarketReportDto {
    @IsString()
    @IsNotEmpty()
    countryName: string;

    @IsString()
    @IsOptional()
    year: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsOptional()
    @IsString()
    collaborators?: string[];

    @IsOptional()
    @IsString()
    content?: any;

    @IsOptional()
    @IsString()
    htmlContent?: string;
    
} 