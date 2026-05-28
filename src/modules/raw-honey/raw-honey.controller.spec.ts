import { Test, TestingModule } from '@nestjs/testing';
import { RawHoneyController } from './raw-honey.controller';

describe('RawHoneyController', () => {
  let controller: RawHoneyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RawHoneyController],
    }).compile();

    controller = module.get<RawHoneyController>(RawHoneyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
