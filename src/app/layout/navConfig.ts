import type { UserRole } from '@/shared/api';

export interface NavItem {
  label: string;
  icon: string;
  to: string;
  /** Roles allowed to see the item; omit = any authenticated user in the zone. */
  roles?: UserRole[];
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

/** Client zone (/app/*). */
export const CLIENT_NAV: NavGroup[] = [
  {
    heading: 'Workspace',
    items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/app/dashboard' },
      { label: 'Projects', icon: 'folder_open', to: '/app/projects' },
      { label: 'Credits', icon: 'account_balance_wallet', to: '/app/credits' },
    ],
  },
  {
    heading: 'Organization',
    items: [
      { label: 'Team', icon: 'group', to: '/app/team', roles: ['CLIENT_ADMIN'] },
      { label: 'Settings', icon: 'settings', to: '/app/settings' },
    ],
  },
];

/** Internal zone (/internal/*). */
export const INTERNAL_NAV: NavGroup[] = [
  {
    heading: 'Review',
    items: [{ label: 'Review queue', icon: 'rate_review', to: '/internal/reviews' }],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Stage templates', icon: 'category', to: '/internal/stage-templates', roles: ['MT_ADMIN', 'SYSTEM_ADMIN'] },
      { label: 'Model policies', icon: 'tune', to: '/internal/model-policies', roles: ['MT_ADMIN', 'SYSTEM_ADMIN'] },
      { label: 'Audit log', icon: 'receipt_long', to: '/internal/audit-logs', roles: ['MT_ADMIN', 'SYSTEM_ADMIN'] },
    ],
  },
];
