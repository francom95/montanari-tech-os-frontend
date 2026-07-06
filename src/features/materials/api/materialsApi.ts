import { api, http } from '@/shared/api';
import type { MaterialResponse, MaterialType } from '@/shared/api';

const base = (projectId: string) => `/api/projects/${projectId}/materials`;

export const materialsApi = {
  list: (projectId: string) => http.get<MaterialResponse[]>(base(projectId)),

  uploadFile: (
    projectId: string,
    file: File,
    materialType: MaterialType,
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData();
    form.append('materialType', materialType);
    form.append('file', file);
    return api
      .post<MaterialResponse>(base(projectId), form, {
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },

  addLink: (projectId: string, sourceUrl: string, materialType: MaterialType = 'LINK') => {
    const form = new FormData();
    form.append('materialType', materialType);
    form.append('sourceUrl', sourceUrl);
    return api.post<MaterialResponse>(base(projectId), form).then((r) => r.data);
  },

  delete: (projectId: string, materialId: string) =>
    http.del<void>(`${base(projectId)}/${materialId}`),
};
