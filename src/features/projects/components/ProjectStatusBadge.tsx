import { Badge } from '@/shared/components/Badge';
import type { ProjectStatus } from '@/shared/api';
import { PROJECT_STATUS_META } from '../labels';

export function ProjectStatusBadge({ status, size = 'md' }: { status: ProjectStatus; size?: 'sm' | 'md' }) {
  // Falls back to DRAFT's presentation for any status value not in the map (e.g. the frontend
  // build is older than the backend and doesn't know about a newly-added status) instead of
  // throwing when destructuring an undefined lookup.
  const meta = PROJECT_STATUS_META[status] ?? PROJECT_STATUS_META.DRAFT;
  return (
    <Badge tone={meta.tone} icon={meta.icon} size={size}>
      {meta.label}
    </Badge>
  );
}
