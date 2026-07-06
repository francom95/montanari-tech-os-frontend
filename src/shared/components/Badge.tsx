import { Icon } from './Icon';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const TONE: Record<BadgeTone, { fg: string; tint: string; border: string }> = {
  neutral: { fg: 'var(--color-text-secondary)', tint: 'var(--color-bg-subtle)', border: 'var(--color-border-subtle)' },
  info: { fg: 'var(--color-info-text)', tint: 'var(--color-info-tint)', border: 'var(--color-info-border)' },
  success: { fg: 'var(--color-success-text)', tint: 'var(--color-success-tint)', border: 'var(--color-success-border)' },
  warning: { fg: 'var(--color-warning-text)', tint: 'var(--color-warning-tint)', border: 'var(--color-warning-border)' },
  danger: { fg: 'var(--color-danger-text)', tint: 'var(--color-danger-tint)', border: 'var(--color-danger-border)' },
  accent: { fg: 'var(--color-accent-text)', tint: 'var(--color-accent-tint)', border: 'var(--color-accent-border)' },
};

/** Generic tone pill. Always renders icon + text when an icon is given (never color alone). */
export function Badge({
  tone = 'neutral',
  icon,
  spin,
  children,
  size = 'md',
}: {
  tone?: BadgeTone;
  icon?: string;
  spin?: boolean;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  const t = TONE[tone];
  const height = size === 'sm' ? 24 : 26;
  const fontSize = size === 'sm' ? 11.5 : 12;
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
        background: t.tint,
        color: t.fg,
        border: `1px solid ${t.border}`,
        width: 'fit-content',
      }}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} spin={spin} color={t.fg} />}
      {children}
    </span>
  );
}
