import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExecuteStageRequest, ManualExportRequest, StageExecutionResponse } from '@/shared/api';
import { stageKeys } from '@/features/stages/hooks';
import { projectKeys } from '@/features/projects/hooks';
import { creditKeys } from '@/features/credits/hooks';
import { executionsApi } from './api/executionsApi';

export const executionKeys = {
  list: (projectId: string) => ['executions', projectId] as const,
  preview: (projectId: string, stageKey: string) =>
    ['execution-preview', projectId, stageKey] as const,
};

/** Drives the 1.5s fast-poll — deliberately EXCLUDES 'AWAITING_IMPORT': a manual execution can
 * wait hours or days for the user to come back with the external result, and hammering the API
 * the whole time would be pure waste. */
const ACTIVE_STATUSES = new Set(['PENDING', 'RUNNING']);

/** Drives the invalidation cascade — INCLUDES 'AWAITING_IMPORT', so an import/cancel done in
 * another tab still refreshes stage/wallet/project on the next natural refetch. */
const NON_TERMINAL_STATUSES = new Set(['PENDING', 'RUNNING', 'AWAITING_IMPORT']);

/**
 * Execution now dispatches asynchronously (StageExecutionRunner) — a stage document, wallet, or
 * report doesn't reflect the run until it lands on a terminal status, which can happen well after
 * the POST that kicked it off returns. This hook self-polls while anything is still
 * PENDING/RUNNING, and invalidates the data every other screen depends on (stage, wallet, project)
 * the moment something it's watching transitions to a terminal status — so any component using this
 * hook gets live updates without wiring its own polling.
 */
export function useExecutions(projectId: string | undefined) {
  const qc = useQueryClient();
  const previousStatuses = useRef<Map<string, string>>(new Map());

  const query = useQuery({
    queryKey: executionKeys.list(projectId ?? ''),
    queryFn: () => executionsApi.list(projectId!),
    enabled: Boolean(projectId),
    refetchInterval: (q) => {
      const data = q.state.data as StageExecutionResponse[] | undefined;
      return data?.some((e) => ACTIVE_STATUSES.has(e.status)) ? 1500 : false;
    },
  });

  useEffect(() => {
    if (!projectId || !query.data) return;
    const justFinished = query.data.some((execution) => {
      const previous = previousStatuses.current.get(execution.id);
      return (
        previous != null &&
        NON_TERMINAL_STATUSES.has(previous) &&
        !NON_TERMINAL_STATUSES.has(execution.status)
      );
    });
    for (const execution of query.data) {
      previousStatuses.current.set(execution.id, execution.status);
    }
    if (justFinished) {
      qc.invalidateQueries({ queryKey: stageKeys.all(projectId) });
      qc.invalidateQueries({ queryKey: creditKeys.wallet() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    }
  }, [query.data, projectId, qc]);

  return query;
}

/**
 * Read-only preview of the gate decision, model tier, and estimated cost for a stage — no
 * reservation, no persisted evaluation/delegation row. `enabled` should be false until the
 * execution panel is actually open; `staleTime: 0` re-fetches every time it opens since failure
 * counts and wallet balance can change between opens.
 */
export function useExecutionPreview(projectId: string, stageKey: string, enabled: boolean) {
  return useQuery({
    queryKey: executionKeys.preview(projectId, stageKey),
    queryFn: () => executionsApi.preview(projectId, stageKey),
    enabled,
    staleTime: 0,
  });
}

/**
 * Execute a stage. The response is the freshly-dispatched execution (status RUNNING) — the run
 * itself finishes on a background thread server-side, so only the executions list is invalidated
 * here to kick off polling; `useExecutions` takes care of refreshing stage/wallet/project data once
 * the run actually lands on a terminal status.
 */
export function useExecuteStage(projectId: string, stageKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExecuteStageRequest = {}) => executionsApi.execute(projectId, stageKey, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: executionKeys.list(projectId) });
    },
  });
}

/**
 * Exports the manual-execution prompt bundle: credits are reserved and the stage flips to RUNNING
 * server-side, so both the executions list and the stage queries need refreshing immediately.
 */
export function useManualExport(projectId: string, stageKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ManualExportRequest = {}) =>
      executionsApi.manualExport(projectId, stageKey, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: executionKeys.list(projectId) });
      qc.invalidateQueries({ queryKey: stageKeys.all(projectId) });
      qc.invalidateQueries({ queryKey: creditKeys.wallet() });
    },
  });
}

/** Import and cancel settle the execution synchronously — refresh everything at once. */
export function useManualImport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ executionId, content }: { executionId: string; content: string }) =>
      executionsApi.manualImport(projectId, executionId, content),
    onSuccess: () => invalidateAfterManualSettle(qc, projectId),
  });
}

export function useManualCancel(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (executionId: string) => executionsApi.manualCancel(projectId, executionId),
    onSuccess: () => invalidateAfterManualSettle(qc, projectId),
  });
}

function invalidateAfterManualSettle(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: executionKeys.list(projectId) });
  qc.invalidateQueries({ queryKey: stageKeys.all(projectId) });
  qc.invalidateQueries({ queryKey: creditKeys.wallet() });
  qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
}
