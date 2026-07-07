import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Button,
  Icon,
  Badge,
  ModelTierPill,
  ConfirmDialog,
  FileUploadDropzone,
  useToast,
} from '@/shared/components';
import { AppError, isNotEnoughCredits, isExecutionBlocked, isForbidden } from '@/shared/api';
import type { StageDocumentResponse, StageExecutionResponse } from '@/shared/api';
import { formatNumber } from '@/shared/utils/format';
import { copyToClipboard, downloadTextFile } from '@/shared/utils/clipboard';
import { useAuth } from '@/features/auth/AuthContext';
import { useWallet } from '@/features/credits/hooks';
import {
  useExecuteStage,
  useExecutionPreview,
  useExecutions,
  useManualCancel,
  useManualExport,
  useManualImport,
} from '../hooks';
import { executionsApi } from '../api/executionsApi';
import styles from './ExecutionPanel.module.css';

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'CANCELLED']);

/**
 * Pre-flight + run panel for a stage. Shows the real Fable Gate decision, model tier, and
 * estimated cost via the read-only preview endpoint (no reservation, no persisted evaluation —
 * see StageExecutionFacade#preview) before the user confirms, then the real result after running.
 *
 * Users with the manual-execution capability get a second path: export a self-contained prompt
 * bundle (same gate/routing/credit reservation), run it in their own Claude subscription, and
 * import the reply here. The awaiting-import state is derived from the polled executions list —
 * not just local state — so closing and reopening the panel (or another tab) lands back in it.
 */
