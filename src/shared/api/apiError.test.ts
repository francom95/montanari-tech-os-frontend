import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { normalizeError, AppError, isNotEnoughCredits } from './apiError';
import type { ApiError } from './types';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const err = new AxiosError('request failed');
  err.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe('normalizeError', () => {
  it('maps a backend ApiError envelope to a typed AppError', () => {
    const body: ApiError = {
      code: 'NOT_ENOUGH_CREDITS',
      message: 'Not enough credits',
      details: ['need 40 more'],
      traceId: 'trace-123',
      timestamp: '2026-07-04T00:00:00Z',
    };
    const result = normalizeError(axiosErrorWith(402, body));
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('NOT_ENOUGH_CREDITS');
    expect(result.status).toBe(402);
    expect(result.message).toBe('Not enough credits');
    expect(result.details).toEqual(['need 40 more']);
    expect(result.traceId).toBe('trace-123');
    expect(isNotEnoughCredits(result)).toBe(true);
  });

  it('handles a network error (no response) as INTERNAL_ERROR with status 0', () => {
    const result = normalizeError(new AxiosError('Network Error'));
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.status).toBe(0);
  });

  it('wraps a non-axios error', () => {
    const result = normalizeError(new Error('boom'));
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.message).toBe('boom');
  });

  it('passes an existing AppError through unchanged', () => {
    const original = new AppError({ code: 'FORBIDDEN', message: 'no', status: 403 });
    expect(normalizeError(original)).toBe(original);
  });
});
