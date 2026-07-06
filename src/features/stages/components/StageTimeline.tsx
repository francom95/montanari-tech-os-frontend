import { STAGE_STATUS, type StageStatusKey } from '@/shared/design/tokens';
import type { StageDocumentResponse } from '@/shared/api';
import { Icon, StageStatusBadge } from '@/shared/components';
import styles from './StageTimeline.module.css';

/** Sort stages by their numeric key prefix ("00_", "01_", ...). */
function sortStages(stages: StageDocumentResponse[]): StageDocumentResponse[] {
  return [...stages].sort((a, b) => a.stageKey.localeCompare(b.stageKey, undefined, { numeric: true }));
}

export function StageTimeline({
  stages,
  onOpen,
}: {
  stages: StageDocumentResponse[];
  onOpen: (stage: StageDocumentResponse) => void;
}) {
  const ordered = sortStages(stages);

  return (
    <ol className={styles.timeline}>
      {ordered.map((stage, i) => {
        const token = STAGE_STATUS[stage.status as StageStatusKey] ?? STAGE_STATUS.DRAFT;
        return (
          <li key={stage.stageKey} className={styles.item}>
            <div className={styles.rail}>
              <span className={styles.node} style={{ background: token.tint, borderColor: token.border }}>
                <Icon name={token.icon} size={16} spin={token.spin} color={token.fg} />
              </span>
              {i < ordered.length - 1 && <span className={styles.line} />}
            </div>

            <button
              type="button"
              className={styles.card}
              onClick={() => onOpen(stage)}
              aria-label={`Open stage ${stage.title}`}
            >
              <div className={styles.cardMain}>
                <div className={styles.titleRow}>
                  <span className={styles.order}>{stage.stageKey.split('_')[0]}</span>
                  <span className={styles.title}>{stage.title}</span>
                </div>
                {stage.dependsOn.length > 0 && (
                  <div className={styles.deps}>
                    <Icon name="account_tree" size={13} color="var(--color-text-muted)" />
                    depends on {stage.dependsOn.map((d) => d.split('_')[0]).join(', ')}
                  </div>
                )}
                {stage.status === 'LOCKED' && stage.lockedReason && (
                  <div className={styles.locked}>{stage.lockedReason}</div>
                )}
              </div>
              <div className={styles.cardRight}>
                <StageStatusBadge status={stage.status} size="sm" />
                <Icon name="chevron_right" size={18} color="var(--color-text-muted)" />
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
