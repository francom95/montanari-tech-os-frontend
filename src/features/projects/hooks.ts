import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectRequest, UpdateProjectRequest } from '@/shared/api';
import { projectsApi } from './api/projectsApi';

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: projectsApi.list,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => projectsApi.get(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectRequest) => projectsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.list() }),
  });
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProjectRequest) => projectsApi.update(projectId, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: projectKeys.list() });
      qc.setQueryData(projectKeys.detail(projectId), updated);
    },
  });
}
