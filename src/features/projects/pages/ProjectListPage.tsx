import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import {
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  Button,
  type Column,
} from '@/shared/components';
import type { ProjectResponse, ProjectStatus } from '@/shared/api';
import { relativeTime, initialsFrom } from '@/shared/utils/format';
import { useProjects } from '../hooks';
import { ProjectStatusBadge } from '../components/ProjectStatusBadge';
import { PROJECT_TYPE_LABEL, RISK_LEVEL_LABEL } from '../labels';
import styles from './projects.module.css';

type StatusFilter = 'ALL' | ProjectStatus;
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'ON_HOLD', label: 'On hold' },
  { key: 'COMPLETED', label: 'Completed' },
];

export function ProjectListPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useProjects();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    let list = data ?? [];
    if (filter !== 'ALL') list = list.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [data, filter, search]);

  const columns: Column<ProjectResponse>[] = [
    {
      key: 'name',
      header: 'Project',
      width: '2.4fr',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span className={styles.avatar}>{initialsFrom(p.name)}</span>
          <div style={{ minWidth: 0 }}>
            <div className={styles.projectName}>{p.name}</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {p.id.slice(0, 8)}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', width: '1.2fr', render: (p) => <ProjectStatusBadge status={p.status} size="sm" /> },
    {
      key: 'type',
      header: 'Type',
      width: '1.3fr',
      render: (p) => <span style={{ fontSize: 13 }}>{PROJECT_TYPE_LABEL[p.projectType]}</span>,
    },
    {
      key: 'risk',
      header: 'Risk',
      width: '0.9fr',
      render: (p) => <span style={{ fontSize: 13 }}>{RISK_LEVEL_LABEL[p.riskLevel]}</span>,
    },
    {
      key: 'updated',
      header: 'Updated',
      width: '0.9fr',
      render: (p) => (
        <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>{relativeTime(p.updatedAt)}</span>
      ),
    },
  ];

  return (
    <AppShell
      zone="client"
      title="Projects"
      breadcrumb={['Workspace', 'Projects']}
      primaryAction={{ label: 'New project', icon: 'add', onClick: () => navigate('/app/projects/new') }}
    >
      {isLoading ? (
        <LoadingState label="Loading projects…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="folder_open"
          title="No projects yet"
          body="Create your first project to move it through ordered, AI-assisted stages."
          action={
            <Button variant="primary" icon="add" onClick={() => navigate('/app/projects/new')}>
              New project
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.filterBar}>
            <div className={styles.search}>
              <input
                aria-label="Search projects"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.chips} role="tablist" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  className={[styles.chip, filter === f.key ? styles.chipActive : ''].filter(Boolean).join(' ')}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/app/projects/${p.id}`)}
            empty={<EmptyState icon="search_off" title="No matching projects" body="Try a different filter or search term." />}
          />
        </div>
      )}
    </AppShell>
  );
}
