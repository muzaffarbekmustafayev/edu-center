import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface CreateAuditLogParams {
  actorId?: string | null;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId ?? null,
          actorRole: params.actorRole,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          before: params.before ? (params.before as any) : undefined,
          after: params.after ? (params.after as any) : undefined,
        },
      });
    } catch (err) {
      console.error('AuditLog yozishda xatolik:', err);
    }
  }

  async findAll(query: { entity?: string; actorId?: string; take?: number; skip?: number }) {
    const { entity, actorId, take = 50, skip = 0 } = query;
    const where: any = {};
    if (entity) where.entity = entity;
    if (actorId) where.actorId = actorId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
