import { useEffect, useRef, useState } from 'react';
import { Modal, Button, Icon, Badge, ModelTierPill, useToast } from '@/shared/components';
import { AppError, isNotEnoughCredits, isExecutionBlocked, isForbidden } from '@/shared/api';
import type { StageDocumentResponse, StageExecutionResponse } from '@/shared/api';
import { formatNumber } from '@/shared/utils/format';
import { useWallet } from '@/features/credits/hooks';
import { useExecuteStage, useExecutionPreview, useExecutions } from '../hooks';
import styles from './ExecutionPanel.module.css';

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'CANCELLED']);

/**
 * Pre-flight + run panel for a stage. Shows the real Fable Gate decision, model tier, and
 * estimated cost via the read-only preview endpoint (no reservation, no persisted evaluation —
 * see StageExecutionFacade#preview) before the user confirms, then the real result after running.
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
  const { data: wallet } = useWallet();
  const execute = useExecuteStage(projectId, stage.stageKey);
  const executionsQuery = useExecutions(projectId);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [initialResult, setInitialResult] = useState<StageExecutionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const notifiedFor = useRef<string | null>(null);

  // The POST response only guarantees RUNNING — StageExecutionRunner finishes the run on a
  // background thread. `initialResult` covers the gap before the polling list query (useExecutions)
  // has refetched and includes this execution; once it does, the live, polled entry takes over.
  const result =
    executionId != null
      ? (executionsQuery.data?.find((e) => e.id === executionId) ?? initialResult)
      : null;

  useEffect(() => {
    if (result && TERMINAL_STATUSES.has(result.status) && notifiedFor.current !== result.id) {
      notifiedFor.current = result.id;
      if (result.status === 'SUCCEEDED') toast.success('Stage executed successfully.');
      else toast.error('Execution failed.');
    }
  }, [result, toast]);

  const statusByKey = new Map(allStages.map((s) => [s.stageKey, s.status]));
  const blockers = stage.dependsOn.filter((dep) => statusByKey.get(dep) !== 'APPROVED');
  const depsMet = blockers.length === 0;

  const preview = useExecutionPreview(projectId, stage.stageKey, open && depsMet && !result);

  const run = async () => {
    setErrorMsg(null);
    setExecutionId(null);
    setInitialResult(null);
    try {
      const res = await execute.mutateAsync({});
      setExecutionId(res.id);
      setInitialResult(res);
    } catch (err) {
      if (isNotEnoughCredits(err)) {
        setErrorMsg(err instanceof AppError ? err.message : 'Not enough credits to run this stage.');
      } else if (isExecutionBlocked(err)) {
        setErrorMsg(err instanceof AppError ? err.message : 'Execution is blocked by the Fable Gate.');
      } else if (isForbidden(err)) {
        setErrorMsg("You don't have permission to run this stage.");
      } else {
        setErrorMsg(err instanceof AppError ? err.message : 'Could not run the stage.');
      }
    }
  };

  const close = () => {
    setExecutionId(null);
    setInitialResult(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Run stage · ${stage.title}`}
      width={560}
      footer={
        result ? (
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close} disabled={execute.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon="play_arrow"
              onClick={run}
              loading={execute.isPending}
              disabled={!depsMet || preview.data?.exceedsCap === true}
            >
              Reserve credits &amp; run
            </Button>
          </>
        )
      }
    >
      {result ? (
        <ExecutionResult result={result} />
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
