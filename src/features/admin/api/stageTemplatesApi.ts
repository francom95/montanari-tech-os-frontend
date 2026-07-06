import { http } from '@/shared/api';
import type { StageTemplateResponse, UpdateStageTemplateRequest } from '@/shared/api';

export const stageTemplatesApi = {
  list: () => http.get<StageTemplateResponse[]>('/api/internal/stage-templates'),
  update: (stageKey: string, body: UpdateStageTemplateRequest) =>
    http.put<StageTemplateResponse>(`/api/internal/stage-templates/${stageKey}`, body),
};
