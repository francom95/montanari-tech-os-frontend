import { AppShell } from '@/app/layout/AppShell';
import { Icon } from '@/shared/components';
import { useAuth } from '@/features/auth';
import { initialsFrom } from '@/shared/utils/format';
import styles from './settings.module.css';

/**
 * Account settings. Contract status: /api/auth/me is the only profile data available — there is
 * no update-profile or change-password endpoint, and organization name resolution is
 * /api/internal/organizations (MT_REVIEWER+ only), unreachable for CLIENT_* roles. So this page is
 * read-only in V1: identity + role, no editable fields, no invented endpoints
 * (FUTURE_BACKEND_REQUIRED for profile editing, deferred to V2).
 */
export function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell zone="client" title="Settings" breadcrumb={['Organization', 'Settings']}>
      <div style={{ maxWidth: 520 }}>
        <section className={styles.card}>
          <div className={styles.profileRow}>
            <span className={styles.avatar}>{initialsFrom(`${user.firstName} ${user.lastName}`)}</span>
            <div>
              <div className={styles.name}>
                {user.firstName} {user.lastName}
              </div>
              <div className={styles.email}>{user.email}</div>
            </div>
          </div>

          <Row label="Role" value={user.role} mono />
          <Row label="Status" value={user.status} />
          <Row label="Organization ID" value={user.organizationId} mono />
          <Row label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
        </section>

        <div className={styles.note}>
          <Icon name="info" size={16} color="var(--color-text-muted)" />
          Profile editing and password changes aren't available yet — there's no backend endpoint
          for it in V1. Contact your Montanari Tech admin for account changes.
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={mono ? 'font-mono' : undefined} style={{ fontSize: 13 }}>
        {value}
      </span>
    </div>
  );
}
