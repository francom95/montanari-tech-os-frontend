import { MODEL_TIER_LABEL, type ModelTierKey } from '@/shared/design/tokens';
import { Icon } from './Icon';

/**
 * Model-tier pill. The premium tier (FABLE_5) is rendered as the filled dark chip to signal
 * "premium / gated"; every other tier is a neutral chip. Uses the real backend tier keys.
 */
export function ModelTierPill({ tier, size = 'md' }: { tier: string; size?: 'sm' | 'md' }) {
  const label = MODEL_TIER_LABEL[tier as ModelTierKey] ?? tier;
  const premium = tier === 'FABLE_5';
  const height = size === 'sm' ? 24 : 26;
  const fontSize = size === 'sm' ? 11.5 : 12;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height,
        padding: '0 9px',
        borderRadius: 'var(--radius-sm)',
        fontSize,
        fontWeight: 600,
        width: 'fit-content',
        background: premium ? 'var(--color-ink)' : 'var(--color-bg-subtle)',
        color: premium ? '#fff' : 'var(--color-text-secondary)',
        border: premium ? '1px solid var(--color-ink)' : '1px solid var(--color-border-subtle)',
      }}
    >
      {premium && <Icon name="bolt" size={size === 'sm' ? 13 : 14} color="#fff" />}
      {label}
    </span>
  );
}
