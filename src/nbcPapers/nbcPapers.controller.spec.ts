import { Test, TestingModule } from '@nestjs/testing';
import { NbcPapersController } from './nbcPapers.controller';

describe('NbcPapersController', () => {
  let controller: NbcPapersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NbcPapersController],
    }).compile();

    controller = module.get<NbcPapersController>(NbcPapersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
