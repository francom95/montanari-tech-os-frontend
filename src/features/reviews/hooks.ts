import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ResolveReviewRequest } from '@/shared/api';
import { reviewsApi } from './api/reviewsApi';

export const reviewKeys = {
  all: ['reviews'] as const,
  queue: (page: number) => [...reviewKeys.all, 'queue', page] as const,
  detail: (id: string) => [...reviewKeys.all, 'detail', id] as const,
  document: (id: string) => [...reviewKeys.all, 'document', id] as const,
};

export function useReviewQueue(page = 0, size = 20) {
  return useQuery({
    queryKey: reviewKeys.queue(page),
    queryFn: () => reviewsApi.queue(page, size),
  });
}

export function useReview(reviewId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.detail(reviewId ?? ''),
    queryFn: () => reviewsApi.get(reviewId!),
    enabled: Boolean(reviewId),
  });
}

/** The stage document body being reviewed — cross-org read via the reviewer-only endpoint. */
export function useReviewDocument(reviewId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.document(reviewId ?? ''),
    queryFn: () => reviewsApi.document(reviewId!),
    enabled: Boolean(reviewId),
  });
}

export function useResolveReview(reviewId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: reviewKeys.all });
  };
  return {
    approve: useMutation({
      mutationFn: (body: ResolveReviewRequest) => reviewsApi.approve(reviewId, body),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: (body: ResolveReviewRequest) => reviewsApi.reject(reviewId, body),
      onSuccess: invalidate,
    }),
  };
}
