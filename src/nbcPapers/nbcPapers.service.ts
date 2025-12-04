import { Injectable } from '@nestjs/common';
import { MongodbService } from '../mongodb/mongodb.service';
import { CreateNbcPaperDto } from './createNbcPaper.dto';
import { UpdateNbcPaperDto } from './update-nbc-paper.dto';
import { tool } from "@langchain/core/tools";
import z from 'zod';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { PromptTemplate } from "@langchain/core/prompts";
import * as MarkdownIt from 'markdown-it';
import { ObjectId } from 'mongodb';

export interface Section {
    title: string;
    htmlContent: string;
}

const prompt = (data: CreateNbcPaperDto, context: any) => `
You are an expert financial analyst and credit structuring specialist for InfraCredit. You MUST follow the EXACT template structure provided below. Do not deviate from this format.

IMPORTANT: You MUST use the EXACT section headers and structure shown below. Start each section with the exact header format (### 1., ### 2., etc.) and follow the table formats precisely.

${context ? 'CONTEXT DATA AVAILABLE: Use the provided context data to inform your analysis.' : 'NO CONTEXT DATA: Generate realistic, industry-standard data based on the company name, sector, and transaction type. Use your knowledge of typical Nigerian infrastructure projects and financial structures to create comprehensive, professional content.'}

## TEMPLATE TO FOLLOW EXACTLY:

### 1. Document Header & Summary Table

**Project Summary Table:**
| Field | Details |
|-------|---------|
| Deal Name | [Create professional deal name based on ${data.companyName} and project scope] |
| Reference Number | NB[XXX] (use sequential numbering) |
| Sector | [${context ? 'Determine from context data and project details' : 'Infer from company name and project details, or use common Nigerian infrastructure sectors (Power, Transportation, Water, Telecommunications, etc.)'}] |
| Transaction Type | ${data.transactionType} |
| Circulation Date | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} |
| Structuring Leads | ${data.structuringLeads} |
| Sponsors | ${data.sponsors} |
| Portfolio Exposure (NGN) | [${context ? 'Calculate based on existing sector exposure if available' : 'Generate realistic sector exposure figures (typically NGN 5-50 billion for infrastructure projects)'}] |
| Total Limit | [${context ? 'Specify requested amount and sector aggregate' : 'Generate realistic transaction size based on sector and company profile (typically NGN 1-20 billion)'}] |
| Beneficiary | ${data.companyName} |
| Tenor | [${context ? 'Specify loan tenor from project details' : 'Generate appropriate tenor for sector (typically 5-15 years for infrastructure)'}] |
| Initial E&S Categorisation | [${context ? 'Determine environmental and social risk category' : 'Assign realistic E&S category (A, B, or C) based on project type and sector'}] |
| Policy Exceptions | [${context ? 'List any applicable policy exceptions or state "Not applicable"' : 'Generate realistic policy considerations or state "Not applicable"'}] |

### 2. Company & Project Overview

[Write 800-1000 words covering:
${context ?
        '- Company background using context data' :
        '- Company background (generate realistic company history, typically 5-20 years in operation)'
    }
- Project details using ${data.projectDetails}
${context ?
        '- Financial structure using context data' :
        '- Financial structure (generate realistic capital structure, debt-to-equity ratios typical for the sector)'
    }
${!context ? '- Generate realistic project scope, implementation timeline, and key milestones' : ''}
${!context ? '- Include typical project costs and financing arrangements for the sector' : ''}
]

### 3. Transaction Overview

[Write 600-800 words covering:
- Transaction mechanics for ${data.transactionType}
- Risk mitigation strategies
- Use of proceeds
${!context ? '- Generate realistic transaction structure, security arrangements, and repayment terms' : ''}
${!context ? '- Include typical guarantee structures and collateral arrangements' : ''}
]

### 4. Market Overview

[Write 800-1000 words covering:
${context ?
        '- Sector context using available data' :
        '- Nigerian infrastructure sector context (generate current market conditions, growth prospects)'
    }
- Macroeconomic environment in Nigeria
- Competitive landscape
${!context ? '- Generate realistic market size, key players, and growth drivers for the sector' : ''}
${!context ? '- Include regulatory environment and government initiatives relevant to the sector' : ''}
]

### 5. Key Strengths & Value Proposition

[Write 400-500 words highlighting:
${context ?
        '- Investment rationale based on context data' :
        '- Investment rationale (generate realistic competitive advantages, market position)'
    }
- Value proposition for InfraCredit
${!context ? '- Generate realistic management team strengths, operational capabilities' : ''}
${!context ? '- Include strategic partnerships and technical expertise' : ''}
]

### 6. Critical Areas for Due Diligence

[Write 500-600 words covering:
- Technical due diligence areas
- Financial due diligence requirements
- Legal due diligence priorities
- Governance due diligence focus areas
${!context ? '- Generate realistic due diligence requirements specific to the sector and transaction type' : ''}
${!context ? '- Include typical documentation requirements and third-party assessments needed' : ''}
]

### 7. Development Impact

[Write 400-500 words covering:
- SDG alignment (identify relevant SDGs for the sector)
- Economic impact projections
- Social and environmental impact assessment
${!context ? '- Generate realistic development impact metrics (jobs created, beneficiaries served, etc.)' : ''}
${!context ? '- Include typical infrastructure development outcomes for Nigeria' : ''}
]

### 8. Initial Risk Assessment

[Write 300-400 words covering:
- E&S categorization rationale
- Policy exceptions analysis
- Preliminary risk rating
${!context ? '- Generate realistic risk assessment based on sector, company profile, and transaction type' : ''}
${!context ? '- Include typical risk factors and mitigation measures for the sector' : ''}
]

### 9. Preliminary KYC Report

**Organisation Profile Table:**
| Field | Details |
|-------|---------|
| Name of Institution | ${data.companyName} |
| Date of Incorporation/Establishment | [${context ? 'Use context data' : 'Generate realistic incorporation date (typically 5-20 years ago)'}] |
| Nature of Business | [${context ? 'Use context data for detailed business description' : 'Generate comprehensive business description based on company name and sector'}] |

**Governance/Shareholding Table:**
| Field | Details |
|-------|---------|
| Directors | [${context ? 'Use context data' : 'Generate realistic director names and positions (typically 5-9 directors with relevant industry experience)'}] |
| Shareholding/Ownership Structure | [${context ? 'Use context data' : 'Generate realistic share capital structure (authorized/issued capital, major shareholders)'}] |

**Flag Report Table:**
| Field | Status |
|-------|--------|
| Politically Exposed Person(s) | [${context ? 'Use context screening results' : 'Generate realistic PEP screening results (typically "None identified" or list specific concerns)'}] |
| Credit History | [${context ? 'Use context credit assessment' : 'Generate realistic credit assessment (typically "Satisfactory" or "Requires monitoring")'}] |
| Flags | [${context ? 'Use context screening results' : 'Generate realistic screening results (typically "No material flags" or list specific issues)'}] |

**KYC Documentation Status:**
| Field | Status |
|-------|--------|
| Documents provided for the KYC | [${context ? 'List from context data' : 'Generate realistic document list (Certificate of Incorporation, Memorandum & Articles, Board Resolutions, Financial Statements, etc.)'}] |
| Date | [Current date] |

**Commentary/Recommendation:**
[${context ? 'Generate specific recommendations based on context' : 'Generate realistic KYC recommendations and any outstanding requirements'}]

## CRITICAL REQUIREMENTS:

1. You MUST use the EXACT section headers: "### 1.", "### 2.", etc.
2. You MUST include ALL tables with the EXACT format shown above
3. ${context ? 'You MUST use the context data provided to inform your analysis' : 'You MUST generate realistic, industry-appropriate data that reflects typical Nigerian infrastructure projects'}
4. You MUST reference ${data.projectDetails} in the relevant sections
5. You MUST maintain professional institutional tone throughout
6. You MUST include specific financial figures and metrics ${context ? 'where available' : '(generate realistic figures based on sector benchmarks)'}
7. You MUST flag missing information as [TBD - Requires Due Diligence]
8. ${!context ? 'You MUST ensure all generated data is realistic and consistent with Nigerian infrastructure sector standards' : ''}
9. ${!context ? 'You MUST use appropriate Nigerian business terminology and regulatory references' : ''}

**Context Data Available**: ${context || 'No context data provided - generating comprehensive analysis based on company name, sector, and transaction type'}
**Transaction Details**: ${data}

Now generate the NBC Paper following this EXACT template structure. Do not skip any sections or deviate from the format.
${!context ? '\n\nSince no context data is available, generate realistic, comprehensive content that demonstrates thorough analysis and due diligence appropriate for InfraCredit\'s investment standards. Use industry knowledge to create professional, detailed content that would be suitable for actual investment committee review.' : ''}
`;

