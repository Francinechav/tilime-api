import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Farmer } from './entities/farmer.entity';

import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmersRepository: Repository<Farmer>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createFarmer(dto: CreateFarmerDto): Promise<Farmer> {
    const farmer = this.farmersRepository.create(dto);

    const savedFarmer: Farmer = await this.farmersRepository.save(farmer);

    await this.auditLogsService.createLog({
      action: 'CREATE_FARMER',

      entityType: 'FARMER',

      entityId: savedFarmer.id,

      metadata: {
        farmerName: savedFarmer.fullName,

        phone: savedFarmer.phone,
      },
    });

    return savedFarmer;
  }

  async findAllFarmers(): Promise<Farmer[]> {
    return this.farmersRepository.find({
      relations: {
        rawHoneyBatches: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOneFarmer(id: string): Promise<Farmer> {
    const farmer = await this.farmersRepository.findOne({
      where: { id },

      relations: {
        rawHoneyBatches: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return farmer;
  }
  async updateFarmer(id: string, dto: UpdateFarmerDto): Promise<Farmer> {
    const farmer = await this.findOneFarmer(id);

    Object.assign(farmer, dto);

    const updatedFarmer: Farmer = await this.farmersRepository.save(farmer);

    await this.auditLogsService.createLog({
      action: 'UPDATE_FARMER',

      entityType: 'FARMER',

      entityId: updatedFarmer.id,

      metadata: {
        farmerName: updatedFarmer.fullName,

        updatedFields: dto,
      },
    });

    return updatedFarmer;
  }

  async deleteFarmer(id: string) {
    const farmer = await this.findOneFarmer(id);

    await this.auditLogsService.createLog({
      action: 'DELETE_FARMER',

      entityType: 'FARMER',

      entityId: farmer.id,

      metadata: {
        farmerName: farmer.fullName,
      },
    });

    await this.farmersRepository.remove(farmer);

    return {
      message: 'Farmer deleted successfully',
    };
  }
}
