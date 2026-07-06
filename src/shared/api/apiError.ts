/**
 * Normalizes every failure (axios error, network error, unexpected shape) into a single
 * typed AppError so features never inspect raw axios internals. The backend always returns
 * the ApiError envelope (shared/exception/ApiError) on error paths, including Spring
 * Security's own 401/403.
 */

import { AxiosError } from 'axios';
import type { ApiError, ErrorCode } from './types';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: string[];
  readonly traceId: string | null;

  constructor(params: {
    code: ErrorCode;
    message: string;
    status: number;
    details?: string[] | null;
    traceId?: string | null;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details ?? [];
    this.traceId = params.traceId ?? null;
  }
}

function isApiErrorBody(body: unknown): body is ApiError {
  return (
    typeof body === 'object' &&
    body !== null &&
    'code' in body &&
    'message' in body
  );
}

export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const body = err.response?.data;

    if (isApiErrorBody(body)) {
      return new AppError({
        code: body.code,
        message: body.message,
        status,
        details: body.details,
        traceId: body.traceId,
      });
    }

    if (status === 0) {
      return new AppError({
        code: 'INTERNAL_ERROR',
        message: 'Network error — could not reach the server.',
        status: 0,
      });
    }

    return new AppError({
      code: 'INTERNAL_ERROR',
      message: err.message || `Request failed with status ${status}`,
      status,
    });
  }

  return new AppError({
    code: 'INTERNAL_ERROR',
    message: err instanceof Error ? err.message : 'Unexpected error',
    status: 0,
  });
}

/** Convenience guards for feature code and UI branching. */
export const isCode = (err: unknown, code: ErrorCode): boolean =>
  err instanceof AppError && err.code === code;

export const isNotEnoughCredits = (err: unknown) => isCode(err, 'NOT_ENOUGH_CREDITS');
export const isExecutionBlocked = (err: unknown) => isCode(err, 'EXECUTION_BLOCKED');
export const isForbidden = (err: unknown) => isCode(err, 'FORBIDDEN');
