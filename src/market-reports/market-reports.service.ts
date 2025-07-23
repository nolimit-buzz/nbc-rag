import { Injectable } from '@nestjs/common';
import { MongodbService } from '../mongodb/mongodb.service';
import { CreateMarketReportDto } from './create-market-report.dto';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import * as MarkdownIt from 'markdown-it';
import { ObjectId } from 'mongodb';
import { UpdateMarketReportSectionDto } from './update-market-report-section.dto';
import { UpdateMarketReportDto } from './update-market-report.dto';

export interface MarketReportSection {
    title: string;
    htmlContent?: string; // main body
    subsections?: {
        title: string;
        htmlContent: string;
    }[];
}


@Injectable()
export class MarketReportsService {
    constructor(private readonly mongodbService: MongodbService) { }

    private collectionName: string = "market_reports";

    async getMarketReportById(id: string, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        console.log("existingReport", existingReport);
        if (!existingReport) {
            throw new Error('Market report not found');
        }
        console.log(existingReport.collaborators);
        console.log("user", user.sub, existingReport.createdBy, existingReport?.collaborators?.some((collaborator: any) => collaborator.userId === user.sub));
        if (existingReport.createdBy !== user.sub && !existingReport?.collaborators?.some((collaborator: any) => collaborator.userId === user.sub)) {
            return {
                success: false,
                message: 'User is not the author of the market report',
                status: 403
            }
        }
        return {
            success: true,
            ...existingReport
        };
    }

    async getMarketReports() {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.find({}).toArray();
    }

    async getMarketReportsByYear(year: number) {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.find({ year: year }).toArray();
    }

    async getMarketReportsByCountry(countryName: string) {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.find({ countryName: { $regex: new RegExp(countryName, 'i') } }).toArray();
    }

