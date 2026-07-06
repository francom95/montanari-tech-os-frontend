import { http } from '@/shared/api';
import type {
  WalletResponse,
  CreditTransactionResponse,
  Page,
  TopUpRequest,
  AdjustmentRequest,
} from '@/shared/api';

export const creditsApi = {
  wallet: () => http.get<WalletResponse>('/api/credits/wallet'),
  transactions: (page = 0, size = 20) =>
    http.get<Page<CreditTransactionResponse>>(`/api/credits/transactions?page=${page}&size=${size}`),
  // Internal (MT_ADMIN+)
  topUp: (body: TopUpRequest) => http.post<WalletResponse>('/api/internal/credits/top-up', body),
  adjust: (body: AdjustmentRequest) => http.post<WalletResponse>('/api/internal/credits/adjust', body),
};
