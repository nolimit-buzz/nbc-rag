import { Controller, Post, Get, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { MarketReportsService } from './market-reports.service';
import { CreateMarketReportDto } from './create-market-report.dto';
import { UpdateMarketReportSectionDto, UpdateSubsectionDto } from './update-market-report-section.dto';
import { UpdateMarketReportDto } from './update-market-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('market-reports')
@UseGuards(JwtAuthGuard)
export class MarketReportsController {
    constructor(private readonly marketReportsService: MarketReportsService) {}

    @Get()
    async getMarketReports(@Query('year') year?: number, @Query('country') country?: string) {
        if (year) {
            return this.marketReportsService.getMarketReportsByYear(year);
        }
        if (country) {
            return this.marketReportsService.getMarketReportsByCountry(country);
        }
        return this.marketReportsService.getMarketReports();
    }

    @Post('create')
    async createMarketReport(
        @Body() createMarketReportDto: CreateMarketReportDto,
        @Req() req: any
    ) {
        return this.marketReportsService.createMarketReport(createMarketReportDto, req.user);
    }

    @Delete(':id')
    async deleteMarketReport(@Param('id') id: string, @Req() req: any) {
        const user = req.user;
        return this.marketReportsService.deleteMarketReport(id, user);
    }
    
    @Put(':id')
    async updateMarketReport(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any
    ) {
        return this.marketReportsService.updateMarketReport(id, body, req.user);
    }

    @Get(':id')
    async getMarketReportById(@Param('id') id: string, @Req() req: any) {
        return this.marketReportsService.getMarketReportById(id, req.user);
    }

    @Put(':id/sections/:sectionKey')
    async updateMarketReportSection(
        @Param('id') id: string,
        @Param('sectionKey') sectionKey: string,
        @Body() updateSectionDto: UpdateMarketReportSectionDto,
        @Req() req: any
    ) {
        return this.marketReportsService.updateMarketReportSection(id, sectionKey, updateSectionDto, req.user);
    }

    @Put(':id/sections/:sectionTitle/subsections/:subsectionTitle')
    async updateMarketReportSubsection(
        @Param('id') id: string,
        @Param('sectionTitle') sectionTitle: string,
        @Param('subsectionTitle') subsectionTitle: string,
        @Body() updateSubsectionDto: UpdateSubsectionDto,
        @Req() req: any
    ) {
        return this.marketReportsService.updateMarketReportSubsection(id, sectionTitle, subsectionTitle, updateSubsectionDto, req.user);
    }

    // @Post(':id/sections/:sectionTitle/subsections')
    // async addSubsectionToSection(
    //     @Param('id') id: string,
    //     @Param('sectionTitle') sectionTitle: string,
    //     @Body() subsectionData: UpdateSubsectionDto,
    //     @Req() req: any
    // ) {
    //     const user = req.user;
    //     return this.marketReportsService.addSubsectionToSection(id, sectionTitle, subsectionData, user);
    // }

    @Delete(':id/sections/:sectionTitle/subsections/:subsectionTitle')
    async removeSubsectionFromSection(
        @Param('id') id: string,
        @Param('sectionTitle') sectionTitle: string,
        @Param('subsectionTitle') subsectionTitle: string,
        @Req() req: any
    ) {
        return this.marketReportsService.removeSubsectionFromSection(id, sectionTitle, subsectionTitle, req.user);
    }

    // @Patch(':id/sections/:sectionTitle')
    // async patchMarketReportSection(
    //     @Param('id') id: string,
    //     @Param('sectionTitle') sectionTitle: string,
    //     @Body() patchData: Partial<UpdateMarketReportSectionDto>
    // ) {
    //     // Get the current section data
    //     const report = await this.marketReportsService.getMarketReportById(id);
    //     if (!report) {
    //         throw new Error('Market report not found');
    //     }

    //     const currentSection = report.content.find((section: any) => section.title === sectionTitle);
    //     if (!currentSection) {
    //         throw new Error('Section not found');
    //     }

    //     // Merge the patch data with current data
    //     const updatedSectionData: UpdateMarketReportSectionDto = {
    //         title: patchData.title || currentSection.title,
    //         htmlContent: patchData.htmlContent !== undefined ? patchData.htmlContent : currentSection.htmlContent,
    //         subsections: patchData.subsections !== undefined ? patchData.subsections : currentSection.subsections
    //     };

    //     return this.marketReportsService.updateMarketReportSection(id, sectionTitle, updatedSectionData);
    // }

    // @Patch(':id/sections/:sectionTitle/subsections/:subsectionTitle')
    // async patchMarketReportSubsection(
    //     @Param('id') id: string,
    //     @Param('sectionTitle') sectionTitle: string,
    //     @Param('subsectionTitle') subsectionTitle: string,
    //     @Body() patchData: Partial<UpdateSubsectionDto>
    // ) {
    //     // Get the current subsection data
    //     const report = await this.marketReportsService.getMarketReportById(id);
    //     if (!report) {
    //         throw new Error('Market report not found');
    //     }

    //     const currentSection = report.content.find((section: any) => section.title === sectionTitle);
    //     if (!currentSection || !currentSection.subsections) {
    //         throw new Error('Section or subsections not found');
    //     }

    //     const currentSubsection = currentSection.subsections.find((subsection: any) => subsection.title === subsectionTitle);
    //     if (!currentSubsection) {
    //         throw new Error('Subsection not found');
    //     }

    //     // Merge the patch data with current data
    //     const updatedSubsectionData: UpdateSubsectionDto = {
    //         title: patchData.title || currentSubsection.title,
    //         htmlContent: patchData.htmlContent || currentSubsection.htmlContent
    //     };

    //     return this.marketReportsService.updateMarketReportSubsection(id, sectionTitle, subsectionTitle, updatedSubsectionData);
    // }

    @Post(':id/regenerate')
    async regenerateMarketReport(
        @Param('id') id: string,
        @Body() body: { sectionKey: string; marketPaper: UpdateMarketReportSectionDto },
        @Req() req: any
    ) {
        return this.marketReportsService.regenerateMarketReport(id, body.sectionKey, body.marketPaper, req.user);
    }

    @Post(':id/regenerateSubsection')
    async regenerateMarketReportSubsection(
        @Param('id') id: string,
        @Body() body: { sectionKey: string; subsectionKey: string; marketPaper: UpdateMarketReportSectionDto },
        @Req() req: any
    ) {
        return this.marketReportsService.regenerateSubsection(id, body.sectionKey, body.subsectionKey, body.marketPaper, req.user);
    }
} 