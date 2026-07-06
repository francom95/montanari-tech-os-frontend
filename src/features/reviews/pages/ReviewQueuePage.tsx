import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  Badge,
  DataTable,
  Button,
  type Column,
} from '@/shared/components';
import type { HumanReviewResponse } from '@/shared/api';
import { relativeTime } from '@/shared/utils/format';
import { useReviewQueue } from '../hooks';
import { REVIEW_STATUS_META } from '../labels';

export function ReviewQueuePage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, refetch } = useReviewQueue(page, 20);

  const columns: Column<HumanReviewResponse>[] = [
    {
      key: 'stage',
      header: 'Stage',
      width: '1.6fr',
      render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>
            {r.stageKey}
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {r.projectId.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '1fr',
      render: (r) => {
        const m = REVIEW_STATUS_META[r.status];
        return <Badge tone={m.tone} icon={m.icon} size="sm">{m.label}</Badge>;
      },
    },
    {
      key: 'reason',
      header: 'Reason',
      width: '2fr',
      render: (r) => (
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{r.riskReason ?? '—'}</span>
      ),
    },
    {
      key: 'created',
      header: 'Requested',
      width: '0.9fr',
      align: 'end',
      render: (r) => (
        <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>{relativeTime(r.createdAt)}</span>
      ),
    },
  ];

  return (
    <AppShell zone="internal" title="Review queue" breadcrumb={['Montanari', 'Review queue']}>
      {isLoading ? (
        <LoadingState label="Loading review queue…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.content ?? []}
            getRowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/internal/reviews/${r.id}`)}
            empty={<EmptyState icon="task_alt" title="Queue is clear" body="No stages are awaiting review right now." />}
          />
          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, alignItems: 'center' }}>
              <Button size="sm" icon="chevron_left" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                Page {data.number + 1} of {data.totalPages}
              </span>
              <Button size="sm" iconRight="chevron_right" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
