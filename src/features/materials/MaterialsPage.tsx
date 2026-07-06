import { useState } from 'react';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  FileUploadDropzone,
  Badge,
  Icon,
  ConfirmDialog,
  useToast,
} from '@/shared/components';
import { AppError } from '@/shared/api';
import type { MaterialType, MaterialResponse } from '@/shared/api';
import { relativeTime } from '@/shared/utils/format';
import { useProjectContext } from '@/features/projects/layout/ProjectLayout';
import { useMaterials, useUploadMaterial, useDeleteMaterial } from './hooks';
import styles from './materials.module.css';

function materialTypeFor(file: File): MaterialType {
  if (file.type === 'application/pdf') return 'PDF';
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  return 'FILE';
}

const TYPE_ICON: Record<MaterialType, string> = {
  FILE: 'description',
  PDF: 'picture_as_pdf',
  IMAGE: 'image',
  AUDIO: 'graphic_eq',
  LINK: 'link',
  LOGO: 'workspace_premium',
  REFERENCE: 'bookmark',
};

export function MaterialsPage() {
  const { project } = useProjectContext();
  const toast = useToast();
  const { data: materials, isLoading, isError, error, refetch } = useMaterials(project.id);
  const upload = useUploadMaterial(project.id);
  const remove = useDeleteMaterial(project.id);
  const [progress, setProgress] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<MaterialResponse | null>(null);

  const onFiles = async (files: File[]) => {
    for (const file of files) {
      setProgress(0);
      try {
        await upload.mutateAsync({
          file,
          materialType: materialTypeFor(file),
          onProgress: setProgress,
        });
        toast.success(`${file.name} uploaded.`);
      } catch (err) {
        toast.error(err instanceof AppError ? err.message : `Could not upload ${file.name}.`);
      }
    }
    setProgress(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success('Material removed.');
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not remove the material.');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <FileUploadDropzone onFiles={onFiles} disabled={upload.isPending} />
      {progress !== null && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {progress}%
          </span>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {isLoading ? (
          <LoadingState label="Loading materials…" />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (materials?.length ?? 0) === 0 ? (
          <EmptyState
            icon="folder_open"
            title="No materials yet"
            body="Upload documents, images, or references. Better inputs mean fewer credits spent on rework during discovery."
          />
        ) : (
          <ul className={styles.list}>
            {materials!.map((m) => (
              <li key={m.id} className={styles.row}>
                <Icon name={TYPE_ICON[m.materialType]} size={20} color="var(--color-text-secondary)" />
                <div className={styles.meta}>
                  <div className={styles.name}>{m.fileName ?? m.sourceUrl ?? m.materialType}</div>
                  <div className={styles.sub}>
                    {m.materialType} · {relativeTime(m.createdAt)}
                  </div>
                </div>
                <Badge tone={m.status === 'FAILED' ? 'danger' : m.status === 'TEXT_EXTRACTED' ? 'success' : 'neutral'} size="sm">
                  {m.status}
                </Badge>
                <button
                  className={styles.delete}
                  onClick={() => setToDelete(m)}
                  aria-label={`Remove ${m.fileName ?? 'material'}`}
                >
                  <Icon name="delete" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove material"
        body={`Remove "${toDelete?.fileName ?? toDelete?.sourceUrl ?? 'this material'}"? This can't be undone.`}
        confirmLabel="Remove"
        destructive
        loading={remove.isPending}
      />
    </div>
  );
}
