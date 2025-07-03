import { Injectable } from '@nestjs/common';
import { MongodbService } from '../mongodb/mongodb.service';
import { CreateNbcPaperDto } from './create-nbc-paper.dto';
import { tool } from "@langchain/core/tools";
import z from 'zod';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { pull } from 'lodash';
const prompt = (data: CreateNbcPaperDto) => `
RAG System Prompt: NBC Paper Generation

You are a specialized assistant for drafting NBC (New Business Committee) Papers within the Digital Credit Application Platform. Given a new transaction's input data in structured JSON format and historical document insights, your goal is to generate a five-page NBC Paper draft in the standard structure used across the organization.

Prompt Instruction for AI:

Objective:
Generate a high-quality, standardized NBC Paper for a new project using the JSON fields provided, referencing previously approved submissions like the Electrify Microgrid (EML) example.

Guidelines:

Structure the output into the following core sections:

1. Project Overview Table
   - Deal Name (\`${data.dealName}\`)
   - Sector: [Figure out the sector from the retrieved company details]
   - Transaction Type (\`${data.transactionType}\`)
   - Structuring Leads (\`${data.structuringLeads}\`)
   - Sponsors (\`${data.sponsors}\`)
   - Company Name (\`${data.companyName}\`)
   - Circulation Date: [Today's Date]
   - Portfolio Exposure: [TBD]
   - Total Limit: [TBD]

2. Company & Project Overview
   - Summarize the project details including location, capacity, number of connections, and financing needs using \`projectDetails\`.
   - Describe ownership and project sponsors (\`${data.sponsors}\`).
   - If any information is missing, flag as [TBD].

3. Transaction Overview
   - Summarize the transaction type, debt need, estimated cost, grant support, and key terms from \`${data.projectDetails}\` and \`${data.transactionType}\`.
   - Use clear, formal language consistent with NBC standards.

4. Market Overview
   - Describe the macroeconomic and sector context based on the location and sector of the project.
   - Emphasize why this project is relevant and impactful.

5. Critical Areas for Due Diligence
   - Generate a list of due diligence considerations based on the project details and market context.
   - Ensure these are formatted as clear bullet points.

6. Development Impact
   - Highlight development impact of the project. List out the SDG goals and their targets from \`${data.projectDetails}\` 
   - Flag any SDG contributions if applicable.

Instructions:

- Use institutional tone and formatting modeled after the EML NBC Paper.
- Reference past successful phrasing, structure, and insights where relevant.
- Clearly label each section.
- Flag any missing information as [TBD] to prompt user completion.
- Ensure clarity, coherence, and compliance with organizational expectations.
`;


@Injectable()
export class NbcPapersService {
    constructor(private readonly mongodbService: MongodbService) {}
    private collectionName: string="nbc_papers";

    async getNbcPapers() {
        const collection=  await this.mongodbService.connect(this.collectionName);
        // return collection.find({}).toArray();
    }

    async createNbcPaper(nbcPapers: CreateNbcPaperDto) {
        
        const collection=  await this.mongodbService.connect("documents");
        console.log(await collection.find({}).toArray());
        // console.log(collection);
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
                const semanticQuery = `Provide all the information regarding ${companyName}?`;
                console.log("Searching with query:", semanticQuery);
            
                const results = await vectorStore.similaritySearch(semanticQuery, 5);
            
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
        // async function generate(state: typeof GraphState.State): Promise<Partial<typeof GraphState.State>> {
           
          
        //     return {
        //       messages: [response],
        //     };
        //   }
        const tools = [retrieveTool];
        // const toolNode = new ToolNode<typeof GraphState.State>(tools);

        //   const GraphState = Annotation.Root({
        //     messages: Annotation<BaseMessage[]>({
        //       reducer: (x, y) => x.concat(y),
        //       default: () => [],
        //     })
        //   })
          
        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0,
            streaming: true,
          });

        //   const workflow = new StateGraph(GraphState)
          const agent = createReactAgent({
            llm,
            tools,
        });
        // workflow.addNode("retrieve", toolNode)
        //         .addNode("generate", generate);
        const result = await agent.invoke({
            messages: [{ role: "user", content: `Give me all the information regarding ${nbcPapers.companyName}?` }],
        });
        console.log("---GENERATE---");
          
            // const { messages } = state;
            const lastToolMessage = result.messages[0].content as string;
            // Extract the most recent ToolMessage
            // const lastToolMessage = result.messages.slice().reverse().find((msg) => msg._getType() === "tool");
            // if (!lastToolMessage) {
            //   throw new Error("No tool message found in the conversation history");
            // }
          
            const docs = lastToolMessage as string;
          
            const question = PromptTemplate.fromTemplate(prompt(nbcPapers));
            
          
            const ragChain = question.pipe(llm);
          
            const response = await ragChain.invoke({
              context: docs,
              question,
            });

       
        console.log(response);
        return {
            message: "Search successful",
            result: response,
        }
    }
}
