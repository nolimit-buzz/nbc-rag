import { Injectable } from '@nestjs/common';
import { MongodbService } from '../mongodb/mongodb.service';
import { CreateNbcPaperDto } from './create-nbc-paper.dto';
import { tool } from "@langchain/core/tools";
import z from 'zod';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { PromptTemplate } from "@langchain/core/prompts";
import { marked } from 'marked';
import { ObjectId } from 'mongodb';

export interface Section {
    title: string;
    html: string;
}

const prompt = (data: CreateNbcPaperDto, context: any) => `
You are an expert financial analyst and credit structuring specialist for InfraCredit. You MUST follow the EXACT template structure provided below. Do not deviate from this format.

IMPORTANT: You MUST use the EXACT section headers and structure shown below. Start each section with the exact header format (### 1., ### 2., etc.) and follow the table formats precisely.

## TEMPLATE TO FOLLOW EXACTLY:

### 1. Document Header & Summary Table

**Project Summary Table:**
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

### 2. Company & Project Overview

[Write 800-1000 words covering company background, project details, and financial structure using the context data and ${data.projectDetails}]

### 3. Transaction Overview

[Write 600-800 words covering transaction mechanics, risk mitigation, and use of proceeds for ${data.transactionType}]

### 4. Market Overview

[Write 800-1000 words covering sector context, macroeconomic environment, and competitive landscape]

### 5. Key Strengths & Value Proposition

[Write 400-500 words highlighting investment rationale and value proposition]

### 6. Critical Areas for Due Diligence

[Write 500-600 words covering technical, financial, legal, and governance due diligence areas]

### 7. Development Impact

[Write 400-500 words covering SDG alignment, economic impact, and social/environmental impact]

### 8. Initial Risk Assessment

[Write 300-400 words covering E&S categorization, policy exceptions, and risk rating]

### 9. Preliminary KYC Report

**Organisation Profile Table:**
| Field | Details |
|-------|---------|
| Name of Institution | ${data.companyName} |
| Date of Incorporation/Establishment | [Generate incorporation details] |
| Nature of Business | [Generate detailed business description] |

**Governance/Shareholding Table:**
| Field | Details |
|-------|---------|
| Directors | [Generate director names and positions] |
| Shareholding/Ownership Structure | [Generate share capital structure] |

**Flag Report Table:**
| Field | Status |
|-------|--------|
| Politically Exposed Person(s) | [Generate screening results] |
| Credit History | [Generate credit assessment] |
| Flags | [Generate screening results] |

**KYC Documentation Status:**
| Field | Status |
|-------|--------|
| Documents provided for the KYC | [List provided documents] |
| Date | [Current date] |

**Commentary/Recommendation:**
[Generate specific recommendations]

## CRITICAL REQUIREMENTS:

1. You MUST use the EXACT section headers: "### 1.", "### 2.", etc.
2. You MUST include ALL tables with the EXACT format shown above
3. You MUST use the context data provided to inform your analysis
4. You MUST reference ${data.projectDetails} in the relevant sections
5. You MUST maintain professional institutional tone throughout
6. You MUST include specific financial figures and metrics where available
7. You MUST flag missing information as [TBD - Requires Due Diligence]

**Context Data Available**: ${context}
**Transaction Details**: ${data}

Now generate the NBC Paper following this EXACT template structure. Do not skip any sections or deviate from the format.
`;

@Injectable()
export class NbcPapersService {
    constructor(private readonly mongodbService: MongodbService) { }

    private collectionName: string = "nbc_papers";

