/**
 * Montanari OS — Design Tokens
 *
 * Source of truth for the visual system, adapted from the approved Claude Design
 * handoff (`handoff/tokens.ts`, iteration 2). Consumed two ways:
 *   1. As CSS custom properties declared in `index.css` (`--color-*`, `--space-*`, ...).
 *   2. As typed maps here, imported by components that need to drive rendering from
 *      data (StageStatusBadge, ModelTierPill) — never with ad-hoc colors.
 *
 * Principles: monochrome-first; ONE indigo accent for primary intent and active
 * state only; semantic colors reserved strictly for status.
 *
 * NB vs handoff v2: STAGE_STATUS completed with DRAFT and REJECTED so it matches the
 * backend `StageStatus` enum (8 states); the handoff only shipped 6.
 */

export const color = {
  // Neutrals (from montanari-tech.com identity)
  ink: '#0A0A0A', // primary text, brand black
  surfaceDark: '#161616', // dark surfaces / running banner
  textSecondary: '#4E4E4E', // secondary text
  textMuted: '#6B6E76', // muted text — AA (5.1:1 on white)
  textMutedOnDark: '#9CA3AF', // muted text on dark surfaces
  border: '#D1D1D1', // strong border
  borderSubtle: '#E1E5EC', // hairline border / dividers
  bgApp: '#F7FAFF', // app canvas background
  bgSubtle: '#F1F3F7', // subtle fill (neutral chips, tracks)
  surface: '#FFFFFF', // cards, sidebar, header

  // Accent — indigo (Montanari OS only; never on the monochrome mark)
  accent: '#4F46E5',
  accentHover: '#4338CA',
  accentBorder: '#C7D2FE',
  accentTint: '#EEF2FF',
  accentText: '#4338CA',

  // Semantic — STATUS ONLY (never decorative, never the accent)
  success: '#16A34A',
  successText: '#15803D',
  successTint: '#F0FDF4',
  successBorder: '#BBF7D0',
  warning: '#D97706',
  warningText: '#B45309',
  warningTint: '#FFFBEB',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerText: '#B91C1C',
  dangerTint: '#FEF2F2',
  dangerBorder: '#FECACA',
  info: '#2563EB',
  infoText: '#1D4ED8',
  infoTint: '#EFF6FF',
  infoBorder: '#BFDBFE',
} as const;

/** Font families. The logo wordmark is an image asset — never re-set in a web font. */
export const font = {
  ui: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace", // credits, IDs, timestamps, stage codes
  icon: "'Material Symbols Outlined'",
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 } as const;

export const radius = { sm: 6, md: 9, lg: 12, xl: 16, pill: 999 } as const;

export const elevation = {
  sm: '0 1px 2px rgba(10,10,10,.06)',
  md: '0 4px 12px rgba(10,10,10,.08)',
  lg: '0 18px 40px -18px rgba(10,10,20,.28)',
} as const;

/** Keyboard focus — applied to every interactive element. */
export const focus = {
  ring: '2px solid #4F46E5',
  offset: '2px',
} as const;

/** Shell dimensions and responsive breakpoints (px). */
export const shell = {
  sidebarWidth: 248,
  sidebarCollapsedWidth: 72, // tablet icon rail
  topBarHeight: 64,
} as const;

export const breakpoints = { mobile: 390, tablet: 768, laptop: 1280, desktop: 1440 } as const;

/**
 * Model tiers — real platform ladder (matches backend `ModelTier`).
 * `key` is the backend enum; `label` is the display name; `mult` is the credit multiplier.
 * Premium tier (FABLE_5) is gated by the Fable Gate.
 * HUMAN_REVIEW is a routing sentinel, not a selectable model tier — excluded from the ladder.
 */
export const MODEL_TIERS = [
  { key: 'CHEAP_FAST_MODEL', label: 'Fast', mult: 1, premium: false },
  { key: 'DESIGN_MODEL', label: 'Design', mult: 3, premium: false },
  { key: 'QA_MODEL', label: 'QA', mult: 3, premium: false },
  { key: 'CODING_STANDARD_MODEL', label: 'Coding', mult: 4, premium: false },
  { key: 'SECURITY_MODEL', label: 'Security', mult: 4, premium: false },
  { key: 'CLAUDE_DESIGN', label: 'Claude Design', mult: 8, premium: false },
  { key: 'FABLE_5', label: 'Fable 5', mult: 20, premium: true },
] as const;

export type ModelTierKey =
  | (typeof MODEL_TIERS)[number]['key']
  | 'HUMAN_REVIEW';

export const MODEL_TIER_LABEL: Record<ModelTierKey, string> = {
  CHEAP_FAST_MODEL: 'Fast',
  DESIGN_MODEL: 'Design',
  QA_MODEL: 'QA',
  CODING_STANDARD_MODEL: 'Coding',
  SECURITY_MODEL: 'Security',
  CLAUDE_DESIGN: 'Claude Design',
  FABLE_5: 'Fable 5',
  HUMAN_REVIEW: 'Human review',
};

/**
 * Stage status — drives StageStatusBadge. Matches backend `StageStatus` (8 states).
 * Status is ALWAYS icon + text (never color alone) for accessibility.
 */
export interface StageStatusToken {
  label: string;
  icon: string;
  fg: string;
  tint: string;
  border: string;
  spin?: boolean;
}

export const STAGE_STATUS: Record<string, StageStatusToken> = {
  DRAFT: {
    label: 'Draft',
    icon: 'edit_note',
    fg: color.textMuted,
    tint: color.bgSubtle,
    border: color.borderSubtle,
  },
  LOCKED: {
    label: 'Locked',
    icon: 'lock',
    fg: color.textSecondary,
    tint: color.bgSubtle,
    border: color.borderSubtle,
  },
  READY: {
    label: 'Ready',
    icon: 'play_circle',
    fg: color.infoText,
    tint: color.infoTint,
    border: color.infoBorder,
  },
  RUNNING: {
    label: 'Running',
    icon: 'progress_activity',
    fg: color.warningText,
    tint: color.warningTint,
    border: color.warningBorder,
    spin: true,
  },
  WAITING_HUMAN_REVIEW: {
    label: 'Waiting review',
    icon: 'hourglass_top',
    fg: color.infoText,
    tint: color.infoTint,
    border: color.infoBorder,
  },
  APPROVED: {
    label: 'Approved',
    icon: 'check_circle',
    fg: color.successText,
    tint: color.successTint,
    border: color.successBorder,
  },
  REJECTED: {
    label: 'Rejected',
    icon: 'cancel',
    fg: color.dangerText,
    tint: color.dangerTint,
    border: color.dangerBorder,
  },
  FAILED: {
    label: 'Failed',
    icon: 'error',
    fg: color.dangerText,
    tint: color.dangerTint,
    border: color.dangerBorder,
  },
} as const;

export type StageStatusKey =
  | 'DRAFT'
  | 'LOCKED'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_HUMAN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED';

/** Roles (matches backend). */
export const ROLES = [
  'CLIENT_USER',
  'CLIENT_ADMIN',
  'MT_REVIEWER',
  'MT_ADMIN',
  'SYSTEM_ADMIN',
] as const;
export type Role = (typeof ROLES)[number];
