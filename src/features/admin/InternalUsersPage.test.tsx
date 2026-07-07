import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserResponse } from '@/shared/api';
import { renderWithProviders } from '@/test/utils';
import { InternalUsersPage } from './InternalUsersPage';

vi.mock('@/app/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const organizations = vi.fn();
const users = vi.fn();
const toggleMutate = vi.fn();

vi.mock('./hooks', () => ({
  useInternalOrganizations: () => organizations(),
  useInternalUsers: () => users(),
  useToggleManualExecution: () => ({ mutateAsync: toggleMutate, isPending: false }),
}));

const member: UserResponse = {
  id: 'u1',
  organizationId: 'o1',
  email: 'op@montanaritech.com',
  firstName: 'Op',
  lastName: 'Erator',
  role: 'CLIENT_ADMIN',
  status: 'ACTIVE',
  manualExecutionEnabled: false,
  createdAt: '2026-07-06T00:00:00Z',
};

describe('InternalUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizations.mockReturnValue({
      data: [{ id: 'o1', name: 'Montanari Tech', status: 'ACTIVE', createdAt: '2026-07-01T00:00:00Z' }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders the users with their manual-execution state', () => {
    users.mockReturnValue({ data: [member], isLoading: false, isError: false, error: null, refetch: vi.fn() });
    renderWithProviders(<InternalUsersPage />);

    expect(screen.getByText('op@montanaritech.com')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument();
  });

  it('confirms before toggling the capability', async () => {
    users.mockReturnValue({ data: [member], isLoading: false, isError: false, error: null, refetch: vi.fn() });
    toggleMutate.mockResolvedValueOnce({ ...member, manualExecutionEnabled: true });
    const user = userEvent.setup();
    renderWithProviders(<InternalUsersPage />);

    await user.click(screen.getByRole('button', { name: 'Enable' }));
    expect(screen.getByText('Enable manual execution?')).toBeInTheDocument();
    // The confirm dialog's primary button carries the same label.
    const dialogButtons = screen.getAllByRole('button', { name: 'Enable' });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    expect(toggleMutate).toHaveBeenCalledWith({ userId: 'u1', enabled: true });
  });

  it('shows the empty state when the organization has no users', () => {
    users.mockReturnValue({ data: [], isLoading: false, isError: false, error: null, refetch: vi.fn() });
    renderWithProviders(<InternalUsersPage />);

    expect(screen.getByText('No users')).toBeInTheDocument();
  });
});