    async getNbcPaperById(id: string) {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    async getNbcPapers() {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.find({}).toArray();
    }

    async createNbcPaper(nbcPapers: CreateNbcPaperDto) {
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
                    content: `Give me all the information regarding ${nbcPapers.companyName}`
                }
            ],
        });
        // console.log("agentResult",agentResult);
        const lastToolMessage = agentResult.messages.at(-2)?.content as string;
        const docs = lastToolMessage as string;
        console.log("docs", docs);

        const question = PromptTemplate.fromTemplate(prompt(nbcPapers, docs));
        const ragChain = question.pipe(llm);

        const response = await ragChain.invoke({
            context: docs,
            data: nbcPapers,
        });

        const parsedResponse = await this.extractSectionsToHtml(response.content.toString());
        const nbcPaperCollection = await this.mongodbService.connect(this.collectionName);
        const getSectionTitle = (section: Section) => {
            switch (section.title) {
                case "Document Header & Summary Table":
                    return "summary_table";
                case "Company & Project Overview":
                    return "company_overview";
                case "Transaction Overview":
                    return "transaction_overview";
                case "Market Overview":
                    return "market_overview";
                case "Key Strengths & Value Proposition":
                    return "key_strengths";
                case "Critical Areas for Due Diligence":
                    return "critical_areas";
                case "Development Impact":
                    return "development_impact";
                case "Initial Risk Assessment":
                    return "initial_risk_assessment";
                case "Preliminary KYC Report":
                    return "preliminary_kyc_report";
                default:
                    return section.title;
            }
        };
        const nbcPaperData = parsedResponse.reduce((acc, section) => ({ ...acc, content: { ...acc.content, [getSectionTitle(section)]: { title: section.title, htmlContent: section.html } } }), { title: `NBC Paper for ${nbcPapers.companyName} - ${nbcPapers.transactionType}`, createdAt: new Date(), author: "InfraCredit", companyName: nbcPapers.companyName, transactionType: nbcPapers.transactionType, structuringLeads: nbcPapers.structuringLeads, sponsors: nbcPapers.sponsors, projectDetails: nbcPapers.projectDetails, content: {}, status: "draft", htmlContent: response.content.toString(), updatedAt: new Date() });

        const nbcPaper = await nbcPaperCollection.insertOne(nbcPaperData);
        return { success: true, nbcPaper };
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
                const html = await marked(body);

                sections.push({
                    title,
                    html
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
                    const html = await marked(body);

                    sections.push({
                        title,
                        html
                    });
                }
            }
        }

        return sections;
    }

    async regenerateNbcPaper(id: string, section: string, nbcPaper: CreateNbcPaperDto) {
        // Get the existing NBC Paper
        const nbcPaperCollection = await this.mongodbService.connect(this.collectionName);
        const existingPaper = await nbcPaperCollection.findOne({ _id: new ObjectId(id) });

        if (!existingPaper) {
            throw new Error('NBC Paper not found');
        }

        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            streaming: true,
        });
        const sectionPrompt = this.createSectionPrompt(section, nbcPaper, existingPaper);
        const question = PromptTemplate.fromTemplate(sectionPrompt);
        const ragChain = question.pipe(llm);

        const response = await ragChain.invoke({
            context: existingPaper,
            data: nbcPaper,
        });

        const regeneratedSection = await this.extractSectionsToHtml(response.content.toString());

        // Update the specific section in the database
        const updatedData = { ...existingPaper };
        regeneratedSection.forEach(sectionData => {
            updatedData[sectionData.title] = sectionData.html;
        });

        const result = await nbcPaperCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );

        return {
            success: true,
            message: `Section "${section}" regenerated successfully`,
            regeneratedSection,
            result
        };
    }

    private createSectionPrompt(section: string, data: CreateNbcPaperDto, existingPaper: any): string {
        const sectionTemplates = {
            "summary_table": `
You are regenerating Section 1 (Document Header & Summary Table) of an NBC Paper. Follow the EXACT format below:

### 1. Document Header & Summary Table

Project Summary Table:
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
**Context Data**: ${existingPaper}
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
**Context Data**: ${existingPaper}
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
**Context Data**: ${existingPaper}
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
**Context Data**: ${existingPaper}
**Transaction Details**: ${data}
`,

            "key_strengths": `
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
**Context Data**: ${existingPaper}
**Transaction Details**: ${data}
`,

            "critical_areas": `
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
**Context Data**: ${existingPaper}
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
**Context Data**: ${existingPaper}
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
**Context Data**: ${existingPaper}
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
**Context Data**: ${existingPaper}
**Transaction Details**: ${data}
**Existing Paper**: ${existingPaper}
`
        };

        return sectionTemplates[section] || `Generate section ${section} of the NBC Paper using the context data and transaction details provided.`;
    }
}
