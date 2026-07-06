import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState, EmptyState, StageStatusBadge, Button, MarkdownPreview, Icon } from '@/shared/components';
import { useProjectContext } from '@/features/projects/layout/ProjectLayout';
import { useStages } from '../hooks';

/**
 * Discovery / intake tab. Surfaces the discovery stage document (read-only) with a link into
 * the editor. Discovery reads the project's materials to extract requirements — there is no
 * separate intake endpoint, so this reflects the discovery stage state directly.
 */
export function DiscoveryPage() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: stages, isLoading, isError, error, refetch } = useStages(project.id);

  if (isLoading) return <LoadingState label="Loading discovery…" />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const discovery = stages?.find((s) => s.stageKey.includes('discovery'));
  if (!discovery) {
    return <EmptyState icon="travel_explore" title="Discovery not available" body="This project has no discovery stage." />;
  }

  const hasContent = Boolean(discovery.content?.trim());

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{discovery.title}</span>
        <StageStatusBadge status={discovery.status} size="sm" />
        <Button
          size="sm"
          icon="open_in_new"
          style={{ marginLeft: 'auto' }}
          onClick={() => navigate(`/app/projects/${project.id}/stages/${discovery.stageKey}`)}
        >
          Open in editor
        </Button>
      </div>

      <div style={{ background: 'var(--color-accent-tint)', border: '1px solid var(--color-accent-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', gap: 10, marginBottom: 20 }}>
        <Icon name="auto_awesome" size={17} color="var(--color-accent)" />
        <span style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Discovery reads your uploaded materials to extract requirements, constraints and acceptance
          criteria — better inputs mean fewer credits spent on rework downstream.
        </span>
      </div>

      {hasContent ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <MarkdownPreview content={discovery.content ?? ''} />
        </div>
      ) : (
        <EmptyState
          icon="travel_explore"
          title="No discovery output yet"
          body="Run the discovery stage to generate requirements from your materials."
          action={
            <Button variant="primary" icon="open_in_new" onClick={() => navigate(`/app/projects/${project.id}/stages/${discovery.stageKey}`)}>
              Open discovery stage
            </Button>
          }
        />
      )}
    </div>
  );
}
