import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MongoClient } from 'mongodb'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb"
import * as crypto from 'crypto';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { MongodbService } from '../mongodb/mongodb.service';
@Injectable()
export class DocumentsService {
    constructor(private configService: ConfigService, private mongodbService: MongodbService) { }

    async index(file: Express.Multer.File): Promise<{
        message: string;
        collection: any;
    }> {
        const tempDir = path.join(__dirname, '..', '..', 'tmp');
        const tempPath = path.join(tempDir, file.originalname);

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        fs.writeFileSync(tempPath, file.buffer);

        const loader = new PDFLoader(tempPath);
        const docs = await loader.load();

        const docsList = docs.flat();
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50,
        });
        const docSplits = await textSplitter.splitDocuments(docsList);
        fs.unlinkSync(tempPath);

        const embeddings = new OpenAIEmbeddings({
            apiKey: this.configService.get('OPENAI_API_KEY'),
            model: "text-embedding-3-small"
        })

        function hashBuffer(buffer: Buffer): string {
            return crypto.createHash('sha256').update(buffer).digest('hex');
          }

        const collection = await this.mongodbService.connect(process.env.MONGODB_ATLAS_COLLECTION_NAME || "");
                   
        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection: collection,
            indexName: "vector_index",
            textKey: "text",
            embeddingKey: "embedding",
        });

        const ids = docSplits.map(() => uuidv4());
        const documents = docSplits.map(doc => ({ ...doc, metadata: { ...doc.metadata, hash: hashBuffer(Buffer.from(doc.pageContent)) } }))
        const fileHash = hashBuffer(Buffer.from(docSplits[0].pageContent));
        const existing = await collection.findOne({ hash: fileHash });
        if (existing) {
          console.log('Duplicate document detected. Skipping indexing.');
          return { message: 'Duplicate document', collection: existing };
        }
        console.log("Adding documents")

        const res = vectorStore.addDocuments(documents, { ids: ids });
        
        return {
            message: 'Document indexed successfully',
            collection: res,
        };
    }
}
