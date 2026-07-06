import type { HumanReviewStatus } from '@/shared/api';
import type { BadgeTone } from '@/shared/components';

export const REVIEW_STATUS_META: Record<HumanReviewStatus, { label: string; tone: BadgeTone; icon: string }> = {
  PENDING: { label: 'Pending', tone: 'info', icon: 'hourglass_top' },
  IN_REVIEW: { label: 'In review', tone: 'warning', icon: 'rate_review' },
  APPROVED: { label: 'Approved', tone: 'success', icon: 'check_circle' },
  REJECTED: { label: 'Rejected', tone: 'danger', icon: 'cancel' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: 'block' },
};
