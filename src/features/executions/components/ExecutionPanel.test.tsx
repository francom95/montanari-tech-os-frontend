import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppError } from '@/shared/api';
import type { StageDocumentResponse, StageExecutionResponse } from '@/shared/api';
import { renderWithProviders } from '@/test/utils';
import { ExecutionPanel } from './ExecutionPanel';

// Wallet with plenty of headroom so the button is enabled; the backend still rejects.
vi.mock('@/features/credits/hooks', () => ({
  useWallet: () => ({ data: { organizationId: 'o', available: 1000, reserved: 0, balance: 1000 } }),
}));

const authUser = { manualExecutionEnabled: false };
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: authUser, hasRole: () => false, isInternal: false }),
}));

const mutateAsync = vi.fn();
const manualExportMutate = vi.fn();
const manualImportMutate = vi.fn();
const manualCancelMutate = vi.fn();
const executionsData: { current: StageExecutionResponse[] | undefined } = { current: undefined };

vi.mock('../hooks', () => ({
  useExecuteStage: () => ({ mutateAsync, isPending: false }),
  // No dependencies in the fixtures below → gate/tier preview isn't rendered, so an idle mock
  // (never resolves) is enough; these tests exercise the run/NOT_ENOUGH_CREDITS and
  // dependency-blocking paths, not the preview panel itself.
  useExecutionPreview: () => ({ data: undefined, isLoading: false, isError: false }),
  useExecutions: () => ({ data: executionsData.current, isLoading: false, isError: false }),
  useManualExport: () => ({ mutateAsync: manualExportMutate, isPending: false }),
  useManualImport: () => ({ mutateAsync: manualImportMutate, isPending: false }),
  useManualCancel: () => ({ mutateAsync: manualCancelMutate, isPending: false }),
}));

const stage: StageDocumentResponse = {
  id: 's1',
  projectId: 'p1',
  stageKey: '01_discovery',
  title: 'Discovery',
  content: '',
  status: 'READY',
  version: 1,
  lockedReason: null,
  dependsOn: [],
  createdAt: '2026-07-04T00:00:00Z',
  updatedAt: '2026-07-04T00:00:00Z',
};

const awaitingImportExecution: StageExecutionResponse = {
  id: 'e1',
  projectId: 'p1',
  stageDocumentId: 's1',
  modelTier: 'CHEAP_FAST_MODEL',
  status: 'AWAITING_IMPORT',
  executionMode: 'MANUAL',
  estimatedCredits: 10,
  consumedCredits: 0,
  errorMessage: null,
  startedAt: '2026-07-06T00:00:00Z',
  finishedAt: null,
};

describe('ExecutionPanel', () => {
  beforeEach(() => {
    authUser.manualExecutionEnabled = false;
    executionsData.current = undefined;
    vi.clearAllMocks();
  });

  it('shows the exact shortfall when the backend returns NOT_ENOUGH_CREDITS', async () => {
    mutateAsync.mockRejectedValueOnce(
      new AppError({ code: 'NOT_ENOUGH_CREDITS', message: 'Not enough credits: need 40 more', status: 402 }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <ExecutionPanel projectId="p1" stage={stage} allStages={[stage]} open onClose={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /reserve credits & run/i }));
    expect(await screen.findByText('Not enough credits: need 40 more')).toBeInTheDocument();
  });

  it('disables the run button when a dependency is not approved', () => {
    const blocked: StageDocumentResponse = { ...stage, dependsOn: ['00_contexto_general'] };
    const dep: StageDocumentResponse = { ...stage, id: 's0', stageKey: '00_contexto_general', status: 'READY' };
    renderWithProviders(
      <ExecutionPanel projectId="p1" stage={blocked} allStages={[blocked, dep]} open onClose={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /reserve credits & run/i })).toBeDisabled();
  });

  it('hides the manual-run button for users without the capability flag', () => {
    renderWithProviders(
      <ExecutionPanel projectId="p1" stage={stage} allStages={[stage]} open onClose={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: /run manually/i })).not.toBeInTheDocument();
  });

  it('offers the manual-run button to enabled users and exports the bundle', async () => {
    authUser.manualExecutionEnabled = true;
    manualExportMutate.mockResolvedValueOnce({
      execution: awaitingImportExecution,
      bundleMarkdown: '# bundle',
      suggestedFileName: 'manual-execution-01_discovery-e1.md',
    });
    const user = userEvent.setup();
    renderWithProviders(
      <ExecutionPanel projectId="p1" stage={stage} allStages={[stage]} open onClose={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /run manually/i }));
    expect(manualExportMutate).toHaveBeenCalled();
  });

  it('lands in the awaiting-import state (paste, upload, cancel) when a manual execution is pending', async () => {
    authUser.manualExecutionEnabled = true;
    executionsData.current = [awaitingImportExecution];
    manualImportMutate.mockResolvedValueOnce({
      ...awaitingImportExecution,
      status: 'SUCCEEDED',
      consumedCredits: 10,
    });
    const user = userEvent.setup();
    renderWithProviders(
      <ExecutionPanel projectId="p1" stage={stage} allStages={[stage]} open onClose={() => {}} />,
    );

    // Awaiting-import UI: guided steps, bundle actions, paste area, cancel + import buttons.
    expect(screen.getByText(/awaiting import/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download bundle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel manual run/i })).toBeInTheDocument();

    // Import is disabled until there's content, then goes through with the pasted text.
    const importButton = screen.getByRole('button', { name: /import result/i });
    expect(importButton).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/paste the complete reply/i), '# The reply');
    expect(importButton).toBeEnabled();
    await user.click(importButton);
    expect(manualImportMutate).toHaveBeenCalledWith({ executionId: 'e1', content: '# The reply' });
  });
});
