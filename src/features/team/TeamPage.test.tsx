import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserResponse } from '@/shared/api';
import { renderWithProviders } from '@/test/utils';
import { TeamPage } from './TeamPage';

vi.mock('@/app/layout/AppShell', () => ({
  AppShell: ({ children, primaryAction }: { children: React.ReactNode; primaryAction?: { label: string; onClick: () => void } }) => (
    <div>
      {primaryAction && <button onClick={primaryAction.onClick}>{primaryAction.label}</button>}
      {children}
    </div>
  ),
}));

vi.mock('@/features/auth', () => ({
  authApi: { register: vi.fn() },
}));

const currentUser = { id: 'me', role: 'CLIENT_ADMIN' as const };
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

const users = vi.fn();
const updateRoleMutate = vi.fn();
const updateStatusMutate = vi.fn();

vi.mock('./hooks', () => ({
  useOrgUsers: () => users(),
  useInvalidateUsers: () => vi.fn(),
  useUpdateUserRole: () => ({ mutateAsync: updateRoleMutate, isPending: false }),
  useUpdateUserStatus: () => ({ mutateAsync: updateStatusMutate, isPending: false }),
}));

const me: UserResponse = {
  id: 'me',
  organizationId: 'o1',
  email: 'me@example.com',
  firstName: 'Me',
  lastName: 'Self',
  role: 'CLIENT_ADMIN',
  status: 'ACTIVE',
  manualExecutionEnabled: false,
  createdAt: '2026-07-01T00:00:00Z',
};

const teammate: UserResponse = {
  id: 'u2',
  organizationId: 'o1',
  email: 'teammate@example.com',
  firstName: 'Team',
  lastName: 'Mate',
  role: 'CLIENT_USER',
  status: 'ACTIVE',
  manualExecutionEnabled: false,
  createdAt: '2026-07-01T00:00:00Z',
};

describe('TeamPage — role/status management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    users.mockReturnValue({ data: [me, teammate], isLoading: false, isError: false, error: null, refetch: vi.fn() });
  });

  it('hides the role selector and the deactivate button for the current user\'s own row', () => {
    renderWithProviders(<TeamPage />);

    // The teammate row has an editable role select and a Deactivate button; "me" only has a badge.
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    // "System Admin"/self badge for me — no select, no action button tied to my own row.
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
  });

  it('changes a teammate\'s role via the row select', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamPage />);

    await user.selectOptions(screen.getByRole('combobox'), 'CLIENT_ADMIN');

    expect(updateRoleMutate).toHaveBeenCalledWith({ userId: 'u2', role: 'CLIENT_ADMIN' });
  });

  it('confirms before deactivating a teammate', async () => {
    updateStatusMutate.mockResolvedValueOnce({ ...teammate, status: 'DISABLED' });
    const user = userEvent.setup();
    renderWithProviders(<TeamPage />);

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(screen.getByText('Deactivate user?')).toBeInTheDocument();

    const dialogButtons = screen.getAllByRole('button', { name: 'Deactivate' });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    expect(updateStatusMutate).toHaveBeenCalledWith({ userId: 'u2', status: 'DISABLED' });
  });
});
