import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/app/layout/AppShell';
import { LoadingState, ErrorState, EmptyState, Badge, DataTable, Pagination, type Column } from '@/shared/components';
import type { AuditLogResponse, AuditAction } from '@/shared/api';
import { formatDateTime } from '@/shared/utils/format';
import { useAuth } from '@/features/auth';
import { auditApi } from './api/auditApi';

const ACTION_LABEL: Record<AuditAction, string> = {
  PROJECT_CREATED: 'Project created',
  PROJECT_UPDATED: 'Project updated',
  MATERIAL_UPLOADED: 'Material uploaded',
  MATERIAL_DELETED: 'Material deleted',
  STAGE_DOCUMENT_EDITED: 'Stage edited',
  STAGE_EXECUTION_STARTED: 'Execution started',
  STAGE_EXECUTION_COMPLETED: 'Execution completed',
  CREDITS_CONSUMED: 'Credits consumed',
  CREDITS_TOPPED_UP: 'Credits topped up',
  CREDITS_ADJUSTED: 'Credits adjusted',
  HUMAN_REVIEW_REQUESTED: 'Review requested',
  HUMAN_REVIEW_APPROVED: 'Review approved',
  HUMAN_REVIEW_REJECTED: 'Review rejected',
  EXPORT_COMPLETED: 'Export completed',
  EXPORT_FAILED: 'Export failed',
};

export function AuditLogPage() {
  const { user } = useAuth();
  const orgId = user?.organizationId ?? '';
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audit-logs', orgId, page],
    queryFn: () => auditApi.list(orgId, page, 25),
    enabled: Boolean(orgId),
  });

  const columns: Column<AuditLogResponse>[] = [
    {
      key: 'when',
      header: 'When',
      width: '1.1fr',
      render: (a) => <span className="font-mono" style={{ fontSize: 12 }}>{formatDateTime(a.createdAt)}</span>,
    },
    { key: 'action', header: 'Action', width: '1.1fr', render: (a) => <Badge size="sm">{ACTION_LABEL[a.action] ?? a.action}</Badge> },
    { key: 'entity', header: 'Entity', width: '1fr', render: (a) => <span style={{ fontSize: 13 }}>{a.entityType}</span> },
    {
      key: 'entityId',
      header: 'Entity ID',
      width: '0.9fr',
      render: (a) => <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{a.entityId?.slice(0, 8) ?? '—'}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      width: '0.9fr',
      render: (a) => <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{a.userId?.slice(0, 8) ?? 'system'}</span>,
    },
  ];

  return (
    <AppShell zone="internal" title="Audit log" breadcrumb={['Montanari', 'Audit log']}>
      {isLoading ? (
        <LoadingState label="Loading audit log…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.content ?? []}
            getRowKey={(a) => a.id}
            empty={<EmptyState icon="receipt_long" title="No audit entries" body="Activity for this organization will appear here." />}
          />
          <Pagination data={data} onPageChange={setPage} />
        </>
      )}
    </AppShell>
  );
}
