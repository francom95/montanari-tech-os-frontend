import { http } from '@/shared/api';
import type {
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@/shared/api';

export const projectsApi = {
  list: () => http.get<ProjectResponse[]>('/api/projects'),
  get: (projectId: string) => http.get<ProjectResponse>(`/api/projects/${projectId}`),
  create: (body: CreateProjectRequest) => http.post<ProjectResponse>('/api/projects', body),
  update: (projectId: string, body: UpdateProjectRequest) =>
    http.put<ProjectResponse>(`/api/projects/${projectId}`, body),
};
