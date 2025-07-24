import { Injectable } from '@nestjs/common';
import { MongodbService } from 'src/mongodb/mongodb.service';

@Injectable()
export class HistoryService {
    constructor(private readonly mongodbService: MongodbService) {}

    private collectionName: string = "history";

    async getHistory(user: any, documentType?: string, skip = 0, limit = 10, search?: string, status?: string) {
        const collection = await this.mongodbService.connect(this.collectionName);
        const query: any = {
            $or: [
                { user: user.sub },
                { collaborators: { $elemMatch: { userId: user.sub } } }
            ]
        };
        if (documentType) {
            query.entityType = documentType;
        }
        if (search) {
            query["metadata.name"] = { $regex: search, $options: 'i' };
        }
        if (status) {
            query["metadata.status"] = { $regex: `^${status}$`, $options: 'i' };
        }
        const total = await collection.countDocuments(query);
        const results = await collection.find(query).skip(skip).limit(limit).toArray();
        return {
            total,
            skip,
            limit,
            results
        };
    }
}
