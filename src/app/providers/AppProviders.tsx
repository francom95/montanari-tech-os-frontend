import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/components';
import { AuthProvider } from '@/features/auth';
import { queryClient } from './queryClient';

/** All app-wide context providers, composed once. Router is mounted by main.tsx around these. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
