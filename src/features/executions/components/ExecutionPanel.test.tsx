import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppError } from '@/shared/api';
import type { StageDocumentResponse } from '@/shared/api';
import { renderWithProviders } from '@/test/utils';
import { ExecutionPanel } from './ExecutionPanel';

// Wallet with plenty of headroom so the button is enabled; the backend still rejects.
vi.mock('@/features/credits/hooks', () => ({
  useWallet: () => ({ data: { organizationId: 'o', available: 1000, reserved: 0, balance: 1000 } }),
}));

const mutateAsync = vi.fn();
vi.mock('../hooks', () => ({
  useExecuteStage: () => ({ mutateAsync, isPending: false }),
  // No dependencies in the fixtures below → gate/tier preview isn't rendered, so an idle mock
  // (never resolves) is enough; these tests exercise the run/NOT_ENOUGH_CREDITS and
  // dependency-blocking paths, not the preview panel itself.
  useExecutionPreview: () => ({ data: undefined, isLoading: false, isError: false }),
  // Neither test here reaches a successful dispatch, so the polling list never needs real data.
  useExecutions: () => ({ data: undefined, isLoading: false, isError: false }),
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

describe('ExecutionPanel', () => {
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
});
