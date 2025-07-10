import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubsectionDto {
    @IsString()
    title: string;

    @IsString()
    htmlContent: string;
}

export class UpdateMarketReportSectionDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    htmlContent?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateSubsectionDto)
    subsections?: UpdateSubsectionDto[];
} 