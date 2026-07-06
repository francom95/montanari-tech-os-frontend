import { useState } from 'react';
import { LoadingState, ErrorState, EmptyState, Badge, Button, Icon, useToast, type BadgeTone } from '@/shared/components';
import { AppError } from '@/shared/api';
import type { ExportJobStatus } from '@/shared/api';
import { relativeTime } from '@/shared/utils/format';
import { useProjectContext } from '@/features/projects/layout/ProjectLayout';
import { useExports, useCreateExport } from './hooks';
import { exportsApi } from './api/exportsApi';
import styles from './exports.module.css';

const STATUS_TONE: Record<ExportJobStatus, BadgeTone> = {
  PENDING: 'neutral',
  RUNNING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
};

export function ExportPage() {
  const { project } = useProjectContext();
  const toast = useToast();
  const { data: jobs, isLoading, isError, error, refetch } = useExports(project.id);
  const create = useCreateExport(project.id);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const generate = async () => {
    try {
      await create.mutateAsync();
      toast.success('Export started. It will appear below when ready.');
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not start the export.');
    }
  };

  const download = async (jobId: string) => {
    setDownloadingId(jobId);
    try {
      await exportsApi.download(project.id, jobId, `${project.name.replace(/\s+/g, '_')}_${jobId.slice(0, 8)}.zip`);
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not download the export.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.h2}>Export project</h2>
          <p className={styles.lead}>
            Packages every approved stage document plus the living reports into a downloadable ZIP.
            Running or locked stages are excluded.
          </p>
        </div>
        <Button variant="primary" icon="folder_zip" onClick={generate} loading={create.isPending}>
          Generate ZIP
        </Button>
      </div>

      <div style={{ marginTop: 20 }}>
        {isLoading ? (
          <LoadingState label="Loading exports…" />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (jobs?.length ?? 0) === 0 ? (
          <EmptyState icon="folder_zip" title="No exports yet" body="Generate a ZIP to download this project's approved output." />
        ) : (
          <ul className={styles.list}>
            {jobs!.map((job) => (
              <li key={job.id} className={styles.row}>
                <Icon name="folder_zip" size={20} color="var(--color-text-secondary)" />
                <div className={styles.meta}>
                  <div className={styles.name}>Export · {job.id.slice(0, 8)}</div>
                  <div className={styles.sub}>{relativeTime(job.createdAt)}</div>
                </div>
                <Badge tone={STATUS_TONE[job.status]} size="sm">
                  {job.status}
                </Badge>
                <Button
                  size="sm"
                  icon="download"
                  disabled={job.status !== 'COMPLETED'}
                  loading={downloadingId === job.id}
                  onClick={() => download(job.id)}
                >
                  Download
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
