import { Test, TestingModule } from '@nestjs/testing';
import { NbcPapersService } from './nbc-papers.service';

describe('NbcPapersService', () => {
  let service: NbcPapersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NbcPapersService],
    }).compile();

    service = module.get<NbcPapersService>(NbcPapersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
