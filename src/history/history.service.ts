import { Injectable } from '@nestjs/common';
import { MongodbService } from 'src/mongodb/mongodb.service';

@Injectable()
export class HistoryService {
    constructor(private readonly mongodbService: MongodbService) {}

    private collectionName: string = "history";

    async getHistory(user:any) {
        const collection = await this.mongodbService.connect(this.collectionName);
        return collection.find({$or:[{user: user.sub}, {collaborators: {$elemMatch: {userId:user.sub}}}]}).toArray();
    }
}
