import type { ProjectType, ProjectStatus, ProjectRiskLevel, RiskTag } from '@/shared/api';

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  INSTITUTIONAL_WEB: 'Institutional website',
  LANDING_PAGE: 'Landing page',
  INTERNAL_SYSTEM: 'Internal system',
  MOBILE_APP: 'Mobile app',
  MARKETPLACE: 'Marketplace',
  SAAS: 'SaaS',
  ERP: 'ERP',
  BOOKING_SYSTEM: 'Booking system',
  EVENT_SYSTEM: 'Event system',
  AI_SYSTEM: 'AI system',
  AUTOMATION: 'Automation',
  LEGACY_MIGRATION: 'Legacy migration',
};

export const PROJECT_TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABEL).map(([value, label]) => ({
  value: value as ProjectType,
  label,
}));

/** Project status → badge presentation (semantic colors only). */
export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; icon: string; tone: 'neutral' | 'info' | 'success' | 'warning' }
> = {
  DRAFT: { label: 'Draft', icon: 'edit_note', tone: 'neutral' },
  ACTIVE: { label: 'Active', icon: 'bolt', tone: 'info' },
  ON_HOLD: { label: 'On hold', icon: 'pause_circle', tone: 'warning' },
  COMPLETED: { label: 'Completed', icon: 'check_circle', tone: 'success' },
  ARCHIVED: { label: 'Archived', icon: 'inventory_2', tone: 'neutral' },
};

export const RISK_LEVEL_LABEL: Record<ProjectRiskLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const RISK_TAG_LABEL: Record<RiskTag, string> = {
  PAYMENTS: 'Payments',
  HEALTH: 'Health',
  PERSONAL_DATA: 'Personal data',
};

export const RISK_TAG_OPTIONS = Object.entries(RISK_TAG_LABEL).map(([value, label]) => ({
  value: value as RiskTag,
  label,
}));
