import { QueryClient } from '@tanstack/react-query';
import { AppError } from '@/shared/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Never retry auth/permission/validation failures; retry transient ones twice.
        if (error instanceof AppError) {
          const noRetry: Array<AppError['code']> = [
            'FORBIDDEN',
            'NOT_FOUND',
            'VALIDATION_ERROR',
            'INVALID_CREDENTIALS',
            'INVALID_TOKEN',
            'AUTHENTICATION_REQUIRED',
            'ACCOUNT_DISABLED',
            'NOT_ENOUGH_CREDITS',
            'EXECUTION_BLOCKED',
          ];
          if (noRetry.includes(error.code)) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
