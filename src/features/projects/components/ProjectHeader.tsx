import { NavLink } from 'react-router-dom';
import type { ProjectResponse } from '@/shared/api';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { PROJECT_TYPE_LABEL } from '../labels';
import styles from './ProjectHeader.module.css';

const TABS = [
  { label: 'Overview', to: '' },
  { label: 'Timeline', to: 'stages' },
  { label: 'Materials', to: 'materials' },
  { label: 'Discovery', to: 'intake' },
  { label: 'Credits', to: 'credits' },
  { label: 'Export', to: 'exports' },
];

export function ProjectHeader({ project }: { project: ProjectResponse }) {
  return (
    <div className={styles.header}>
      <div className={styles.top}>
        <div>
          <div className={styles.titleRow}>
            <span className={styles.title}>{project.name}</span>
            <ProjectStatusBadge status={project.status} size="sm" />
          </div>
          <div className={styles.meta}>
            <span className="font-mono">{project.id.slice(0, 8)}</span>
            <span>·</span>
            <span>{PROJECT_TYPE_LABEL[project.projectType]}</span>
          </div>
        </div>
      </div>
      <nav className={styles.tabs} aria-label="Project sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to === '' ? `/app/projects/${project.id}` : `/app/projects/${project.id}/${tab.to}`}
            end={tab.to === ''}
            className={({ isActive }) => [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
