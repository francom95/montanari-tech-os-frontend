import { http } from '@/shared/api';
import type { StageExecutionResponse, ExecuteStageRequest, ExecutionPreviewResponse } from '@/shared/api';

export const executionsApi = {
  execute: (projectId: string, stageKey: string, body: ExecuteStageRequest = {}) =>
    http.post<StageExecutionResponse>(`/api/projects/${projectId}/stages/${stageKey}/execute`, body),
  list: (projectId: string) =>
    http.get<StageExecutionResponse[]>(`/api/projects/${projectId}/executions`),
  preview: (projectId: string, stageKey: string) =>
    http.get<ExecutionPreviewResponse>(
      `/api/projects/${projectId}/stages/${stageKey}/execution-preview`,
    ),
};