export function ExecutionPanel({
  projectId,
  stage,
  allStages,
  open,
  onClose,
}: {
  projectId: string;
  stage: StageDocumentResponse;
  allStages: StageDocumentResponse[];
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const execute = useExecuteStage(projectId, stage.stageKey);
  const manualExport = useManualExport(projectId, stage.stageKey);
  const manualImport = useManualImport(projectId);
  const manualCancel = useManualCancel(projectId);
  const executionsQuery = useExecutions(projectId);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [initialResult, setInitialResult] = useState<StageExecutionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bundle, setBundle] = useState<{ markdown: string; fileName: string } | null>(null);
  const [importText, setImportText] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const notifiedFor = useRef<string | null>(null);

  const manualEnabled = user?.manualExecutionEnabled === true;

  // The POST response only guarantees RUNNING — StageExecutionRunner finishes the run on a
  // background thread. `initialResult` covers the gap before the polling list query (useExecutions)
  // has refetched and includes this execution; once it does, the live, polled entry takes over.
  const result =
    executionId != null
      ? (executionsQuery.data?.find((e) => e.id === executionId) ?? initialResult)
      : null;

  // Awaiting-import is server state, not local state: derived from the executions list so the
  // panel recovers it after a reload, navigation, or a second tab.
  const awaitingImport =
    executionsQuery.data?.find(
      (e) =>
        e.stageDocumentId === stage.id &&
        e.executionMode === 'MANUAL' &&
        e.status === 'AWAITING_IMPORT',
    ) ?? null;

  useEffect(() => {
    if (result && TERMINAL_STATUSES.has(result.status) && notifiedFor.current !== result.id) {
      notifiedFor.current = result.id;
      if (result.status === 'SUCCEEDED') toast.success('Stage executed successfully.');
      else if (result.status === 'CANCELLED') toast.success('Manual execution cancelled — credits released.');
      else toast.error('Execution failed.');
    }
  }, [result, toast]);

  const statusByKey = new Map(allStages.map((s) => [s.stageKey, s.status]));
  const blockers = stage.dependsOn.filter((dep) => statusByKey.get(dep) !== 'APPROVED');
  const depsMet = blockers.length === 0;

  const preview = useExecutionPreview(
    projectId,
    stage.stageKey,
    open && depsMet && !result && !awaitingImport,
  );

  const describeRunError = (err: unknown): string => {
    if (isNotEnoughCredits(err))
      return err instanceof AppError ? err.message : 'Not enough credits to run this stage.';
    if (isExecutionBlocked(err))
      return err instanceof AppError ? err.message : 'Execution is blocked by the Fable Gate.';
    if (isForbidden(err)) return "You don't have permission to run this stage.";
    return err instanceof AppError ? err.message : 'Could not run the stage.';
  };

  const run = async () => {
    setErrorMsg(null);
    setExecutionId(null);
    setInitialResult(null);
    try {
      const res = await execute.mutateAsync({});
      setExecutionId(res.id);
      setInitialResult(res);
    } catch (err) {
      setErrorMsg(describeRunError(err));
    }
  };

  const runManually = async () => {
    setErrorMsg(null);
    try {
      const res = await manualExport.mutateAsync({});
      setBundle({ markdown: res.bundleMarkdown, fileName: res.suggestedFileName });
      toast.success('Bundle exported — credits reserved. Run it in your Claude subscription.');
    } catch (err) {
      setErrorMsg(describeRunError(err));
    }
  };

  /** Local bundle if this session exported it; otherwise re-fetch from the persisted snapshot. */
  const resolveBundle = async (): Promise<{ markdown: string; fileName: string } | null> => {
    if (bundle) return bundle;
    if (!awaitingImport) return null;
    try {
      const res = await executionsApi.manualBundle(projectId, awaitingImport.id);
      const resolved = { markdown: res.bundleMarkdown, fileName: res.suggestedFileName };
      setBundle(resolved);
      return resolved;
    } catch {
      toast.error('Could not load the bundle.');
      return null;
    }
  };

  const downloadBundle = async () => {
    const resolved = await resolveBundle();
    if (resolved) downloadTextFile(resolved.markdown, resolved.fileName);
  };

  const copyBundle = async () => {
    const resolved = await resolveBundle();
    if (!resolved) return;
    if (await copyToClipboard(resolved.markdown)) toast.success('Bundle copied to clipboard.');
    else toast.error('Could not copy to clipboard.');
  };

  const importResult = async () => {
    if (!awaitingImport) return;
    setErrorMsg(null);
    try {
      const res = await manualImport.mutateAsync({
        executionId: awaitingImport.id,
        content: importText,
      });
      setExecutionId(res.id);
      setInitialResult(res);
      setImportText('');
      setBundle(null);
    } catch (err) {
      setErrorMsg(err instanceof AppError ? err.message : 'Could not import the result.');
    }
  };

  const cancelManualRun = async () => {
    if (!awaitingImport) return;
    try {
      await manualCancel.mutateAsync(awaitingImport.id);
      toast.success('Manual execution cancelled — credits released.');
      setConfirmCancelOpen(false);
      close();
    } catch (err) {
      setConfirmCancelOpen(false);
      setErrorMsg(err instanceof AppError ? err.message : 'Could not cancel the execution.');
    }
  };

  const onImportFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const close = () => {
    setExecutionId(null);
    setInitialResult(null);
    setErrorMsg(null);
    setImportText('');
    onClose();
  };

  const footer = result ? (
    <Button variant="primary" onClick={close}>
      Done
    </Button>
  ) : awaitingImport ? (
    <>
      <Button variant="ghost" onClick={close} disabled={manualImport.isPending}>
        Close
      </Button>
      <Button
        variant="ghost"
        icon="cancel"
        onClick={() => setConfirmCancelOpen(true)}
        disabled={manualImport.isPending || manualCancel.isPending}
      >
        Cancel manual run
      </Button>
      <Button
        variant="primary"
        icon="upload"
        onClick={importResult}
        loading={manualImport.isPending}
        disabled={!importText.trim()}
      >
        Import result
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={close} disabled={execute.isPending || manualExport.isPending}>
        Cancel
      </Button>
      {manualEnabled && (
        <Button
          icon="ios_share"
          onClick={runManually}
          loading={manualExport.isPending}
          disabled={!depsMet || preview.data?.exceedsCap === true || execute.isPending}
        >
          Run manually
        </Button>
      )}
      <Button
        variant="primary"
        icon="play_arrow"
        onClick={run}
        loading={execute.isPending}
        disabled={!depsMet || preview.data?.exceedsCap === true || manualExport.isPending}
      >
        Reserve credits &amp; run
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={close} title={`Run stage · ${stage.title}`} width={560} footer={footer}>
      {result ? (
        <ExecutionResult result={result} />
      ) : awaitingImport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section>
            <div className={styles.sectionTitle}>Manual execution — awaiting import</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <div>1. Download or copy the exported bundle.</div>
              <div>2. Run it in your Claude subscription with the model indicated inside.</div>
              <div>3. Paste Claude's entire reply below (or upload it as a .md file).</div>
              <div>
                4. Import — the {formatNumber(awaitingImport.estimatedCredits)} reserved credits
                will be consumed.
              </div>
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button size="sm" icon="download" onClick={downloadBundle}>
                Download bundle
              </Button>
              <Button size="sm" icon="content_copy" onClick={copyBundle}>
                Copy to clipboard
              </Button>
              <span style={{ marginLeft: 'auto' }}>
                <ModelTierPill tier={awaitingImport.modelTier} size="sm" />
              </span>
            </div>
          </section>

          <section>
            <div className={styles.sectionTitle}>Claude's reply</div>
            <textarea
              className={styles.importTextarea}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste the complete reply here…"
              rows={8}
            />
            <div style={{ marginTop: 10 }}>
              <FileUploadDropzone accept=".md,.txt" onFiles={onImportFiles} hint="or drop the reply as a .md file" />
            </div>
          </section>

          {errorMsg && (
            <div className={styles.error}>
              <Icon name="error" size={17} color="var(--color-danger)" />
              {errorMsg}
            </div>
          )}

          <ConfirmDialog
            open={confirmCancelOpen}
            onClose={() => setConfirmCancelOpen(false)}
            onConfirm={cancelManualRun}
            title="Cancel manual execution?"
            body={`The ${formatNumber(awaitingImport.estimatedCredits)} reserved credits will be released and the stage returns to Ready. The exported bundle stays available in the execution history.`}
            confirmLabel="Cancel manual run"
            destructive
            loading={manualCancel.isPending}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Dependencies */}
          <section>
            <div className={styles.sectionTitle}>Dependencies</div>
            {stage.dependsOn.length === 0 ? (
              <div className={styles.line}>
                <Icon name="check_circle" size={18} color="var(--color-success)" />
                No dependencies — ready to run.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stage.dependsOn.map((dep) => {
                  const ok = statusByKey.get(dep) === 'APPROVED';
                  return (
                    <div key={dep} className={styles.line}>
                      <Icon
                        name={ok ? 'check_circle' : 'lock'}
                        size={18}
                        color={ok ? 'var(--color-success)' : 'var(--color-text-muted)'}
                      />
                      <span className="font-mono" style={{ fontSize: 13 }}>
                        {dep}
                      </span>
                      <span style={{ marginLeft: 'auto' }}>
                        <Badge tone={ok ? 'success' : 'neutral'} size="sm">
                          {ok ? 'Approved' : (statusByKey.get(dep) ?? 'Missing')}
                        </Badge>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Wallet */}
          <section>
            <div className={styles.sectionTitle}>Credits</div>
            <div className={styles.walletRow}>
              <div>
                <div className={styles.walletValue}>{wallet ? formatNumber(wallet.available) : '—'}</div>
                <div className={styles.walletLabel}>Available</div>
              </div>
              <div>
                <div className={styles.walletValue}>{wallet ? formatNumber(wallet.reserved) : '—'}</div>
                <div className={styles.walletLabel}>Reserved</div>
              </div>
              <div>
                <div className={styles.walletValue}>{wallet ? formatNumber(wallet.balance) : '—'}</div>
                <div className={styles.walletLabel}>Balance</div>
              </div>
            </div>
          </section>

          {/* Gate + model preview */}
          {depsMet && (
            <section>
              <div className={styles.sectionTitle}>Fable Gate &amp; model</div>
              {preview.isLoading ? (
                <div className={styles.line}>
                  <Icon name="progress_activity" size={17} spin color="var(--color-text-muted)" />
                  Evaluating…
                </div>
              ) : preview.isError ? (
                <div className={styles.line}>
                  <Icon name="info" size={17} color="var(--color-text-muted)" />
                  Couldn’t preview the decision — it will still be evaluated when you run.
                </div>
              ) : preview.data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className={styles.line}>
                    {preview.data.gateDecision === 'FABLE_REQUIRED' ? (
                      <Badge tone="accent" icon="verified" size="sm">
                        Fable 5 required
                      </Badge>
                    ) : (
                      <Badge tone="neutral" icon="alt_route" size="sm">
                        Delegated
                      </Badge>
                    )}
                    <ModelTierPill tier={preview.data.modelTier} size="sm" />
                    <span
                      className="font-mono"
                      style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600 }}
                    >
                      {formatNumber(preview.data.estimatedCredits)} cr
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {preview.data.routingReason}
                  </div>
                  {preview.data.requiresHumanReview && (
                    <div className={styles.line}>
                      <Icon name="reviews" size={16} color="var(--color-info-text)" />
                      Requires human review before dependents unlock.
                    </div>
                  )}
                  {preview.data.exceedsCap && (
                    <div className={styles.error}>
                      <Icon name="error" size={17} color="var(--color-danger)" />
                      Estimated cost exceeds this stage's cap of{' '}
                      {formatNumber(preview.data.maxCreditsPerExecution)} credits.
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          )}

          {!depsMet && (
            <div className={styles.blocked}>
              <Icon name="lock" size={17} color="var(--color-text-muted)" />
              This stage is blocked until its dependencies are approved.
            </div>
          )}

          {errorMsg && (
            <div className={styles.error}>
              <Icon name="error" size={17} color="var(--color-danger)" />
              {errorMsg}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ExecutionResult({ result }: { result: StageExecutionResponse }) {
  const running = result.status === 'RUNNING' || result.status === 'PENDING';
  const ok = result.status === 'SUCCEEDED';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={styles.line}>
        {running ? (
          <Icon name="progress_activity" size={20} spin color="var(--color-text-muted)" />
        ) : (
          <Icon
            name={ok ? 'check_circle' : 'error'}
            size={20}
            color={ok ? 'var(--color-success)' : 'var(--color-danger)'}
          />
        )}
        <span style={{ fontSize: 15, fontWeight: 600 }}>
          {running
            ? 'Running…'
            : ok
              ? 'Stage executed'
              : `Execution ${result.status.toLowerCase()}`}
        </span>
      </div>
      {running && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          The model call runs in the background — this can take a few seconds. You can close this
          panel; the stage will update once it finishes.
        </div>
      )}
      <div className={styles.resultGrid}>
        <div>
          <div className={styles.walletLabel}>Model tier</div>
          <div style={{ marginTop: 4 }}>
            <ModelTierPill tier={result.modelTier} size="sm" />
          </div>
        </div>
        <div>
          <div className={styles.walletLabel}>Credits consumed</div>
          <div className={styles.walletValue} style={{ marginTop: 4 }}>
            {formatNumber(result.consumedCredits)}
          </div>
        </div>
        <div>
          <div className={styles.walletLabel}>Estimated</div>
          <div className={styles.walletValue} style={{ marginTop: 4 }}>
            {formatNumber(result.estimatedCredits)}
          </div>
        </div>
      </div>
      {result.errorMessage && (
        <div className={styles.error}>
          <Icon name="error" size={17} color="var(--color-danger)" />
          {result.errorMessage}
        </div>
      )}
    </div>
  );
}
