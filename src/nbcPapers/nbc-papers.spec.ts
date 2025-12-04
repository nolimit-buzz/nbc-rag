import { Test, TestingModule } from '@nestjs/testing';
import { NbcPapers } from './nbcPapers';

describe('NbcPapers', () => {
  let provider: NbcPapers;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NbcPapers],
    }).compile();

    provider = module.get<NbcPapers>(NbcPapers);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
