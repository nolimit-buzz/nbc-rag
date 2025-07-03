import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    @Post('index')
    @UseInterceptors(FileInterceptor('file'))
    indexDocument(@UploadedFile() file: Express.Multer.File) {
        return this.documentsService.index(file);
    }
}
