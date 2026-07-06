import { http } from '@/shared/api';
import type {
  StageDocumentResponse,
  UpdateStageDocumentContentRequest,
  HumanReviewResponse,
  RequestHumanReviewRequest,
} from '@/shared/api';

const base = (projectId: string) => `/api/projects/${projectId}/stages`;

export const stagesApi = {
  list: (projectId: string) => http.get<StageDocumentResponse[]>(base(projectId)),
  get: (projectId: string, stageKey: string) =>
    http.get<StageDocumentResponse>(`${base(projectId)}/${stageKey}`),
  updateContent: (projectId: string, stageKey: string, body: UpdateStageDocumentContentRequest) =>
    http.put<StageDocumentResponse>(`${base(projectId)}/${stageKey}`, body),
  requestReview: (projectId: string, stageKey: string, body: RequestHumanReviewRequest) =>
    http.post<HumanReviewResponse>(`${base(projectId)}/${stageKey}/request-review`, body),
};
