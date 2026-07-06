import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function EmptyState({
  icon = 'inbox',
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 12,
        padding: '48px 24px',
        minHeight: 240,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} color="var(--color-text-muted)" />
      </span>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      {body && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 380, lineHeight: 1.6 }}>
          {body}
        </div>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
