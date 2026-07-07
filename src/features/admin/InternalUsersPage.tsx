import { useEffect, useState } from 'react';
import { AppShell } from '@/app/layout/AppShell';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  useToast,
  type Column,
} from '@/shared/components';
import { AppError } from '@/shared/api';
import type { UserResponse, UserRole } from '@/shared/api';
import { useInternalOrganizations, useInternalUsers, useToggleManualExecution } from './hooks';
import styles from './admin.module.css';

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  CLIENT_USER: 'Member',
  CLIENT_ADMIN: 'Admin',
  MT_REVIEWER: 'Reviewer',
  MT_ADMIN: 'MT Admin',
  SYSTEM_ADMIN: 'System Admin',
};

/**
 * Internal user administration (MT_ADMIN+). V1 scope is deliberately narrow: per-user toggle of
 * the manual-execution capability (export prompt bundle / run in own subscription / import the
 * result). Role changes and deactivation remain FUTURE_BACKEND_REQUIRED (V1 gap by decision).
 */
export function InternalUsersPage() {
  const toast = useToast();
  const organizations = useInternalOrganizations();
  const [organizationId, setOrganizationId] = useState<string>('');
  const users = useInternalUsers(organizationId || undefined);
  const toggle = useToggleManualExecution(organizationId);
  const [pendingToggle, setPendingToggle] = useState<UserResponse | null>(null);

  // Seed the selector once with the first organization — never reset a manual selection.
  useEffect(() => {
    if (!organizationId && organizations.data && organizations.data.length > 0) {
      setOrganizationId(organizations.data[0].id);
    }
  }, [organizations.data, organizationId]);

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const enabling = !pendingToggle.manualExecutionEnabled;
    try {
      await toggle.mutateAsync({ userId: pendingToggle.id, enabled: enabling });
      toast.success(
        enabling
          ? `Manual execution enabled for ${pendingToggle.email}.`
          : `Manual execution disabled for ${pendingToggle.email}.`,
      );
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not update the user.');
    } finally {
      setPendingToggle(null);
    }
  };

  const columns: Column<UserResponse>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '2fr',
      render: (u) => (
        <span>
          {u.firstName} {u.lastName}
          <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)' }}>{u.email}</span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: '1fr',
      render: (u) => <Badge size="sm">{ROLE_LABEL[u.role] ?? u.role}</Badge>,
    },
    {
      key: 'manual',
      header: 'Manual execution',
      width: '1fr',
      render: (u) =>
        u.manualExecutionEnabled ? (
          <Badge tone="success" size="sm" icon="ios_share">
            Enabled
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            Disabled
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'end',
      render: (u) => (
        <Button size="sm" onClick={() => setPendingToggle(u)}>
          {u.manualExecutionEnabled ? 'Disable' : 'Enable'}
        </Button>
      ),
    },
  ];

  return (
    <AppShell zone="internal" title="Users" breadcrumb={['Administration']}>
      <div style={{ maxWidth: 860 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 18px', lineHeight: 1.6 }}>
          Grant or revoke the manual-execution capability: enabled users can export a stage's
          prompt bundle, run it in their own Claude subscription, and import the result — normal
          credits apply, no API tokens are spent.
        </p>

        {organizations.isLoading ? (
          <LoadingState label="Loading organizations…" />
        ) : organizations.isError ? (
          <ErrorState error={organizations.error} onRetry={() => organizations.refetch()} />
        ) : (organizations.data?.length ?? 0) === 0 ? (
          <EmptyState icon="group" title="No organizations" body="Create an organization first." />
        ) : (
          <>
            <div className={styles.field} style={{ maxWidth: 340, marginBottom: 20 }}>
              <label className={styles.label} htmlFor="org-select">
                Organization
              </label>
              <select
                id="org-select"
                className={styles.select}
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              >
                {organizations.data!.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {users.isLoading ? (
              <LoadingState label="Loading users…" />
            ) : users.isError ? (
              <ErrorState error={users.error} onRetry={() => users.refetch()} />
            ) : (
              <DataTable
                columns={columns}
                rows={users.data ?? []}
                getRowKey={(u) => u.id}
                empty={<EmptyState icon="group" title="No users" body="This organization has no users yet." />}
              />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingToggle != null}
        onClose={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
        title={pendingToggle?.manualExecutionEnabled ? 'Disable manual execution?' : 'Enable manual execution?'}
        body={
          pendingToggle?.manualExecutionEnabled
            ? `${pendingToggle.email} will no longer be able to export prompt bundles or import results. In-flight manual executions can still be cancelled.`
            : `${pendingToggle?.email ?? ''} will be able to export prompt bundles, run them in their own Claude subscription, and import the results. Normal credits still apply.`
        }
        confirmLabel={pendingToggle?.manualExecutionEnabled ? 'Disable' : 'Enable'}
        destructive={pendingToggle?.manualExecutionEnabled}
        loading={toggle.isPending}
      />
    </AppShell>
  );
}