    async updateMarketReport(id: string, body: any, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });

        const isCollaborator = existingReport?.collaborators?.some((collaborator: any) => collaborator.userId === user.sub && collaborator.role === "owner");
        if (user.sub !== existingReport?.createdBy && !isCollaborator) {
            return {
                success: false,
                message: 'User is not the author or collaborator of the market report',
                status: 403
            }
        }
        if (!existingReport) {
            throw new Error('Market report not found');
        }

        const { _id, ...dataWithoutId } = existingReport;
        let collaborators: any[] = [];
        const existingCollaborators = existingReport?.collaborators;
        console.log("existingCollaborators", existingCollaborators);
        if (body?.collaborators) {
            const collaboratorExists = body?.collaborators?.some((collaborator: any) => existingCollaborators?.some((c: any) => c.userId === collaborator.userId && c.role === collaborator.role));
            console.log("collaboratorExists", collaboratorExists);
            if (!collaboratorExists) {
                collaborators = [...(existingCollaborators || []), ...body?.collaborators];
            }
        }
        console.log("collaborators", collaborators);
        console.log("updateMarketReportDto", body);
        const updateData: any = {
            ...dataWithoutId,
            ...body,
            collaborators: collaborators,
            updatedAt: new Date(),
            lastModifiedBy: user.sub,
            lastModifiedByEmail: user.email,
        };
        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        console.log("result", result);

        const historyCollection = await this.mongodbService.connect("history");
        const history = await historyCollection.findOne({ entityId: id });
        if (!history) {
            throw new Error('History not found');
        }
        const { _id: historyId, ...rest } = history;

        const historyUpdateData = {
            action: "updated_market_report",
            ...rest,
            metadata: {
                ...history.metadata,
                status: updateData.status,
                ...updateData,
                updatedAt: new Date(),
                lastModifiedBy: user.sub,
                lastModifiedByEmail: user.email,
            }
        }
        if (updateData.collaborators) {
            historyUpdateData["collaborators"] = updateData.collaborators;
        }
        await historyCollection.updateOne({ _id: historyId }, {
            $set: {
                ...rest,
                ...historyUpdateData,
            }
        });
        return {
            success: true,
            message: 'Market report updated successfully',
            updatedAt: new Date(),
            lastModifiedBy: user ? user.email : null
        };

    }

    async updateMarketReportSection(id: string, sectionKey: string, sectionData: { title: string; htmlContent?: string; subsections?: { title: string; htmlContent: string }[] }, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
        }

        // Check if the section exists
        const sectionExists = existingReport.content.some((section: any) => {
            console.log(section.title, this.getSectionTitle(sectionKey), sectionKey);
            return section.title === this.getSectionTitle(sectionKey);
        });
        if (!sectionExists) {
            throw new Error(`Section "${sectionKey}" not found in market report`);
        }

        // Find and update the specific section
        const updatedContent = existingReport.content.map((section: any) => {
            if (section.title === this.getSectionTitle(sectionKey)) {
                return {
                    ...section,
                    title: sectionData.title,
                    htmlContent: sectionData.htmlContent !== undefined ? sectionData.htmlContent : section.htmlContent,
                    subsections: sectionData.subsections !== undefined ? sectionData.subsections : section.subsections
                };
            }
            return section;
        });


        const { _id, ...dataWithoutId } = existingReport;
        const updateData: any = {
            ...dataWithoutId,
            content: updatedContent,
            updatedAt: new Date(),
            lastModifiedBy: user.sub,
            lastModifiedByEmail: user.email,
        };

        // Add user tracking if available
        if (user) {
            updateData.lastModifiedBy = user.sub;
            updateData.lastModifiedByEmail = user.email;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        const historyCollection = await this.mongodbService.connect("history");
        const history = await historyCollection.findOne({ entityId: id });
        if (!history) {
            throw new Error('History not found');
        }
        await historyCollection.updateOne({_id: history._id}, {$set: {
            ...history,
            user: user ? user.sub : null,
            action: "updated_market_report_section",
            entityType: "MarketReport",
            entityId: updateData.id,
            
        }});
        if (result.matchedCount === 0) {
            throw new Error('Market report not found');
        }

        return {
            success: true,
            message: `Section "${this.getSectionTitle(sectionKey)}" updated successfully`,
            updatedAt: new Date(),
            lastModifiedBy: user ? user.email : null
        };
    }

    private getSectionTitle(sectionKey: string): string {
        switch (sectionKey) {
            case "summary_statistics":
                return "Summary Statistics";
            case "snapshot":
                return "Snapshot";
            case "overview_financial_system":
                return "Overview of Financial System";
            case "fixed_income_markets":
                return "Fixed Income Markets";
            case "foreign_exchange":
                return "Foreign Exchange";
            case "derivatives":
                return "Derivatives";
            case "participation_foreign_investors_issuers":
                return "Participation of Foreign Investors and Issuers";
            case "clearing_settlement":
                return "Clearing and Settlement";
            case "investment_taxation":
                return "Investment Taxation";
            case "key_contacts":
                return "Key Contacts";
            default:
                return sectionKey.replace(/_/g, ' ');
        }
    }

    async updateMarketReportSubsection(id: string, sectionKey: string, subsectionKey: string, subsectionData: { title: string; htmlContent: string }, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
        }
        if ((user && user.sub) !== existingReport.author) {
            return {
                success: false,
                message: 'User is not the author of the market report',
            }
        }
        // Check if the section exists
        const section = existingReport.content.find((section: any) => {
            console.log(section.title, this.getSectionTitle(sectionKey), sectionKey);
            return section.title === this.getSectionTitle(sectionKey);
        });
        if (!section) {
            throw new Error(`Section "${sectionKey}" not found in market report`);
        }

        // Check if the subsection exists
        if (!section.subsections) {
            throw new Error(`Section "${sectionKey}" does not have any subsections`);
        }

        const subsectionExists = section.subsections.some((subsection: any) => {
            console.log(subsection.title, subsectionKey, this.getSubsectionTitle(subsectionKey));
            return subsection.title === this.getSubsectionTitle(subsectionKey);
        });
        if (!subsectionExists) {
            throw new Error(`Subsection "${subsectionKey}" not found in section "${sectionKey}"`);
        }

        // Find the section and update the specific subsection
        const updatedContent = existingReport.content.map((section: any) => {
            if (section.title === sectionKey && section.subsections) {
                const updatedSubsections = section.subsections.map((subsection: any) => {
                    if (subsection.title === this.getSubsectionTitle(subsectionKey)) {
                        return {
                            ...subsection,
                            title: subsectionData.title,
                            htmlContent: subsectionData.htmlContent
                        };
                    }
                    return subsection;
                });

                return {
                    ...section,
                    subsections: updatedSubsections
                };
            }
            return section;
        });

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    content: updatedContent,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Market report not found');
        }
        const historyCollection = await this.mongodbService.connect("history");
        const history = await historyCollection.findOne({ entityId: id });
        if (!history) {
            throw new Error('History not found');
        }
        await historyCollection.updateOne({_id: history._id}, {$set: {
            ...history,
            user: user ? user.sub : null,
            action: "updated_market_report_subsection",
            entityType: "MarketReport",
            entityId: existingReport._id.toString(),
            
        }});
        return {
            success: true,
            message: `Subsection "${this.getSubsectionTitle(subsectionKey)}" in section "${sectionKey}" updated successfully`,
            updatedAt: new Date()
        };
    }

    async addSubsectionToSection(id: string, sectionKey: string, subsectionData: { title: string; htmlContent: string }) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
        }

        // Find the section and add the new subsection
        const updatedContent = existingReport.content.map((section: any) => {
            if (section.title === sectionKey) {
                const subsections = section.subsections || [];
                subsections.push(subsectionData);

                return {
                    ...section,
                    subsections
                };
            }
            return section;
        });

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    content: updatedContent,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Market report not found');
        }

        return {
            success: true,
            message: `New subsection "${subsectionData.title}" added to section "${sectionKey}"`,
            updatedAt: new Date()
        };
    }

    async removeSubsectionFromSection(id: string, sectionKey: string, subsectionTitle: string, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
        }
        if (existingReport.createdBy !== user.sub) {
            return {
                success: false,
                message: 'User is not the author of the market report',
            }
        }

        // Find the section and remove the specific subsection
        const updatedContent = existingReport.content.map((section: any) => {
            if (section.title === sectionKey && section.subsections) {
                const updatedSubsections = section.subsections.filter((subsection: any) =>
                    subsection.title !== subsectionTitle
                );

                return {
                    ...section,
                    subsections: updatedSubsections
                };
            }
            return section;
        });

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    content: updatedContent,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Market report not found');
        }

        return {
            success: true,
            message: `Subsection "${subsectionTitle}" removed from section "${sectionKey}"`,
            updatedAt: new Date()
        };
    }

    async regenerateMarketReport(id: string, sectionKey: string, marketPaper: UpdateMarketReportSectionDto, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
        }

        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            streaming: true,
        });

        return this.regenerateSection(id, sectionKey, existingReport, llm, marketPaper, user);
    }

    async regenerateSubsection(id: string, sectionKey: string, subsectionKey: string, marketPaper: UpdateMarketReportSectionDto, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
        }

        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            streaming: true,
        });

        return this.regenerateSpecificSubsection(id, sectionKey, subsectionKey, existingReport, llm, marketPaper, user);
    }

    private async regenerateSpecificSubsection(id: string, sectionKey: string, subsectionKey: string, existingReport: any, llm: ChatOpenAI, marketPaper: UpdateMarketReportSectionDto, user?: any) {
        const sectionTitle = this.getSectionTitle(sectionKey);
        const subsectionTitle = this.getSubsectionTitle(subsectionKey);

        const prompt = this.generateSubsectionPrompt(sectionKey, subsectionKey, existingReport.countryName, existingReport.year);
        const question = PromptTemplate.fromTemplate(prompt);
        const chain = question.pipe(llm);

        const response = await chain.invoke({
            countryName: existingReport.countryName,
            year: existingReport.year,
            marketPaper: marketPaper
        });

        const parsedResponse = await this.extractSectionsToHtml(response.content.toString());
        console.log('Parsed subsection response:', parsedResponse);

        // Find the regenerated subsection content
        const regeneratedSubsection = parsedResponse.find(section =>
            section.title === subsectionTitle ||
            section.title.toLowerCase().includes(subsectionKey.toLowerCase())
        );

        if (!regeneratedSubsection) {
            throw new Error(`Failed to regenerate subsection "${subsectionTitle}"`);
        }

        // Update the specific subsection in the content
        const updatedContent = existingReport.content.map((section: any) => {
            if (section.title === sectionTitle && section.subsections) {
                const updatedSubsections = section.subsections.map((subsection: any) => {
                    if (subsection.title === subsectionTitle) {
                        return {
                            ...subsection,
                            htmlContent: regeneratedSubsection.htmlContent
                        };
                    }
                    return subsection;
                });

                return {
                    ...section,
                    subsections: updatedSubsections
                };
            }
            return section;
        });

        const collection = await this.mongodbService.connect(this.collectionName);
        const updateData: any = {
            content: updatedContent,
            updatedAt: new Date()
        };

        // Add user tracking if available
        if (user) {
            updateData.lastModifiedBy = user.sub;
            updateData.lastModifiedByEmail = user.email;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new Error('Market report not found');
        }

        return {
            success: true,
            message: `Subsection "${subsectionTitle}" in section "${sectionTitle}" regenerated successfully`,
            updatedAt: new Date(),
            regeneratedSubsection,
            result,
            lastModifiedBy: user ? user.email : null
        };
    }

    private async regenerateSection(id: string, sectionKey: string, existingReport: any, llm: ChatOpenAI, marketPaper?: UpdateMarketReportSectionDto, user?: any) {
        const sectionTitle = this.getSectionTitle(sectionKey);
        const prompt = this.generateSectionPrompt(sectionKey, existingReport.countryName, existingReport.year);
        const question = PromptTemplate.fromTemplate(prompt);
        const chain = question.pipe(llm);

        const response = await chain.invoke({
            countryName: existingReport.countryName,
            year: existingReport.year,
            marketPaper: marketPaper
        });

        const parsedResponse = await this.extractSectionsToHtml(response.content.toString());
        const regeneratedSection = parsedResponse.find(section => {
            console.log(section.title, sectionTitle, section.title === sectionTitle);
            return section.title === sectionTitle;
        });

        if (!regeneratedSection) {
            throw new Error(`Failed to regenerate section "${sectionTitle}"`);
        }

        // Update the specific section in the content
        const updatedContent = existingReport.content.map((section: any) => {
            if (section.title === sectionTitle) {
                return {
                    ...section,
                    htmlContent: regeneratedSection.htmlContent,
                };
            }
            return section;
        });

        const collection = await this.mongodbService.connect(this.collectionName);
        const updateData: any = {
            content: updatedContent,
            updatedAt: new Date()
        };

        // Add user tracking if available
        if (user) {
            updateData.lastModifiedBy = user.sub;
            updateData.lastModifiedByEmail = user.email;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new Error('Market report not found');
        }

        return {
            success: true,
            message: `Section "${sectionTitle}" regenerated successfully`,
            updatedAt: new Date(),
            regeneratedSection,
            result,
            lastModifiedBy: user ? user.email : null
        };
    }

    private async regenerateEntireReport(id: string, existingReport: any, llm: ChatOpenAI) {
        const prompt = this.generateMarketReportPrompt(existingReport.countryName, existingReport.year);
        const question = PromptTemplate.fromTemplate(prompt);
        const chain = question.pipe(llm);

        const response = await chain.invoke({
            countryName: existingReport.countryName,
            year: existingReport.year,
        });

        const parsedResponse = await this.extractSectionsToHtml(response.content.toString());

        const content: any[] = [];
        parsedResponse.forEach(section => {
            content.push({
                title: section.title,
                htmlContent: section.htmlContent,
                subsections: section.subsections || []
            });
        });

        const collection = await this.mongodbService.connect(this.collectionName);
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    content,
                    htmlContent: response.content.toString(),
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Market report not found');
        }

        return {
            success: true,
            message: `Entire market report regenerated successfully`,
            updatedAt: new Date()
        };
    }

    private generateSectionPrompt(sectionKey: string, countryName: string, year: number): string {
        const displayYear = year || new Date().getFullYear();
        const sectionTitle = this.getSectionTitle(sectionKey);

        // Section-specific templates mirroring the full report structure
        switch (sectionTitle) {
            case "Summary Statistics":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Summary Statistics

| Indicator | Value (${displayYear}) |
|---|---|
| Population (mn) | [Create realistic value based on ${countryName} for ${displayYear}] |
| Population Growth (annual %) | [Create realistic value for ${displayYear}] |
| Official Language | [Use actual official language(s) of ${countryName}] |
| Currency | [Use actual currency of ${countryName}] |
| GDP (Current US$ bn) | [Create realistic GDP figure for ${displayYear}] |
| GDP Growth (annual %) | [Create realistic growth rate for ${displayYear}] |
| GDP Per Capita (US$) | [Calculate based on population and GDP for ${displayYear}] |
| FDI, net inflows (US$ mn) | [Create realistic FDI figure for ${displayYear}] |
| External Debt (US$ mn) | [Create realistic external debt figure for ${displayYear}] |
| External Debt/GDP (%) | [Calculate percentage for ${displayYear}] |
| CPI Inflation (annual %) | [Create realistic inflation rate for ${displayYear}] |
| Exports of goods and services (% of GDP) | [Create realistic export percentage for ${displayYear}] |
| Gross Official Reserves (bn US$) | [Create realistic reserves figure for ${displayYear}] |
| Gross Official Reserves (In months of imports) | [Calculate based on imports for ${displayYear}] |
| UNDP HDI RANKING | [Create realistic HDI ranking for ${displayYear}] |
| **Sources** | [List credible sources like World Bank, IMF, Central Bank of ${countryName}] and include links to the sources|

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT table structure above.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Overview of Financial System":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Overview of Financial System

Explain the overview of the financial system in ${countryName} as of ${displayYear}, including the banking system, ownership structures, and regulatory framework.

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT section headers and structure above.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Fixed Income Markets":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Fixed Income Markets

Explain the fixed income market in ${countryName} as of ${displayYear}.

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT section headers and structure above.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Foreign Exchange":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Foreign Exchange

Explain the foreign exchange market in ${countryName} as of ${displayYear}, including the exchange rate regime (peg or float), central bank intervention policies, FX controls and taxes, and historical context.

Include a Markdown table showing exchange rates for ${displayYear} and previous years.

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT section header and include a Markdown table of exchange rates.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Derivatives":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Derivatives

Describe the available derivative products (forwards, swaps, options, caps) and explain regulatory limits on maturities and their use in ${countryName} as of ${displayYear}.

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT section header and structure above.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Participation of Foreign Investors and Issuers":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Participation of Foreign Investors and Issuers

Discuss the rules for foreign participation in ${countryName}'s markets as of ${displayYear}, and present examples of supranational or international bond issues during the period.

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT section header and structure above.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Clearing and Settlement":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Clearing and Settlement

Describe the central securities depository, its operations, and the settlement conventions and processes in ${countryName} as of ${displayYear}.

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT section header and structure above.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Investment Taxation":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Investment Taxation

Explain the taxation of interest, dividends, royalties, and foreign income in ${countryName} as of ${displayYear}.

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT section header and structure above.
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear} or the most recent year available.
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
4. You MUST maintain a professional financial analysis tone.
5. You MUST reference credible sources for data.
6. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
7. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.`;

            case "Key Contacts":
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

## Key Contacts

* **Stock Exchange**
Name: [Actual stock exchange name in ${countryName}]  
Address: [Actual address]  
Phone: [Actual phone number]  
Fax: [Actual fax number]  
Email: [Actual email]  
Website: [Actual website]

* **Central Bank**
Name: [Actual central bank name in ${countryName}]  
Address: [Actual address]  
Phone: [Actual phone number]  
Fax: [Actual fax number]  
Email: [Actual email]  
Website: [Actual website]

* **Securities Regulator**
Name: [Actual securities regulator name in ${countryName}]  
Address: [Actual address]  
Phone: [Actual phone number]  
Fax: [Actual fax number]  
Email: [Actual email]  
Website: [Actual website]

## CRITICAL REQUIREMENTS:
1. You MUST use the EXACT contact structure above.
2. You MUST use actual names, addresses, and contact details for ${countryName}.
3. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].`;

            default:
                // Fallback to previous generic prompt
                return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.
\nFocus specifically on the ${sectionTitle} section and provide comprehensive, up-to-date information that would be relevant for ${displayYear}.\n\n## ${sectionTitle}\n\n[Generate detailed content for the ${sectionTitle} section.]\n\n## CRITICAL REQUIREMENTS:\n1. You MUST focus ONLY on the ${sectionTitle} section\n2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}\n3. You MUST use actual official languages, currencies, and institutional names for ${countryName}\n4. You MUST maintain a professional financial analysis tone\n5. You MUST include specific financial figures and market metrics for ${displayYear}\n6. You MUST reference credible sources for data\n7. You MUST ensure all information is current and relevant to ${countryName} in ${displayYear}\n8. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}]\n9. You MUST focus on ${displayYear} data while presenting historical context where relevant\n10. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data`;
        }
    }

    async createMarketReport(createMarketReportDto: CreateMarketReportDto, user?: any) {

        const collection = await this.mongodbService.connect(this.collectionName);

        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            streaming: true,
        });

        const year = (createMarketReportDto as any).year || new Date().getFullYear();
        const prompt = this.generateMarketReportPrompt(createMarketReportDto.countryName, year);
        const question = PromptTemplate.fromTemplate(prompt);
        const chain = question.pipe(llm);

        const response = await chain.invoke({
            countryName: createMarketReportDto.countryName,
            year: year,
        });

        const parsedResponse = await this.extractSectionsToHtml(response.content.toString());

        const content: any[] = [];
        parsedResponse.forEach(section => {
            content.push({
                title: section.title,
                htmlContent: section.htmlContent,
                subsections: section.subsections || []
            });
        });

        const usersCollection = await this.mongodbService.connect("users");
        const userData = await usersCollection.findOne({ _id: new ObjectId(user.sub) });
        const author = `${userData?.firstName} ${userData?.lastName} (${userData?.email})`;

        const marketReportData = {
            title: `African Fixed Income Market Guide - ${createMarketReportDto.countryName} (${year})`,
            countryName: createMarketReportDto.countryName,
            year: year,
            description: createMarketReportDto.description || `Market report for ${createMarketReportDto.countryName} - ${year}`,
            author: author,
            createdBy: userData?._id.toString(),
            content,
            status: "draft",
            htmlContent: response.content.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const newMarketReport = await collection.insertOne(marketReportData);

        const activityCollection = await this.mongodbService.connect("history");
        await activityCollection.insertOne({
            user: user ? user.sub : null,
            action: "created_market_report",
            entityType: "MarketReport",
            entityId: newMarketReport.insertedId.toString(),
            createdBy: userData?._id.toString(),
            metadata: {
                author: marketReportData.author,
                name: marketReportData.title,
                countryName: marketReportData.countryName,
                year: marketReportData.year,
                title: marketReportData.title,
                status: marketReportData.status,
                createdAt: marketReportData.createdAt,
                updatedAt: marketReportData.updatedAt
            }
        });
        return {
            success: true,
            marketReport: {
                id: newMarketReport.insertedId,
                createdAt: marketReportData.createdAt,
                updatedAt: marketReportData.updatedAt,
                author: marketReportData.author
            }
        };
    }
    async deleteMarketReport(id: string, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);
        const existingPaper = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingPaper) {
            throw new Error('Market report not found');
        }
        await collection.deleteOne({ _id: new ObjectId(id) });

        const historyCollection = await this.mongodbService.connect("history");
        await historyCollection.deleteOne({ entityId: id });

        if (existingPaper.createdBy !== user.sub) {
            return {
                success: false,
                message: 'User is not the author of the market report',
                status: 403
            }
        }
    }
    private generateMarketReportPrompt(countryName: string, year: number): string {
        const displayYear = year || new Date().getFullYear();
        return `You are an expert financial analyst specializing in African fixed income markets. Create a comprehensive market report for ${countryName} for the year ${displayYear} following the EXACT template structure below.
            
      ## Summary Statistics
      
      | Indicator | Value (${displayYear}) |
      |---|---|
      | Population (mn) | [Create realistic value based on ${countryName} for ${displayYear}] |
      | Population Growth (annual %) | [Create realistic value for ${displayYear}] |
      | Official Language | [Use actual official language(s) of ${countryName}] |
      | Currency | [Use actual currency of ${countryName}] |
      | GDP (Current US$ bn) | [Create realistic GDP figure for ${displayYear}] |
      | GDP Growth (annual %) | [Create realistic growth rate for ${displayYear}] |
      | GDP Per Capita (US$) | [Calculate based on population and GDP for ${displayYear}] |
      | FDI, net inflows (US$ mn) | [Create realistic FDI figure for ${displayYear}] |
      | External Debt (US$ mn) | [Create realistic external debt figure for ${displayYear}] |
      | External Debt/GDP (%) | [Calculate percentage for ${displayYear}] |
      | CPI Inflation (annual %) | [Create realistic inflation rate for ${displayYear}] |
      | Exports of goods and services (% of GDP) | [Create realistic export percentage for ${displayYear}] |
      | Gross Official Reserves (bn US$) | [Create realistic reserves figure for ${displayYear}] |
      | Gross Official Reserves (In months of imports) | [Calculate based on imports for ${displayYear}] |
      | UNDP HDI RANKING | [Create realistic HDI ranking for ${displayYear}] |
      | **Sources** | [List credible sources like World Bank, IMF, Central Bank of ${countryName} and include links to the sources] |
      
      ## 1. Overview of Financial System
      
      Explain the overview of the financial system in ${countryName} as of ${displayYear}, including the banking system, ownership structures, and regulatory framework.
      
      ### 1.1 Bank and Non-Bank Financial Sector
      
      Describe the banking system and ownership structure, the roles and significance of non-bank financial institutions, and the insurance market in ${countryName} as of ${displayYear}.
      
      ### 1.2 Capital Market
      
      Detail the stock exchange and capital market infrastructure, discuss listings and modernization efforts, and describe major brokerage firms and their services in ${countryName} as of ${displayYear}.
      
      ## 2. Fixed Income Markets
      
      Present a narrative overview of the fixed income market in ${countryName} as of ${displayYear}.
      
      ### 2.1 Government Securities
      
      Describe the Treasury bills and bonds maturities available, explain the auction process and primary market operations, and summarize the outstanding debt and ownership distribution as of ${displayYear}.
      
      ### 2.2 Non-Central Government Issuance
      
      Describe the issuance of corporate bonds, commercial paper, certificates of deposit, and their proportion relative to government debt in ${displayYear}.
      
      ### 2.3 Secondary Market
      
      Detail the liquidity and trading volume in the fixed income market, summarize the repo market and interbank activities, and describe the yield curve and market dynamics in ${displayYear}.
      
      ## 3. Foreign Exchange
      
      Explain the foreign exchange market in ${countryName} as of ${displayYear}, including the exchange rate regime (peg or float), central bank intervention policies, FX controls and taxes, and historical context.
      
      Include a Markdown table showing exchange rates for ${displayYear} and previous years.
      
      ## 4. Derivatives
      
      Describe the available derivative products (forwards, swaps, options, caps) and explain regulatory limits on maturities and their use in ${countryName} as of ${displayYear}.
      
      ## 5. Participation of Foreign Investors and Issuers
      
      Discuss the rules for foreign participation in ${countryName}'s markets as of ${displayYear}, and present examples of supranational or international bond issues during the period.
      
      ## 6. Clearing and Settlement
      
      Describe the central securities depository, its operations, and the settlement conventions and processes in ${countryName} as of ${displayYear}.
      
      ## 7. Investment Taxation
      
      Explain the taxation of interest, dividends, royalties, and foreign income in ${countryName} as of ${displayYear}.
      
      ## 8. Key Contacts
      
      * **Stock Exchange**
      
      Name: [Actual stock exchange name in ${countryName}]  
      Address: [Actual address]  
      Phone: [Actual phone number]  
      Fax: [Actual fax number]  
      Email: [Actual email]  
      Website: [Actual website]
      
      * **Central Bank**
      
      Name: [Actual central bank name in ${countryName}]  
      Address: [Actual address]  
      Phone: [Actual phone number]  
      Fax: [Actual fax number]  
      Email: [Actual email]  
      Website: [Actual website]
      
      * **Securities Regulator**
      
      Name: [Actual securities regulator name in ${countryName}]  
      Address: [Actual address]  
      Phone: [Actual phone number]  
      Fax: [Actual fax number]  
      Email: [Actual email]  
      Website: [Actual website]
      
      ## CRITICAL REQUIREMENTS:
      
      1. You MUST use the EXACT section headers and structure shown above.
      2. You MUST not include any additional section or title against the structure above.
      3. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
      4. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
      5. You MUST maintain a professional financial analysis tone throughout.
      5. You MUST include specific financial figures and market metrics for ${displayYear}.
      6. You MUST reference credible sources for data.
      7. You MUST ensure all information is current and relevant to ${countryName} in ${displayYear}.
      8. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
      9. You MUST focus on ${displayYear} data while presenting historical context where relevant.
      10. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.
      
      Create a comprehensive, professional market report for ${countryName} for the year ${displayYear} following this EXACT template and using clear, complete responses rather than bulleted lists (except where indicated).
      `;
    }

    private async extractSectionsToHtml(markdown: string): Promise<MarketReportSection[]> {
        const sections: MarketReportSection[] = [];

        // Split the document by "## " (main sections)
        const parts = markdown.split(/^##\s+/m).filter(Boolean);

        for (const part of parts) {
            // Get the first line as the title
            const [rawTitle, ...rest] = part.split("\n");
            const title = this.removeNumbering(rawTitle.trim());

            const body = rest.join("\n").trim();

            const subsections: { title: string; htmlContent: string }[] = [];

            // Split this section by "### " subsections
            const subParts = body.split(/^###\s+/m);

            let mainContent = "";
            for (let i = 0; i < subParts.length; i++) {
                const subPart = subParts[i].trim();

                if (!subPart) continue;

                if (i === 0) {
                    // Content before any subsections
                    mainContent = subPart;
                } else {
                    // Subsection
                    const [subTitleRaw, ...subRest] = subPart.split("\n");
                    const subTitle = this.removeNumbering(subTitleRaw.trim());
                    const subBody = subRest.join("\n").trim();
                    const subHtml = await this.markdownToHtml(subBody);

                    subsections.push({
                        title: subTitle,
                        htmlContent: subHtml
                    });
                }
            }

            const htmlContent = mainContent ? await this.markdownToHtml(mainContent) : undefined;

            sections.push({
                title,
                htmlContent,
                subsections: subsections.length ? subsections : undefined
            });
        }

        return sections;
    }

    private removeNumbering(title: string): string {
        return title
            .replace(/^#+\s*/, '')                            // Remove leading # symbols
            .replace(/^\d+(\.\d+)*\.?\s*/, '')                // Remove any numbering patterns with optional dots & spaces
            .trim();
    }

    private async markdownToHtml(markdown: string): Promise<string> {
        const md = new MarkdownIt();
        return md.render(markdown);
    }

    private getSectionKey(title: string): string {
        switch (title.toLowerCase()) {
            case "summary statistics":
                return "Snapshot";
            case "overview of financial system":
                return "Financial System Overview";
            case "fixed income markets":
                return "Fixed Income Markets";
            case "foreign exchange":
                return "Foreign Exchange";
            case "derivatives":
                return "Derivatives";
            case "participation of foreign investors and issuers":
                return "Foreign Participation";
            case "clearing and settlement":
                return "Clearing and Settlement";
            case "investment taxation":
                return "Investment Taxation";
            case "key contacts":
                return "Key Contacts";
            default:
                return title.toLowerCase().replace(/\s+/g, '_');
        }
    }

    private getSubsectionTitle(subsectionKey: string): string {
        switch (subsectionKey) {
            case "snapshot":
                return "Snapshot";
            case "financial_system_overview":
                return "Financial System Overview";
            case "fixed_income_markets":
                return "Fixed Income Markets";
            case "foreign_exchange":
                return "Foreign Exchange";
            case "derivatives":
                return "Derivatives";
            case "foreign_participation":
                return "Foreign Participation";
            case "clearing_and_settlement":
                return "Clearing and Settlement";
            case "investment_taxation":
                return "Investment Taxation";
            case "key_contacts":
                return "Key Contacts";
            case "bank_non_bank_financial_sector":
                return "Bank and Non-Bank Financial Sector";
            case "capital_market":
                return "Capital Market";
            case "government_securities":
                return "Government Securities";
            case "non_central_government_issuance":
                return "Non-Central Government Issuance";
            case "secondary_market":
                return "Secondary Market";
            default:
                return subsectionKey.replace(/_/g, ' ');
        }
    }

    private generateSubsectionPrompt(sectionKey: string, subsectionKey: string, countryName: string, year: number): string {
        const displayYear = year || new Date().getFullYear();
        const sectionTitle = this.getSectionTitle(sectionKey);
        const subsectionTitle = this.getSubsectionTitle(subsectionKey);

        return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${subsectionTitle}" subsection within the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

Focus specifically on the ${subsectionTitle} subsection and provide comprehensive, up-to-date information that would be relevant for ${displayYear}.

## ${subsectionTitle}

[Generate detailed content for the ${subsectionTitle} subsection within the context of ${sectionTitle}]

## CRITICAL REQUIREMENTS:

1. You MUST focus ONLY on the ${subsectionTitle} subsection
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}
4. You MUST maintain a professional financial analysis tone
5. You MUST include specific financial figures and market metrics for ${displayYear}
6. You MUST reference credible sources for data
7. You MUST ensure all information is current and relevant to ${countryName} in ${displayYear}
8. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}]
9. You MUST focus on ${displayYear} data while presenting historical context where relevant
10. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data
11. You MUST keep the content focused and concise for a subsection

Generate ONLY the ${subsectionTitle} subsection content for ${countryName} for the year ${displayYear}.`;
    }
} 