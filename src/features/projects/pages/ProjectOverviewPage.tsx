import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState, Badge, Button, Icon } from '@/shared/components';
import { useStages } from '@/features/stages/hooks';
import { RISK_LEVEL_LABEL, RISK_TAG_LABEL } from '../labels';
import { useProjectContext } from '../layout/ProjectLayout';
import styles from './overview.module.css';

export function ProjectOverviewPage() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: stages, isLoading, isError, error, refetch } = useStages(project.id);

  const stats = useMemo(() => {
    const list = stages ?? [];
    const total = list.length;
    const approved = list.filter((s) => s.status === 'APPROVED').length;
    const running = list.filter((s) => s.status === 'RUNNING').length;
    const waiting = list.filter((s) => s.status === 'WAITING_HUMAN_REVIEW').length;
    const failed = list.filter((s) => s.status === 'FAILED' || s.status === 'REJECTED').length;
    const pct = total ? Math.round((approved / total) * 100) : 0;
    return { total, approved, running, waiting, failed, pct };
  }, [stages]);

  if (isLoading) return <LoadingState label="Loading stages…" />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div className={styles.grid}>
      <div className={styles.col}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Stage progress</h2>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {stats.approved} / {stats.total} approved
            </span>
          </div>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${stats.pct}%` }} />
          </div>
          <div className={styles.statRow}>
            <Stat icon="check_circle" tone="success" label="Approved" value={stats.approved} />
            <Stat icon="progress_activity" tone="warning" label="Running" value={stats.running} />
            <Stat icon="hourglass_top" tone="info" label="In review" value={stats.waiting} />
            <Stat icon="error" tone="danger" label="Blocked" value={stats.failed} />
          </div>
          <Button
            variant="secondary"
            icon="timeline"
            style={{ marginTop: 18 }}
            onClick={() => navigate(`/app/projects/${project.id}/stages`)}
          >
            Open stage timeline
          </Button>
        </section>

        {project.businessObjective && (
          <section className={styles.card}>
            <h2 className={styles.h2}>Business objective</h2>
            <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '10px 0 0' }}>
              {project.businessObjective}
            </p>
          </section>
        )}
      </div>

      <div className={styles.col}>
        <section className={styles.card}>
          <h2 className={styles.h2}>Risk profile</h2>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Risk level</span>
            <Badge tone={project.riskLevel === 'LOW' ? 'neutral' : project.riskLevel === 'CRITICAL' ? 'danger' : 'warning'}>
              {RISK_LEVEL_LABEL[project.riskLevel]}
            </Badge>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Risk tags</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {project.riskTags.length === 0 ? (
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>None</span>
              ) : (
                project.riskTags.map((t) => (
                  <Badge key={t} tone="accent" icon="shield">
                    {RISK_TAG_LABEL[t]}
                  </Badge>
                ))
              )}
            </div>
          </div>
          {project.riskTags.length > 0 && (
            <p className={styles.hint}>
              <Icon name="info" size={14} color="var(--color-text-muted)" />
              Tagged stages always require human review before their dependents unlock.
            </p>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.h2}>Reports</h2>
          <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '6px 0 12px' }}>
            Living reports regenerate after every execution.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ReportLink label="Model delegation" icon="alt_route" />
            <ReportLink label="Fable Gate report" icon="verified" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon,
  tone,
  label,
  value,
}: {
  icon: string;
  tone: 'success' | 'warning' | 'info' | 'danger';
  label: string;
  value: number;
}) {
  const color = `var(--color-${tone === 'danger' ? 'danger' : tone}-text)`;
  return (
    <div className={styles.stat}>
      <Icon name={icon} size={18} color={color} />
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function ReportLink({ label, icon }: { label: string; icon: string }) {
  return (
    <div className={styles.reportLink}>
      <Icon name={icon} size={17} color="var(--color-text-secondary)" />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <Icon name="chevron_right" size={16} color="var(--color-text-muted)" />
    </div>
  );
}
