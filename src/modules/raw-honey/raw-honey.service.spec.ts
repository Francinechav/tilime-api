import { Test, TestingModule } from '@nestjs/testing';
import { RawHoneyService } from './raw-honey.service';

describe('RawHoneyService', () => {
  let service: RawHoneyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RawHoneyService],
    }).compile();

    service = module.get<RawHoneyService>(RawHoneyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
