import { Injectable } from '@nestjs/common';
import { MongodbService } from '../mongodb/mongodb.service';
import { CreateMarketReportDto } from './create-market-report.dto';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import * as MarkdownIt from 'markdown-it';
import { ObjectId } from 'mongodb';
import { UpdateMarketReportSectionDto } from './update-market-report-section.dto';

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

    async getMarketReportById(id: string) {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.findOne({ _id: new ObjectId(id) });
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
            message: `Section "${this.getSectionTitle(sectionKey)}" updated successfully`,
            updatedAt: new Date(),
            lastModifiedBy: user ? user.email : null
        };
    }

    private getSectionTitle(sectionKey: string): string {
        switch (sectionKey) {
            case "snapshot":
                return "Summary Statistics";
            case "overview_of_financial_system":
                return "Overview of Financial System";
            case "fixed_income_markets":
                return "Fixed Income Markets";
            case "foreign_exchange":
                return "Foreign Exchange";
            case "derivatives":
                return "Derivatives";
            case "foreign_participation":
                return "Participation of Foreign Investors and Issuers";
            case "clearing_and_settlement":
                return "Clearing and Settlement";
            case "investment_taxation":
                return "Investment Taxation";
            case "key_contacts":
                return "Key Contacts";
            default:
                return sectionKey.replace(/_/g, ' ');
        }
    }

    async updateMarketReportSubsection(id: string, sectionKey: string, subsectionKey: string, subsectionData: { title: string; htmlContent: string }) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
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

    async removeSubsectionFromSection(id: string, sectionKey: string, subsectionTitle: string) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the market report exists
        const existingReport = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingReport) {
            throw new Error('Market report not found');
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
        console.log(parsedResponse);
        const regeneratedSection = parsedResponse.find(section => section.title === sectionTitle);

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

        return `You are an expert financial analyst specializing in African fixed income markets. Regenerate ONLY the "${sectionTitle}" section for ${countryName} for the year ${displayYear}.

Focus specifically on the ${sectionTitle} section and provide comprehensive, up-to-date information that would be relevant for ${displayYear}.

## ${sectionTitle}

[Generate detailed content for the ${sectionTitle} section.

## CRITICAL REQUIREMENTS:

1. You MUST focus ONLY on the ${sectionTitle} section
2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}
3. You MUST use actual official languages, currencies, and institutional names for ${countryName}
4. You MUST maintain a professional financial analysis tone
5. You MUST include specific financial figures and market metrics for ${displayYear}
6. You MUST reference credible sources for data
7. You MUST ensure all information is current and relevant to ${countryName} in ${displayYear}
8. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}]
9. You MUST focus on ${displayYear} data while presenting historical context where relevant
10. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data

Generate ONLY the ${sectionTitle} section content for ${countryName} for the year ${displayYear}.`;
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

        // Determine author information
        let author = "InfraCredit"; // Default author
        if (user && user.sub) {
            const userCollection = await this.mongodbService.connect("users");
            const userData = await userCollection.findOne({ _id: new ObjectId(user.sub) });
            if (userData) {
                author = `${userData.firstName} ${userData.lastName}`;
            }
        }

        const marketReportData = {
            title: `African Fixed Income Market Guide - ${createMarketReportDto.countryName} (${year})`,
            countryName: createMarketReportDto.countryName,
            year: year,
            description: createMarketReportDto.description || `Market report for ${createMarketReportDto.countryName} - ${year}`,
            author: author,
            createdBy: user ? user.sub : null, // User ID from JWT
            content,
            status: "draft",
            htmlContent: response.content.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const newMarketReport = await collection.insertOne(marketReportData);
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
      | **Sources** | [List credible sources like World Bank, IMF, Central Bank of ${countryName}] |
      
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
      2. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
      3. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
      4. You MUST maintain a professional financial analysis tone throughout.
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
            case "bank_and_non_bank_financial_sector":
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