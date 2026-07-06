import { http } from '@/shared/api';
import type { HumanReviewResponse, ResolveReviewRequest, Page, StageDocumentResponse } from '@/shared/api';

export const reviewsApi = {
  queue: (page = 0, size = 20) =>
    http.get<Page<HumanReviewResponse>>(`/api/internal/reviews?page=${page}&size=${size}`),
  get: (reviewId: string) => http.get<HumanReviewResponse>(`/api/internal/reviews/${reviewId}`),
  document: (reviewId: string) =>
    http.get<StageDocumentResponse>(`/api/internal/reviews/${reviewId}/document`),
  approve: (reviewId: string, body: ResolveReviewRequest) =>
    http.post<HumanReviewResponse>(`/api/internal/reviews/${reviewId}/approve`, body),
  reject: (reviewId: string, body: ResolveReviewRequest) =>
    http.post<HumanReviewResponse>(`/api/internal/reviews/${reviewId}/reject`, body),
};
