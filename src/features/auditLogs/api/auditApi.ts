import { http } from '@/shared/api';
import type { AuditLogResponse, Page } from '@/shared/api';

export const auditApi = {
  list: (organizationId: string, page = 0, size = 25) =>
    http.get<Page<AuditLogResponse>>(
      `/api/internal/audit-logs?organizationId=${organizationId}&page=${page}&size=${size}`,
    ),
};
