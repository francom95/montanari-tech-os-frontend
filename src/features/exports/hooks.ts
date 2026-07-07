import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectReportKey } from '@/shared/api';
import { exportsApi } from './api/exportsApi';
import { reportsApi } from './api/reportsApi';

export const exportKeys = {
  list: (projectId: string) => ['exports', projectId] as const,
};

export const reportKeys = {
  detail: (projectId: string, reportKey: ProjectReportKey) => ['project-report', projectId, reportKey] as const,
};

export function useExports(projectId: string | undefined) {
  return useQuery({
    queryKey: exportKeys.list(projectId ?? ''),
    queryFn: () => exportsApi.list(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateExport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => exportsApi.create(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: exportKeys.list(projectId) }),
  });
}

/** `enabled` lets callers defer the fetch until the report is actually about to be shown (e.g. a modal opening) — CLAUDE.md can be a large document, not worth fetching on every export-page visit. */
export function useProjectReport(projectId: string, reportKey: ProjectReportKey, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.detail(projectId, reportKey),
    queryFn: () => reportsApi.get(projectId, reportKey),
    enabled,
    retry: false,
  });
}
