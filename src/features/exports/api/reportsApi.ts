import { http } from '@/shared/api';
import type { ProjectReportKey, ProjectReportResponse } from '@/shared/api';

export const reportsApi = {
  get: (projectId: string, reportKey: ProjectReportKey) =>
    http.get<ProjectReportResponse>(`/api/projects/${projectId}/reports/${reportKey}`),
};
