import { Test, TestingModule } from '@nestjs/testing';
import { ReportTypesController } from './report-types.controller';

describe('ReportTypesController', () => {
  let controller: ReportTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportTypesController],
    }).compile();

    controller = module.get<ReportTypesController>(ReportTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