@Injectable()
export class NbcPapersService {
    constructor(private readonly mongodbService: MongodbService) { }

    private collectionName: string = "nbc_papers";

    async getNbcPaperById(id: string, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);
        const existingPaper = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingPaper) {
            throw new Error('NBC paper not found');
        }
        if (existingPaper.createdBy !== user.sub && !existingPaper?.collaborators?.some((collaborator: any) => collaborator.userId === user.sub)) {
            return {
                success: false,
                message: 'User is not the author of the market report',
                status: 403
            }
        }
        return collection.findOne({ _id: new ObjectId(id) });
    }

    async getNbcPapers() {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.find({}).toArray();
    }

    async updateNbcPaper(id: string, body: any, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the NBC paper exists
        const existingPaper = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingPaper) {
            throw new Error('NBC paper not found');
        }
        const { _id, ...dataWithoutId } = existingPaper;
        const updateData: any = {
            ...dataWithoutId,
            ...body,
            updatedAt: new Date(),
            lastModifiedBy: user.sub,
            lastModifiedByEmail: user.email,
        };
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new Error('NBC paper not found');
        }
       
        const historyCollection = await this.mongodbService.connect("history");
        const history = await historyCollection.findOne({ entityId: id });
        if(!history){
            throw new Error('History not found');
        }
        console.log(history);
        const historyUpdateData = {
            action: "updated_nbc_paper",
            ...history,
            collaborators: updateData.collaborators,
            metadata: {
                ...history.metadata,
                status: updateData.status,
                updatedAt: new Date(),
                lastModifiedBy: user.sub,
                lastModifiedByEmail: user.email,
            }
        }
        if(updateData.collaborators){
            historyUpdateData["collaborators"] = updateData.collaborators;
        }
        const {_id:historyId, ...rest} = history;
        await historyCollection.updateOne({ _id: historyId }, {
            $set: {
                ...historyUpdateData,
            }
        });
        return {
            success: true,
            message: 'NBC paper updated successfully',
            updatedAt: new Date(),
            lastModifiedBy: user ? user.email : null
        };
    }

    async updateNbcPaperSection(id: string, sectionKey: string, sectionData: { title: string; htmlContent: string }, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);

        // Check if the NBC paper exists
        const existingPaper = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingPaper) {
            throw new Error('NBC paper not found');
        }
        if (existingPaper.createdBy !== user.sub) {
            return {
                success: false,
                message: 'User is not the author of the NBC paper',
                status: 403
            }
        }

        // Check if the section exists
        const sectionExists = existingPaper.content.some((section: any) => section.title === this.getSectionTitle(sectionKey));
        if (!sectionExists) {
            throw new Error(`Section "${sectionKey}" not found in NBC paper`);
        }

        // Find and update the specific section
        const updatedContent = existingPaper.content.map((section: any) => {
            if (section.title === this.getSectionTitle(sectionKey)) {
                return {
                    ...section,
                    title: sectionData.title,
                    htmlContent: sectionData.htmlContent
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
            throw new Error('NBC paper not found');
        }

        return {
            success: true,
            message: `Section "${sectionKey}" updated successfully`,
            updatedAt: new Date(),
            lastModifiedBy: user ? user.email : null
        };
    }

    private getSectionTitle(sectionKey: string) {
        switch (sectionKey) {
            case "summary_table":
                return "Document Header & Summary Table";
            case "company_overview":
                return "Company & Project Overview";
            case "transaction_overview":
                return "Transaction Overview";
            case "market_overview":
                return "Market Overview";
            case "key_strengths_value_proposition":
                return "Key Strengths & Value Proposition";
            case "critical_areas_due_diligence":
                return "Critical Areas for Due Diligence";
            case "development_impact":
                return "Development Impact";
            case "initial_risk_assessment":
                return "Initial Risk Assessment";
            case "preliminary_kyc_report":
                return "Preliminary KYC Report";
            case "final_kyc_report":
                return "Final KYC Report";
            case "final_kyc_report_table":
                return "Final KYC Report Table";
            default:
                return sectionKey;
        }
    }
    async deleteNbcPaper(id: string, user?: any) {
        const collection = await this.mongodbService.connect(this.collectionName);
        const existingPaper = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingPaper) {
            throw new Error('NBC paper not found');
        }

        await collection.deleteOne({ _id: new ObjectId(id) });

        const historyCollection = await this.mongodbService.connect("history");
        await historyCollection.deleteOne({ entityId: id });


    }
    async getCompanyInfo(nbcPaper: CreateNbcPaperDto) {
        const collection = await this.mongodbService.connect("documents");
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-small",
            apiKey: process.env.OPENAI_API_KEY,
        });

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection: collection,
            indexName: "vector_index",
            textKey: "text",
            embeddingKey: "embedding",
        });

        const retrieveTool = tool(
            async ({ companyName }) => {
                const semanticQuery = `Provide all the information regarding ${companyName}`;
                console.log("Searching with query:", semanticQuery);

                const results = await vectorStore.similaritySearch(semanticQuery, 40);

                if (!results.length) {
                    return `No information found for ${companyName}.`;
                }

                return results.map(doc => doc.pageContent).join("\n---\n");
            },
            {
                name: "retrieve_company_info",
                description: "Use this tool whenever the user asks a question about a company's background, history, incorporation date, governance, or ownership structure. Input must include the company name.",
                schema: z.object({
                    companyName: z.string(),
                }),
            },
        );

        const tools = [retrieveTool];
        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            streaming: true,
        });

        const agent = createReactAgent({
            llm,
            tools,
        });

        const agentResult = await agent.invoke({
            messages: [
                {
                    role: "system",
                    content: "You are a financial analyst who MUST follow templates exactly. Always use the exact section headers and table formats provided. Never deviate from the specified structure."
                },
                {
                    role: "user",
                    content: `Give me all the information regarding ${nbcPaper.companyName}`
                }
            ],
        });
        return agentResult;
    }

    async createNbcPaper(nbcPaper: CreateNbcPaperDto, user?: any) {
        const agentResult = await this.getCompanyInfo(nbcPaper);
        const lastToolMessage = agentResult.messages.at(-2)?.content as string;
        const docs = lastToolMessage as string;

        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            streaming: true,
        });

        const question = PromptTemplate.fromTemplate(prompt(nbcPaper, docs));
        const ragChain = question.pipe(llm);

        const response = await ragChain.invoke({
            context: docs,
            data: nbcPaper,
        });

        const parsedResponse = await this.extractSectionsToHtml(response.content.toString());
        const nbcPaperCollection = await this.mongodbService.connect(this.collectionName);

        const content: any[] = [];
        parsedResponse.forEach(section => {
            content.push({
                title: section.title,
                htmlContent: section.htmlContent
            });
        });
        const userCollection = await this.mongodbService.connect("users");
        const userData = await userCollection.findOne({ _id: new ObjectId(user.sub) });
        const author = `${userData?.firstName} ${userData?.lastName} (${userData?.email})`;


        const nbcPaperData = {
            title: `NBC Paper for ${nbcPaper.companyName} - ${nbcPaper.transactionType}`,
            createdAt: new Date(),
            author: author,
            createdBy: userData?._id.toString(),
            companyName: nbcPaper.companyName,
            transactionType: nbcPaper.transactionType,
            structuringLeads: nbcPaper.structuringLeads,
            sponsors: nbcPaper.sponsors,
            projectDetails: nbcPaper.projectDetails,
            content,
            status: "draft",
            htmlContent: response.content.toString(),
            updatedAt: new Date()
        };

        const newNbcPaper = await nbcPaperCollection.insertOne(nbcPaperData);
        const historyCollection = await this.mongodbService.connect("history");
        await historyCollection.insertOne({
            user: user.sub,
            action: "created_nbc_paper",
            entityType: "NbcPaper",
            entityId: newNbcPaper.insertedId.toString(),
            createdBy: userData?._id.toString(),
            metadata: {
                author: nbcPaperData.author,
                name: nbcPaperData.title,
                companyName: nbcPaperData.companyName,
                transactionType: nbcPaperData.transactionType,
                status: nbcPaperData.status,
                title: nbcPaperData.title,
                createdAt: nbcPaperData.createdAt,
                updatedAt: nbcPaperData.updatedAt
            }
        });

        return {
            success: true, nbcPaper: {
                id: newNbcPaper.insertedId,
                createdAt: nbcPaperData.createdAt,
                updatedAt: nbcPaperData.updatedAt,
                author: nbcPaperData.author
            }
        };
    }

    private async extractSectionsToHtml(markdown: string): Promise<Section[]> {
        const sections: Section[] = [];

        // Updated regex to capture both numbered (### 1.) and named (###) sections
        const regex = /###\s*(?:\d+\.\s*)?(.+?)(?=\n###|$)/gs;

        let match: RegExpExecArray | null;
        while ((match = regex.exec(markdown)) !== null) {
            const fullMatch = match[0];
            const title = match[1].split("\n")[0].trim();

            // Extract the body content, excluding the title line
            const lines = fullMatch.split("\n");
            const bodyLines = lines.slice(1); // Skip the title line
            const body = bodyLines.join("\n").trim();

            // Only process sections with actual content
            if (body && body.length > 0) {
                const html = await this.markdownToHtml(body);

                sections.push({
                    title,
                    htmlContent: html
                });
            }
        }

        // If no sections found with ### headers, try ## headers as fallback
        if (sections.length === 0) {
            const fallbackRegex = /##\s*(?:\d+\.\s*)?(.+?)(?=\n##|$)/gs;

            while ((match = fallbackRegex.exec(markdown)) !== null) {
                const fullMatch = match[0];
                const title = match[1].split("\n")[0].trim();
                const lines = fullMatch.split("\n");
                const bodyLines = lines.slice(1);
                const body = bodyLines.join("\n").trim();

                if (body && body.length > 0) {
                    const html = await this.markdownToHtml(body);

                    sections.push({
                        title,
                        htmlContent: html
                    });
                }
            }
        }

        return sections;
    }

    private async markdownToHtml(markdown: string): Promise<string> {
        const md = new MarkdownIt();
        return md.render(markdown);
    }

    async regenerateNbcPaper(id: string, sectionKey: string, nbcPaper: CreateNbcPaperDto, user?: any) {
        // Get the existing NBC Paper
        const nbcPaperCollection = await this.mongodbService.connect(this.collectionName);
        const existingPaper = await nbcPaperCollection.findOne({ _id: new ObjectId(id) });

        if (!existingPaper) {
            throw new Error('NBC Paper not found');
        }
        if (existingPaper.createdBy !== user.sub) {
            return {
                success: false,
                message: 'User is not the author of the NBC paper',
                status: 403
            }
        }
        const agentResult = await this.getCompanyInfo(nbcPaper);
        const lastToolMessage = agentResult.messages.at(-2)?.content as string;
        const docs = lastToolMessage as string;

        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            streaming: true,
        });
        const sectionPrompt = this.createSectionPrompt(sectionKey, nbcPaper, docs);
        const question = PromptTemplate.fromTemplate(sectionPrompt);
        const ragChain = question.pipe(llm);

        const response = await ragChain.invoke({
            context: docs,
            data: nbcPaper,
        });

        const regeneratedSection = await this.extractSectionsToHtml(response.content.toString());


        const getDescriptiveTitle = (section: string) => {
            switch (section) {
                case "summary_table":
                    return "Document Header & Summary Table";
                case "company_overview":
                    return "Company & Project Overview";
                case "transaction_overview":
                    return "Transaction Overview";
                case "market_overview":
                    return "Market Overview";
                default:
                    return section;
            }
        };

        // Update the specific section in the content array
        const updatedContent = [...existingPaper.content];
        const sectionIndex = updatedContent.findIndex(s => s.title === getDescriptiveTitle(sectionKey));

        if (sectionIndex !== -1) {
            updatedContent[sectionIndex] = {
                title: getDescriptiveTitle(sectionKey),
                htmlContent: regeneratedSection[0].htmlContent
            };
        } else {
            // If section not found, add it to the array
            updatedContent.push({
                title: getDescriptiveTitle(sectionKey),
                htmlContent: regeneratedSection[0].htmlContent
            });
        }

        const updateData: any = {
            content: updatedContent,
            updatedAt: new Date()
        };

        // Add user tracking if available
        if (user) {
            updateData.lastModifiedBy = user.sub;
            updateData.lastModifiedByEmail = user.email;
        }

        const result = await nbcPaperCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return {
            success: true,
            message: `Section "${sectionKey}" regenerated successfully`,
            regeneratedSection: regeneratedSection[0],
            result,
            lastModifiedBy: user ? user.email : null
        };
    }

    private createSectionPrompt(section: string, data: CreateNbcPaperDto, docs: string): string {
        const sectionTemplates = {
            "summary_table": `
You are regenerating Section 1 (Document Header & Summary Table) of an NBC Paper. Follow the EXACT format below:

### 1. Document Header & Summary Table

| Field | Details |
|-------|---------|
| Deal Name | [Create professional deal name based on ${data.companyName} and project scope] |
| Reference Number | NB[XXX] (use sequential numbering) |
| Sector | [Determine from context data and project details] |
| Transaction Type | ${data.transactionType} |
| Circulation Date | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} |
| Structuring Leads | ${data.structuringLeads} |
| Sponsors | ${data.sponsors} |
| Portfolio Exposure (NGN) | [Calculate based on existing sector exposure if available] |
| Total Limit | [Specify requested amount and sector aggregate] |
| Beneficiary | ${data.companyName} |
| Tenor | [Specify loan tenor from project details] |
| Initial E&S Categorisation | [Determine environmental and social risk category] |
| Policy Exceptions | [List any applicable policy exceptions or state "Not applicable"] |

Use the context data to inform your analysis. Generate ONLY this section with the exact format shown above.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "company_overview": `
You are regenerating Section 2 (Company & Project Overview) of an NBC Paper. Write 800-1000 words covering:

### 2. Company & Project Overview

**Company Background:**
- Incorporation details and business registration
- Core business activities and sector positioning
- Ownership structure and parent company relationships
- Management team profiles with specific experience metrics
- Company website and digital presence

**Project Details:**
- Detailed project description using ${data.projectDetails}
- Geographic scope and target beneficiaries
- Technical specifications (capacity, connections, infrastructure)
- Implementation timeline and phases
- Strategic importance and market positioning

**Financial Structure:**
- Total project cost breakdown
- Proposed debt-to-equity ratio
- Funding sources and capital structure
- Grant support and concessional financing
- Revenue projections and growth trajectory

Use the context data to inform your analysis. Generate ONLY this section.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "transaction_overview": `
You are regenerating Section 3 (Transaction Overview) of an NBC Paper. Write 600-800 words covering:

### 3. Transaction Overview

**Transaction Mechanics:**
- Comprehensive description of ${data.transactionType}
- Security package and collateral arrangements
- Tenor and repayment structure
- Interest rate framework and pricing
- Guarantee conditions and triggers

**Risk Mitigation:**
- Security trustee arrangements
- First-loss provisions and risk-sharing mechanisms
- Blended finance structures
- Government support and regulatory backing

**Use of Proceeds:**
- Detailed allocation of funds
- Construction and development costs
- Working capital requirements
- Contingency provisions

Use the context data to inform your analysis. Generate ONLY this section.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "market_overview": `
You are regenerating Section 4 (Market Overview) of an NBC Paper. Write 800-1000 words covering:

### 4. Market Overview

**Sector Context:**
- Market size and growth potential
- Supply-demand dynamics
- Regulatory environment and government policy
- Infrastructure gaps and opportunities

**Macroeconomic Environment:**
- Economic indicators relevant to the sector
- Currency and foreign exchange considerations
- Inflation and interest rate environment
- Government fiscal position and support

**Competitive Landscape:**
- Key market players and positioning
- Technological trends and innovations
- Barriers to entry and competitive advantages
- Market consolidation trends

Use the context data to inform your analysis. Generate ONLY this section.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "key_strengths_value_proposition": `
You are regenerating Section 5 (Key Strengths & Value Proposition) of an NBC Paper. Write 400-500 words highlighting:

### 5. Key Strengths & Value Proposition

- Essential service provision and social impact
- Scalability and replication potential
- Cost advantages and operational efficiency
- Asset quality and durability
- Strategic partnerships and support
- Environmental and sustainability benefits
- Regulatory alignment and government backing

Use the context data to inform your analysis. Generate ONLY this section.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "critical_areas_due_diligence": `
You are regenerating Section 6 (Critical Areas for Due Diligence) of an NBC Paper. Write 500-600 words covering:

### 6. Critical Areas for Due Diligence

**Technical & Commercial:**
- Technical feasibility and design validation
- Commercial viability and market assessment
- Revenue model and pricing strategy
- Operational capacity and management systems

**Financial & Risk:**
- Financial projections and cash flow analysis
- Debt service capacity and coverage ratios
- Foreign exchange risk and mitigation
- Procurement and supply chain risk

**Legal & Regulatory:**
- Regulatory compliance and approvals
- Contract documentation and terms
- Land rights and permits
- Environmental and social compliance

**Governance & Management:**
- Corporate governance structures
- Board composition and effectiveness
- Management capability and track record
- Succession planning and key person risk

Use the context data to inform your analysis. Generate ONLY this section.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "development_impact": `
You are regenerating Section 7 (Development Impact) of an NBC Paper. Write 400-500 words covering:

### 7. Development Impact

**SDG Alignment:**
- Specific SDG targets and indicators
- Measurable impact metrics
- Beneficiary analysis and reach
- Long-term sustainability outcomes

**Economic Impact:**
- Job creation (direct and indirect)
- Local economic multiplier effects
- Skills development and capacity building
- Supply chain and vendor development

**Social & Environmental Impact:**
- Community development outcomes
- Environmental benefits and carbon impact
- Gender and inclusion considerations
- Health and safety improvements

Use the context data to inform your analysis. Generate ONLY this section.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "initial_risk_assessment": `
You are regenerating Section 8 (Initial Risk Assessment) of an NBC Paper. Write 300-400 words covering:

### 8. Initial Risk Assessment

- Environmental & Social (E&S) categorization
- Policy exceptions and regulatory considerations
- Risk rating and mitigation strategies
- Monitoring and reporting requirements

Use the context data to inform your analysis. Generate ONLY this section.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`,

            "preliminary_kyc_report": `
You are regenerating Section 9 (Preliminary KYC Report) of an NBC Paper. Follow the EXACT format below:

### 9. Preliminary KYC Report

Organisation Profile Table:
| Field | Details |
|-------|---------|
| Name of Institution | ${data.companyName} |
| Date of Incorporation/Establishment | [Generate incorporation details] |
| Nature of Business | [Generate detailed business description] |

Governance/Shareholding Table:
| Field | Details |
|-------|---------|
| Directors | [Generate director names and positions] |
| Shareholding/Ownership Structure | [Generate share capital structure] |

Flag Report Table:
| Field | Status |
|-------|--------|
| Politically Exposed Person(s) | [Generate screening results] |
| Credit History | [Generate credit assessment] |
| Flags | [Generate screening results] |

KYC Documentation Status:
| Field | Status |
|-------|--------|
| Documents provided for the KYC | [List provided documents] |
| Date | [Current date] |

Commentary/Recommendation:
[Generate specific recommendations]

Use the context data to inform your analysis. Generate ONLY this section with the exact format shown above.
**Context Data**: ${docs}
**Transaction Details**: ${data}
`
        };

        return sectionTemplates[section] || `Generate section ${section} of the NBC Paper using the context data and transaction details provided.`;
    }
}
