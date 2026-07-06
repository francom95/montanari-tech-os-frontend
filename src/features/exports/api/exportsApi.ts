import { api, http } from '@/shared/api';
import type { ExportJobResponse } from '@/shared/api';

const base = (projectId: string) => `/api/projects/${projectId}/exports`;

export const exportsApi = {
  create: (projectId: string) => http.post<ExportJobResponse>(`${base(projectId)}/zip`),
  list: (projectId: string) => http.get<ExportJobResponse[]>(base(projectId)),
  download: async (projectId: string, exportJobId: string, filename: string) => {
    const res = await api.get<Blob>(`${base(projectId)}/${exportJobId}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
