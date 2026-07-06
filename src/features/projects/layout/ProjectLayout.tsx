import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { LoadingState, ErrorState } from '@/shared/components';
import type { ProjectResponse } from '@/shared/api';
import { useProject } from '../hooks';
import { ProjectHeader } from '../components/ProjectHeader';

interface ProjectContext {
  project: ProjectResponse;
}

/**
 * Nested layout for /app/projects/:projectId/*. Fetches the project once, renders the shell
 * + ProjectHeader tabs, and exposes the project to child routes via outlet context.
 */
export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, isError, error, refetch } = useProject(projectId);

  if (isLoading) {
    return (
      <AppShell zone="client" title="Project" breadcrumb={['Projects']}>
        <LoadingState label="Loading project…" minHeight={400} />
      </AppShell>
    );
  }

  if (isError || !project) {
    return (
      <AppShell zone="client" title="Project" breadcrumb={['Projects']}>
        <ErrorState error={error} onRetry={() => refetch()} minHeight={400} />
      </AppShell>
    );
  }

  return (
    <AppShell zone="client" title={project.name} breadcrumb={['Projects', project.name]}>
      <ProjectHeader project={project} />
      <Outlet context={{ project } satisfies ProjectContext} />
    </AppShell>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProjectContext(): ProjectContext {
  return useOutletContext<ProjectContext>();
}
