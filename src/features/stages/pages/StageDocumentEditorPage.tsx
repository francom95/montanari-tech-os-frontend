import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  LoadingState,
  ErrorState,
  StageStatusBadge,
  Button,
  Icon,
  MarkdownPreview,
  useToast,
} from '@/shared/components';
import { AppError } from '@/shared/api';
import { useProjectContext } from '@/features/projects/layout/ProjectLayout';
import { ExecutionPanel } from '@/features/executions/components/ExecutionPanel';
import { useStage, useStages, useUpdateStageContent, useRequestReview } from '../hooks';
import styles from './editor.module.css';

type Tab = 'edit' | 'preview';

export function StageDocumentEditorPage() {
  const { project } = useProjectContext();
  const { stageKey } = useParams<{ stageKey: string }>();
  const toast = useToast();

  const { data: stage, isLoading, isError, error, refetch } = useStage(project.id, stageKey);
  const { data: allStages } = useStages(project.id);
  const updateContent = useUpdateStageContent(project.id, stageKey ?? '');
  const requestReview = useRequestReview(project.id, stageKey ?? '');

  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<Tab>('edit');
  const [runOpen, setRunOpen] = useState(false);

  useEffect(() => {
    if (stage) setDraft(stage.content ?? '');
  }, [stage]);

  if (isLoading) return <LoadingState label="Loading stage…" />;
  if (isError || !stage) return <ErrorState error={error} onRetry={() => refetch()} />;

  const locked = stage.status === 'LOCKED';
  const dirty = draft !== (stage.content ?? '');
  const canRun = stage.status === 'READY' || stage.status === 'REJECTED';
  const canRequestReview = stage.status === 'WAITING_HUMAN_REVIEW';

  const save = async () => {
    try {
      await updateContent.mutateAsync({ content: draft });
      toast.success('Document saved.');
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not save the document.');
    }
  };

  const sendForReview = async () => {
    try {
      await requestReview.mutateAsync({ comment: null });
      toast.success('Review requested. The stage is queued for a reviewer.');
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not request review.');
    }
  };

  return (
    <div>
      <div className={styles.bar}>
        <div className={styles.barLeft}>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {stage.stageKey}
          </span>
          <StageStatusBadge status={stage.status} size="sm" />
          <span className={styles.version}>v{stage.version}</span>
        </div>
        <div className={styles.barRight}>
          {canRequestReview && (
            <Button icon="rate_review" onClick={sendForReview} loading={requestReview.isPending}>
              Request review
            </Button>
          )}
          {canRun && (
            <Button variant="primary" icon="play_arrow" onClick={() => setRunOpen(true)}>
              Run stage
            </Button>
          )}
          {!locked && (
            <Button variant="primary" icon="save" onClick={save} loading={updateContent.isPending} disabled={!dirty}>
              Save
            </Button>
          )}
        </div>
      </div>

      {stage.status === 'WAITING_HUMAN_REVIEW' && (
        <div className={styles.reviewBanner}>
          <Icon name="reviews" size={20} color="var(--color-info-text)" />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>
              This stage is awaiting human review
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Dependent stages stay locked until a reviewer approves this output.
            </div>
          </div>
        </div>
      )}

      {locked && (
        <div className={styles.lockedBanner}>
          <Icon name="lock" size={18} color="var(--color-text-muted)" />
          {stage.lockedReason ?? 'This stage is locked until its dependencies are approved.'}
        </div>
      )}

      <div className={styles.tabs} role="tablist">
        <button role="tab" aria-selected={tab === 'edit'} className={[styles.tab, tab === 'edit' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('edit')} disabled={locked}>
          <Icon name="edit" size={16} /> Edit
        </button>
        <button role="tab" aria-selected={tab === 'preview'} className={[styles.tab, tab === 'preview' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('preview')}>
          <Icon name="visibility" size={16} /> Preview
        </button>
      </div>

      <div className={styles.pane}>
        {tab === 'edit' && !locked ? (
          <textarea
            className={styles.textarea}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            aria-label={`${stage.title} document content`}
          />
        ) : (
          <div className={styles.preview}>
            <MarkdownPreview content={tab === 'preview' ? draft : stage.content ?? ''} />
          </div>
        )}
      </div>

      {allStages && (
        <ExecutionPanel
          projectId={project.id}
          stage={stage}
          allStages={allStages}
          open={runOpen}
          onClose={() => setRunOpen(false)}
        />
      )}
    </div>
  );
}
