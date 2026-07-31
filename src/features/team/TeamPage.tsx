import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '@/app/layout/AppShell';
import {
  Modal,
  ConfirmDialog,
  Button,
  Badge,
  DataTable,
  LoadingState,
  ErrorState,
  EmptyState,
  Icon,
  useToast,
  type BadgeTone,
  type Column,
} from '@/shared/components';
import { AppError, isForbidden } from '@/shared/api';
import type { UserRole, UserStatus, UserResponse } from '@/shared/api';
import { relativeTime, initialsFrom } from '@/shared/utils/format';
import { authApi } from '@/features/auth';
import { useAuth } from '@/features/auth/AuthContext';
import { useOrgUsers, useInvalidateUsers, useUpdateUserRole, useUpdateUserStatus } from './hooks';
import styles from './team.module.css';

/**
 * Organization user management (CLIENT_ADMIN).
 *
 * Contract status: listing (GET /api/users), creation (POST /api/auth/register), role changes
 * (PATCH /api/users/:id/role) and activation/deactivation (PATCH /api/users/:id/status) are all
 * backed — all org-scoped, all admin-gated. A caller can never change their own role or status
 * (server-enforced; this page also hides the affordance for the row that is you, so there's no
 * dead button to click).
 */
const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(12, 'At least 12 characters'),
  role: z.enum(['CLIENT_USER', 'CLIENT_ADMIN']),
});
type FormValues = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'CLIENT_USER', label: 'Member (CLIENT_USER)' },
  { value: 'CLIENT_ADMIN', label: 'Admin (CLIENT_ADMIN)' },
];

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  CLIENT_USER: 'Member',
  CLIENT_ADMIN: 'Admin',
  MT_REVIEWER: 'Reviewer',
  MT_ADMIN: 'MT Admin',
  SYSTEM_ADMIN: 'System Admin',
};

const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  ACTIVE: 'success',
  INVITED: 'info',
  DISABLED: 'neutral',
};

export function TeamPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, isError, error, refetch } = useOrgUsers();
  const invalidateUsers = useInvalidateUsers();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<UserResponse | null>(null);

  const changeRole = async (targetUser: UserResponse, role: UserRole) => {
    try {
      await updateRole.mutateAsync({ userId: targetUser.id, role });
      toast.success(`${targetUser.email} is now ${ROLE_LABEL[role] ?? role}.`);
    } catch (err) {
      toast.error(
        isForbidden(err)
          ? "You don't have permission to change this user's role."
          : err instanceof AppError
            ? err.message
            : 'Could not change the role.',
      );
    }
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const nextStatus: UserStatus = statusTarget.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      await updateStatus.mutateAsync({ userId: statusTarget.id, status: nextStatus });
      toast.success(
        nextStatus === 'DISABLED'
          ? `${statusTarget.email} was deactivated.`
          : `${statusTarget.email} was reactivated.`,
      );
      setStatusTarget(null);
    } catch (err) {
      toast.error(
        isForbidden(err)
          ? "You don't have permission to change this user's status."
          : err instanceof AppError
            ? err.message
            : 'Could not change the status.',
      );
    }
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'CLIENT_USER' } });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await authApi.register(values);
      toast.success(`Invited ${values.email}.`);
      invalidateUsers();
      reset({ role: 'CLIENT_USER' });
      setOpen(false);
    } catch (err) {
      toast.error(
        isForbidden(err)
          ? "You don't have permission to invite users."
          : err instanceof AppError
            ? err.message
            : 'Could not create the user.',
      );
    } finally {
      setSubmitting(false);
    }
  });

  const columns: Column<UserResponse>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '1.6fr',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span className={styles.avatar}>{initialsFrom(`${u.firstName} ${u.lastName}`)}</span>
          <div style={{ minWidth: 0 }}>
            <div className={styles.name}>
              {u.firstName} {u.lastName}
            </div>
            <div className={styles.sub}>{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: '1.2fr',
      render: (u) =>
        u.id === currentUser?.id || !ROLE_OPTIONS.some((o) => o.value === u.role) ? (
          <Badge size="sm">{ROLE_LABEL[u.role] ?? u.role}</Badge>
        ) : (
          <select
            className={styles.rowSelect}
            value={u.role}
            disabled={updateRole.isPending}
            onChange={(e) => changeRole(u, e.target.value as UserRole)}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '1fr',
      render: (u) => (
        <Badge tone={STATUS_TONE[u.status]} size="sm">
          {u.status}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Added',
      width: '0.9fr',
      render: (u) => (
        <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>{relativeTime(u.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '0.9fr',
      align: 'end',
      render: (u) =>
        u.id === currentUser?.id ? null : (
          <Button size="sm" variant="ghost" onClick={() => setStatusTarget(u)}>
            {u.status === 'DISABLED' ? 'Reactivate' : 'Deactivate'}
          </Button>
        ),
    },
  ];

  return (
    <AppShell
      zone="client"
      title="Team"
      breadcrumb={['Organization', 'Team']}
      primaryAction={{ label: 'Invite user', icon: 'person_add', onClick: () => setOpen(true) }}
    >
      {isLoading ? (
        <LoadingState label="Loading team…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (users?.length ?? 0) === 0 ? (
        <EmptyState
          icon="group"
          title="No teammates yet"
          body="Invite the first member of your organization."
          action={
            <Button variant="primary" icon="person_add" onClick={() => setOpen(true)}>
              Invite user
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={users!} getRowKey={(u) => u.id} />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a user"
        width={480}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" icon="send" onClick={onSubmit} loading={submitting}>
              Create user
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit}>
          <div className={styles.two}>
            <Field label="First name" error={errors.firstName?.message}>
              <input className={styles.input} {...register('firstName')} />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <input className={styles.input} {...register('lastName')} />
            </Field>
          </div>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" className={styles.input} {...register('email')} />
          </Field>
          <Field label="Temporary password" error={errors.password?.message}>
            <input type="text" className={styles.input} {...register('password')} />
          </Field>
          <Field label="Role" error={errors.role?.message}>
            <select className={styles.input} {...register('role')}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <p className={styles.hint}>
            <Icon name="info" size={14} color="var(--color-text-muted)" />
            The user signs in with this email and temporary password.
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={statusTarget != null}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
        title={statusTarget?.status === 'DISABLED' ? 'Reactivate user?' : 'Deactivate user?'}
        body={
          statusTarget?.status === 'DISABLED'
            ? `${statusTarget?.email ?? ''} will be able to sign in again immediately.`
            : `${statusTarget?.email ?? ''} will be signed out and unable to sign in until reactivated.`
        }
        confirmLabel={statusTarget?.status === 'DISABLED' ? 'Reactivate' : 'Deactivate'}
        destructive={statusTarget?.status !== 'DISABLED'}
        loading={updateStatus.isPending}
      />
    </AppShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <div className={styles.err}>{error}</div>}
    </div>
  );
}
