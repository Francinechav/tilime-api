import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AuditLog } from './entities/audit-log.entity';

import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async createLog(dto: CreateAuditLogDto) {
    const log = this.auditRepository.create(dto);

    return this.auditRepository.save(log);
  }

  async findAll() {
    return this.auditRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
