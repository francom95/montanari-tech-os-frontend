import type { CreditTransactionType } from '@/shared/api';
import type { BadgeTone } from '@/shared/components';

export const CREDIT_TX_META: Record<
  CreditTransactionType,
  { label: string; tone: BadgeTone; sign: '+' | '-' | '' }
> = {
  TOP_UP: { label: 'Top up', tone: 'success', sign: '+' },
  RESERVE: { label: 'Reserve', tone: 'warning', sign: '-' },
  CONSUME: { label: 'Consume', tone: 'neutral', sign: '-' },
  RELEASE: { label: 'Release', tone: 'info', sign: '+' },
  ADJUSTMENT: { label: 'Adjustment', tone: 'accent', sign: '' },
  HUMAN_REVIEW_FEE: { label: 'Review fee', tone: 'neutral', sign: '-' },
};
