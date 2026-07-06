import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/app/layout/AppShell';
import { Button, LoadingState, ErrorState, Icon, useToast } from '@/shared/components';
import { AppError } from '@/shared/api';
import type { ModelTier } from '@/shared/api';
import { MODEL_TIERS } from '@/shared/design/tokens';
import { formatDateTime } from '@/shared/utils/format';
import { useModelPolicy, useUpdateModelPolicy } from './hooks';
import styles from './admin.module.css';

/**
 * Admin editing of the Model Router's tunable knobs — escalation threshold and disabled tiers.
 * The Fable Gate's own safety rules (G1-G10) are NOT here and never will be: they are
 * non-negotiable product policy (OPEN_DECISIONS.md), not something an admin should be able to
 * turn off from a settings screen.
 */
export function ModelPoliciesPage() {
  const { data: policy, isLoading, isError, error, refetch } = useModelPolicy();
  const update = useUpdateModelPolicy();
  const toast = useToast();

  const [threshold, setThreshold] = useState(2);
  const [disabled, setDisabled] = useState<Set<ModelTier>>(new Set());
  // Seeds local draft state exactly once, on first load — a background refetch (e.g. window
  // focus) must never silently overwrite an in-progress, unsaved edit.
  const initialized = useRef(false);

  useEffect(() => {
    if (policy && !initialized.current) {
      initialized.current = true;
      setThreshold(policy.escalationThreshold);
      setDisabled(new Set(policy.disabledTiers));
    }
  }, [policy]);

  const toggleTier = (tier: ModelTier) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const dirty =
    policy != null &&
    (threshold !== policy.escalationThreshold ||
      disabled.size !== policy.disabledTiers.length ||
      [...disabled].some((t) => !policy.disabledTiers.includes(t)));

  const save = async () => {
    try {
      await update.mutateAsync({ escalationThreshold: threshold, disabledTiers: [...disabled] });
      toast.success('Model policy saved.');
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not save the policy.');
    }
  };

  return (
    <AppShell zone="internal" title="Model policies" breadcrumb={['Montanari', 'Model policies']}>
      {isLoading ? (
        <LoadingState label="Loading model policies…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div style={{ maxWidth: 560 }}>
          <div className={styles.field}>
            <label className={styles.label}>Escalation threshold</label>
            <input
              type="number"
              min={1}
              className={styles.input}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <p className={styles.hintText}>
              Failures at a stage's default tier before the router climbs one rung of the
              escalation ladder (or the Fable Gate escalates to Fable 5, if the next rung would be
              the premium tier).
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Disabled tiers</label>
            <p className={styles.hintText} style={{ marginTop: 0, marginBottom: 10 }}>
              A disabled tier is never routed to. If the Fable Gate requires it anyway (Fable 5),
              the execution blocks instead of silently degrading to a cheaper tier.
            </p>
            <div className={styles.checkGrid}>
              {MODEL_TIERS.map((t) => (
                <label key={t.key} className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={disabled.has(t.key as ModelTier)}
                    onChange={() => toggleTier(t.key as ModelTier)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button variant="primary" icon="save" onClick={save} loading={update.isPending} disabled={!dirty}>
              Save
            </Button>
            {policy && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                v{policy.version} · updated {formatDateTime(policy.updatedAt)}
              </span>
            )}
          </div>

          <div className={styles.hintText} style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <Icon name="info" size={15} color="var(--color-text-muted)" />
            The Fable Gate's own rules (G1-G10 — e.g. payments, health and personal-data always
            require human review) are not editable here or anywhere in the console. They are
            non-negotiable product policy.
          </div>
        </div>
      )}
    </AppShell>
  );
}
