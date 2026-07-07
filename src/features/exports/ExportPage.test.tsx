import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AppError } from '@/shared/api';
import { renderWithProviders } from '@/test/utils';
import { ExportPage } from './ExportPage';

vi.mock('@/features/projects/layout/ProjectLayout', () => ({
  useProjectContext: () => ({ project: { id: 'p1', name: 'Web Montanari' } }),
}));

const useExports = vi.fn();
const useCreateExport = vi.fn();
const useProjectReport = vi.fn();

vi.mock('./hooks', () => ({
  useExports: (...args: unknown[]) => useExports(...args),
  useCreateExport: (...args: unknown[]) => useCreateExport(...args),
  useProjectReport: (...args: unknown[]) => useProjectReport(...args),
}));

describe('ExportPage — CLAUDE.md preview', () => {
  beforeEach(() => {
    useExports.mockReturnValue({ data: [], isLoading: false, isError: false, error: null, refetch: vi.fn() });
    useCreateExport.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it('shows the report content once loaded', async () => {
    useProjectReport.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: { reportKey: 'CLAUDE_MD', content: '# Web Montanari\n\n## Arquitectura y stack\n\nMonolito modular.', updatedAt: '2026-07-06T20:00:00Z' },
      refetch: vi.fn(),
    });
    renderWithProviders(<ExportPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview CLAUDE.md' }));

    await waitFor(() => expect(screen.getByText('Arquitectura y stack')).toBeInTheDocument());
  });

  it('shows a dedicated empty state when no stage has been approved yet, instead of a scary error', async () => {
    useProjectReport.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new AppError({ code: 'NOT_FOUND', message: "Report 'CLAUDE_MD' not found for project", status: 404 }),
      data: undefined,
      refetch: vi.fn(),
    });
    renderWithProviders(<ExportPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview CLAUDE.md' }));

    await waitFor(() => expect(screen.getByText('No CLAUDE.md yet')).toBeInTheDocument());
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
