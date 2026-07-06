import { Icon } from './Icon';

export function LoadingState({ label = 'Loading…', minHeight = 200 }: { label?: string; minHeight?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minHeight,
        color: 'var(--color-text-muted)',
      }}
    >
      <Icon name="progress_activity" size={28} spin color="var(--color-accent)" />
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}
