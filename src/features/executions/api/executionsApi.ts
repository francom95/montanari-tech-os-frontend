import { http } from '@/shared/api';
import type {
  StageExecutionResponse,
  ExecuteStageRequest,
  ExecutionPreviewResponse,
  ManualBundleResponse,
  ManualExecutionExportResponse,
  ManualExportRequest,
} from '@/shared/api';

export const executionsApi = {
  execute: (projectId: string, stageKey: string, body: ExecuteStageRequest = {}) =>
    http.post<StageExecutionResponse>(`/api/projects/${projectId}/stages/${stageKey}/execute`, body),
  list: (projectId: string) =>
    http.get<StageExecutionResponse[]>(`/api/projects/${projectId}/executions`),
  preview: (projectId: string, stageKey: string) =>
    http.get<ExecutionPreviewResponse>(
      `/api/projects/${projectId}/stages/${stageKey}/execution-preview`,
    ),
  manualExport: (projectId: string, stageKey: string, body: ManualExportRequest = {}) =>
    http.post<ManualExecutionExportResponse>(
      `/api/projects/${projectId}/stages/${stageKey}/manual-export`,
      body,
    ),
  manualBundle: (projectId: string, executionId: string) =>
    http.get<ManualBundleResponse>(
      `/api/projects/${projectId}/executions/${executionId}/manual-bundle`,
    ),
  manualImport: (projectId: string, executionId: string, content: string) =>
    http.post<StageExecutionResponse>(
      `/api/projects/${projectId}/executions/${executionId}/manual-import`,
      { content },
    ),
  manualCancel: (projectId: string, executionId: string) =>
    http.post<StageExecutionResponse>(
      `/api/projects/${projectId}/executions/${executionId}/manual-cancel`,
    ),
};
