import { useProjectContext } from '@/features/projects/layout/ProjectLayout';
import { CreditsView } from '../components/CreditsView';

/** Project-scoped credits: same wallet (org-level) + this project's transactions only. */
export function ProjectCreditsTab() {
  const { project } = useProjectContext();
  return <CreditsView projectId={project.id} />;
}
