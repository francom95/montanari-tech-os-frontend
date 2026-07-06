import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { StageDocumentResponse } from '@/shared/api';
import { renderWithProviders } from '@/test/utils';
import { DiscoveryPage } from './DiscoveryPage';

vi.mock('@/features/projects/layout/ProjectLayout', () => ({
  useProjectContext: () => ({ project: { id: 'p1', name: 'Web Montanari' } }),
}));

const discoveryStage: StageDocumentResponse = {
  id: 's1',
  projectId: 'p1',
  stageKey: '01_discovery',
  title: 'Discovery',
  content: null, // freshly provisioned stage — backend returns null, not ''
  status: 'READY',
  version: 1,
  lockedReason: null,
  dependsOn: [],
  createdAt: '2026-07-05T00:00:00Z',
  updatedAt: '2026-07-05T00:00:00Z',
};

vi.mock('../hooks', () => ({
  useStages: () => ({ data: [discoveryStage], isLoading: false, isError: false, error: null, refetch: vi.fn() }),
}));

/**
 * Regression test: a freshly provisioned stage has content: null (not ''). The page must not
 * crash calling .trim() on it — this shipped broken and crashed the app on a real project.
 */
describe('DiscoveryPage', () => {
  it('renders the empty state instead of crashing when content is null', () => {
    renderWithProviders(<DiscoveryPage />);
    expect(screen.getByText('No discovery output yet')).toBeInTheDocument();
  });
});
