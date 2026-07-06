import { useQuery } from '@tanstack/react-query';
import { creditsApi } from './api/creditsApi';

export const creditKeys = {
  all: ['credits'] as const,
  wallet: () => [...creditKeys.all, 'wallet'] as const,
  transactions: (page: number) => [...creditKeys.all, 'transactions', page] as const,
};

export function useWallet() {
  return useQuery({
    queryKey: creditKeys.wallet(),
    queryFn: creditsApi.wallet,
  });
}

export function useTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: creditKeys.transactions(page),
    queryFn: () => creditsApi.transactions(page, size),
  });
}
