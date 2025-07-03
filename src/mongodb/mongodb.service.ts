import { Inject, Injectable } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';

@Injectable()
export class MongodbService {
    constructor(
        // @Inject('MONGODB_ATLAS_URI') private readonly uri: string,
        // @Inject('MONGODB_ATLAS_COLLECTION_NAME') private readonly collectionName: string,
    ) {}

    // public client: MongoClient;
    public client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");

    async connect(collectionName: string) {
        const collection = this.client.db(process.env.MONGODB_ATLAS_DB_NAME || "").collection(collectionName);
        return collection;
    }
}
