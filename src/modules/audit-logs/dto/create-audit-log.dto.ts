export class CreateAuditLogDto {
  action!: string;

  entityType!: string;

  entityId?: string;

  performedBy?: string;

  metadata?: Record<string, unknown>;
  before?: Record<string, unknown>;

  after?: Record<string, unknown>;
}
