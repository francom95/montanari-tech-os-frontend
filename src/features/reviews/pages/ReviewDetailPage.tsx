import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import {
  LoadingState,
  ErrorState,
  Badge,
  Button,
  Icon,
  MarkdownPreview,
  StageStatusBadge,
  useToast,
} from '@/shared/components';
import { AppError, isForbidden } from '@/shared/api';
import { formatDateTime } from '@/shared/utils/format';
import { useReview, useReviewDocument, useResolveReview } from '../hooks';
import { REVIEW_STATUS_META } from '../labels';
import styles from './reviewDetail.module.css';

const HIGH_FEE_STAGES = ['14_seguridad', '15_deploy'];

export function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: review, isLoading, isError, error, refetch } = useReview(reviewId);
  const document = useReviewDocument(reviewId);
  const { approve, reject } = useResolveReview(reviewId ?? '');
  const [notes, setNotes] = useState('');

  if (isLoading) {
    return (
      <AppShell zone="internal" title="Review" breadcrumb={['Review queue']}>
        <LoadingState label="Loading review…" minHeight={400} />
      </AppShell>
    );
  }
  if (isError || !review) {
    return (
      <AppShell zone="internal" title="Review" breadcrumb={['Review queue']}>
        <ErrorState error={error} onRetry={() => refetch()} minHeight={400} />
      </AppShell>
    );
  }

  // Falls back to PENDING's presentation for any status value not in the map, instead of
  // throwing when destructuring an undefined lookup.
  const meta = REVIEW_STATUS_META[review.status] ?? REVIEW_STATUS_META.PENDING;
  const pending = review.status === 'PENDING' || review.status === 'IN_REVIEW';
  const fee = HIGH_FEE_STAGES.includes(review.stageKey) ? 60 : 25;

  const onApprove = async () => {
    try {
      await approve.mutateAsync({ notes: notes.trim() || null });
      toast.success('Approved. Dependent stages are now unlocked.');
      navigate('/internal/reviews');
    } catch (err) {
      toast.error(
        isForbidden(err)
          ? "You don't have permission to approve this review."
          : err instanceof AppError
            ? err.message
            : 'Could not approve.',
      );
    }
  };

  const onReject = async () => {
    if (!notes.trim()) {
      toast.error('Rejection requires notes explaining what to change.');
      return;
    }
    try {
      await reject.mutateAsync({ notes: notes.trim() });
      toast.success('Rejected. The stage is returned to the client for changes.');
      navigate('/internal/reviews');
    } catch (err) {
      toast.error(
        isForbidden(err)
          ? "You don't have permission to reject this review."
          : err instanceof AppError
            ? err.message
            : 'Could not reject.',
      );
    }
  };

  return (
    <AppShell
      zone="internal"
      title={`Review · ${review.stageKey}`}
      breadcrumb={['Review queue', review.stageKey]}
    >
      <div className={styles.grid}>
        <section className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 className={styles.h2} style={{ margin: 0 }}>
              Document
            </h2>
            {document.data && <StageStatusBadge status={document.data.status} size="sm" />}
          </div>
          {document.isLoading ? (
            <LoadingState label="Loading document…" minHeight={120} />
          ) : document.isError ? (
            <ErrorState error={document.error} onRetry={() => document.refetch()} minHeight={120} />
          ) : document.data && document.data.content ? (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <MarkdownPreview content={document.data.content} />
            </div>
          ) : (
            <div className={styles.docNote}>
              <Icon name="info" size={16} color="var(--color-text-muted)" />
              This document has no content yet.
            </div>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.h2}>Review details</h2>
          <Row label="Stage"><span className="font-mono">{review.stageKey}</span></Row>
          <Row label="Project"><span className="font-mono">{review.projectId.slice(0, 8)}</span></Row>
          <Row label="Status"><Badge tone={meta.tone} icon={meta.icon} size="sm">{meta.label}</Badge></Row>
          <Row label="Requested"><span>{formatDateTime(review.createdAt)}</span></Row>
          {review.riskReason && <Row label="Reason"><span>{review.riskReason}</span></Row>}
          {review.reviewNotes && <Row label="Notes"><span>{review.reviewNotes}</span></Row>}
          {review.resolvedAt && <Row label="Resolved"><span>{formatDateTime(review.resolvedAt)}</span></Row>}
        </section>

        {pending && (
          <section className={styles.card}>
            <h2 className={styles.h2}>Resolution</h2>
            <div className={styles.feeNote}>
              <Icon name="payments" size={16} color="var(--color-text-muted)" />
              A flat review fee of <strong>{fee} credits</strong> is charged on resolution (either way).
            </div>
            <label className={styles.label} htmlFor="notes">
              Notes <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(required to reject)</span>
            </label>
            <textarea
              id="notes"
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you check? For a rejection, explain what needs to change."
            />
            <div className={styles.actions}>
              <Button
                variant="danger"
                icon="close"
                onClick={onReject}
                loading={reject.isPending}
                disabled={approve.isPending}
              >
                Request changes
              </Button>
              <Button
                variant="primary"
                icon="check"
                onClick={onApprove}
                loading={approve.isPending}
                disabled={reject.isPending}
              >
                Approve
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{children}</span>
    </div>
  );
}
