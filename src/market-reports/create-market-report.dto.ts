import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMarketReportDto {
    @IsString()
    @IsNotEmpty()
    countryName: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    author?: string;
} 