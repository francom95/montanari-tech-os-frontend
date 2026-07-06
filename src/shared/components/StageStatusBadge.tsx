import { STAGE_STATUS, type StageStatusKey } from '@/shared/design/tokens';
import { Icon } from './Icon';

/**
 * Stage status pill. Always renders icon + text (never color alone) for accessibility.
 * Driven entirely by the STAGE_STATUS token map — no ad-hoc colors.
 */
export function StageStatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const token = STAGE_STATUS[status as StageStatusKey] ?? STAGE_STATUS.DRAFT;
  const height = size === 'sm' ? 24 : 26;
  const fontSize = size === 'sm' ? 11.5 : 12;
  const iconSize = size === 'sm' ? 14 : 15;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height,
        padding: '0 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize,
        fontWeight: 600,
        background: token.tint,
        color: token.fg,
        border: `1px solid ${token.border}`,
        width: 'fit-content',
      }}
    >
      <Icon name={token.icon} size={iconSize} spin={token.spin} color={token.fg} />
      {token.label}
    </span>
  );
}
