import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { useAuth } from '@/features/auth';
import { useProjects, ProjectStatusBadge } from '@/features/projects';
import { EmptyState, Button, LoadingState, ErrorState, Icon } from '@/shared/components';
import { relativeTime, initialsFrom } from '@/shared/utils/format';
import styles from './dashboard.module.css';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects, isLoading, isError, error, refetch } = useProjects();

  const stats = useMemo(() => {
    const list = projects ?? [];
    return {
      total: list.length,
      active: list.filter((p) => p.status === 'ACTIVE').length,
      onHold: list.filter((p) => p.status === 'ON_HOLD').length,
      completed: list.filter((p) => p.status === 'COMPLETED').length,
    };
  }, [projects]);

  const recent = useMemo(
    () => [...(projects ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [projects],
  );

  return (
    <AppShell
      zone="client"
      title="Dashboard"
      breadcrumb={['Workspace', 'Overview']}
      primaryAction={{ label: 'New project', icon: 'add', onClick: () => navigate('/app/projects/new') }}
    >
      {isLoading ? (
        <LoadingState label="Loading dashboard…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : stats.total === 0 ? (
        <EmptyState
          icon="rocket_launch"
          title={`Welcome, ${user?.firstName ?? ''}`}
          body="Create your first project to move it through ordered, AI-assisted stages with full traceability and credit accounting."
          action={
            <Button variant="primary" icon="add" onClick={() => navigate('/app/projects/new')}>
              New project
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className={styles.statRow}>
            <StatCard icon="folder_open" label="Total projects" value={stats.total} />
            <StatCard icon="bolt" label="Active" value={stats.active} tone="info" />
            <StatCard icon="pause_circle" label="On hold" value={stats.onHold} tone="warning" />
            <StatCard icon="check_circle" label="Completed" value={stats.completed} tone="success" />
          </div>

          <div>
            <div className={styles.sectionHead}>
              <h2 className={styles.h2}>Recent projects</h2>
              <Button size="sm" iconRight="arrow_forward" onClick={() => navigate('/app/projects')}>
                View all
              </Button>
            </div>
            <ul className={styles.list}>
              {recent.map((p) => (
                <li key={p.id} className={styles.row} onClick={() => navigate(`/app/projects/${p.id}`)}>
                  <span className={styles.avatar}>{initialsFrom(p.name)}</span>
                  <div className={styles.meta}>
                    <div className={styles.name}>{p.name}</div>
                    <div className={styles.sub}>Updated {relativeTime(p.updatedAt)}</div>
                  </div>
                  <ProjectStatusBadge status={p.status} size="sm" />
                  <Icon name="chevron_right" size={18} color="var(--color-text-muted)" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: number;
  tone?: 'info' | 'warning' | 'success';
}) {
  const color = tone ? `var(--color-${tone}-text)` : 'var(--color-ink)';
  return (
    <div className={styles.statCard}>
      <Icon name={icon} size={20} color={color} />
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}
