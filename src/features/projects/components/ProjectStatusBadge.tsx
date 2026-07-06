import { Badge } from '@/shared/components/Badge';
import type { ProjectStatus } from '@/shared/api';
import { PROJECT_STATUS_META } from '../labels';

export function ProjectStatusBadge({ status, size = 'md' }: { status: ProjectStatus; size?: 'sm' | 'md' }) {
  const meta = PROJECT_STATUS_META[status];
  return (
    <Badge tone={meta.tone} icon={meta.icon} size={size}>
      {meta.label}
    </Badge>
  );
}
