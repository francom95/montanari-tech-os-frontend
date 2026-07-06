import { useMemo, useState } from 'react';
import { LoadingState, ErrorState, EmptyState, Badge, DataTable, Button, type Column } from '@/shared/components';
import type { CreditTransactionResponse } from '@/shared/api';
import { formatNumber, relativeTime } from '@/shared/utils/format';
import { useWallet, useTransactions } from '../hooks';
import { CREDIT_TX_META } from '../labels';
import styles from './credits.module.css';

/** Wallet cards + transaction ledger. `projectId` filters the ledger to one project's rows. */
export function CreditsView({ projectId }: { projectId?: string }) {
  const wallet = useWallet();
  const [page, setPage] = useState(0);
  const tx = useTransactions(page, 20);

  const rows = useMemo(() => {
    const content = tx.data?.content ?? [];
    return projectId ? content.filter((t) => t.projectId === projectId) : content;
  }, [tx.data, projectId]);

  const columns: Column<CreditTransactionResponse>[] = [
    {
      key: 'type',
      header: 'Type',
      width: '1.1fr',
      render: (t) => {
        const meta = CREDIT_TX_META[t.transactionType];
        return <Badge tone={meta.tone} size="sm">{meta.label}</Badge>;
      },
    },
    {
      key: 'desc',
      header: 'Description',
      width: '2fr',
      render: (t) => <span style={{ fontSize: 13 }}>{t.description ?? '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '0.8fr',
      align: 'end',
      render: (t) => {
        const meta = CREDIT_TX_META[t.transactionType];
        return (
          <span className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>
            {meta.sign}
            {formatNumber(Math.abs(t.amount))}
          </span>
        );
      },
    },
    {
      key: 'balance',
      header: 'Balance',
      width: '0.8fr',
      align: 'end',
      render: (t) => (
        <span className="font-mono" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          {formatNumber(t.balanceAfter)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'When',
      width: '0.9fr',
      align: 'end',
      render: (t) => <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>{relativeTime(t.createdAt)}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={styles.walletGrid}>
        <WalletCard label="Available" value={wallet.data?.available} accent />
        <WalletCard label="Reserved" value={wallet.data?.reserved} />
        <WalletCard label="Balance" value={wallet.data?.balance} />
      </div>

      <div>
        <h2 className={styles.h2}>Transactions</h2>
        {tx.isLoading ? (
          <LoadingState label="Loading transactions…" />
        ) : tx.isError ? (
          <ErrorState error={tx.error} onRetry={() => tx.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(t) => t.id}
              empty={<EmptyState icon="receipt_long" title="No transactions yet" body="Credit activity will appear here as stages run." />}
            />
            {!projectId && tx.data && tx.data.totalPages > 1 && (
              <div className={styles.pager}>
                <Button size="sm" icon="chevron_left" disabled={tx.data.first} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </Button>
                <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                  Page {tx.data.number + 1} of {tx.data.totalPages}
                </span>
                <Button size="sm" iconRight="chevron_right" disabled={tx.data.last} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WalletCard({ label, value, accent }: { label: string; value?: number; accent?: boolean }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue} style={accent ? { color: 'var(--color-accent-text)' } : undefined}>
        {value === undefined ? '—' : formatNumber(value)}
      </div>
    </div>
  );
}
