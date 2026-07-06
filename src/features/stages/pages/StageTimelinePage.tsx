import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState, EmptyState } from '@/shared/components';
import { useProjectContext } from '@/features/projects/layout/ProjectLayout';
import { useStages } from '../hooks';
import { StageTimeline } from '../components/StageTimeline';

export function StageTimelinePage() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: stages, isLoading, isError, error, refetch } = useStages(project.id);

  if (isLoading) return <LoadingState label="Loading stages…" />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!stages || stages.length === 0) {
    return <EmptyState icon="timeline" title="No stages yet" body="Stages are provisioned when the project is created." />;
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <StageTimeline
        stages={stages}
        onOpen={(stage) => navigate(`/app/projects/${project.id}/stages/${stage.stageKey}`)}
      />
    </div>
  );
}
