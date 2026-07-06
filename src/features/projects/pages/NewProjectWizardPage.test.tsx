import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { NewProjectWizardPage } from './NewProjectWizardPage';

// AppShell reads the session; give it a client user.
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { firstName: 'Ada', lastName: 'Byron', role: 'CLIENT_USER' },
    hasRole: () => false,
    logout: vi.fn(),
  }),
}));

const mutateAsync = vi.fn();
vi.mock('../hooks', () => ({
  useCreateProject: () => ({ mutateAsync, isPending: false }),
}));

describe('NewProjectWizardPage', () => {
  it('blocks step 1 → 2 until type and name are provided, then advances', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewProjectWizardPage />);

    // Try to continue with nothing filled.
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByText('Select a project type')).toBeInTheDocument();
    expect(screen.getByText('Project name is required')).toBeInTheDocument();

    // Fill step 1.
    await user.click(screen.getByRole('button', { name: 'SaaS' }));
    await user.type(screen.getByLabelText('Project name'), 'Pilot project');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 is now visible.
    expect(await screen.findByText('Risk tags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
  });
});
