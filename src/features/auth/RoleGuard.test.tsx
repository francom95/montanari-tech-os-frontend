import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { UserResponse } from '@/shared/api';
import { RoleGuard } from './RoleGuard';

// Mock the auth context so we can drive the guard with any session state.
const mockAuth = vi.fn();
vi.mock('./AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

const clientUser = { role: 'CLIENT_USER' } as UserResponse;

function renderGuard(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route
          path="/internal/x"
          element={
            <RoleGuard allow={['MT_ADMIN', 'MT_REVIEWER', 'SYSTEM_ADMIN']}>
              <div>internal content</div>
            </RoleGuard>
          }
        />
        <Route path="/app/dashboard" element={<div>client home</div>} />
        <Route path="/login" element={<div>login screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoleGuard', () => {
  it('redirects a client user away from an internal route to their own home', () => {
    mockAuth.mockReturnValue({
      status: 'authenticated',
      user: clientUser,
      isInternal: false,
      hasRole: (...roles: string[]) => roles.includes('CLIENT_USER'),
    });
    renderGuard('/internal/x');
    expect(screen.getByText('client home')).toBeInTheDocument();
    expect(screen.queryByText('internal content')).not.toBeInTheDocument();
  });

  it('redirects an anonymous user to /login', () => {
    mockAuth.mockReturnValue({ status: 'anonymous', user: null, isInternal: false, hasRole: () => false });
    renderGuard('/internal/x');
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('renders children for an authorized internal user', () => {
    mockAuth.mockReturnValue({
      status: 'authenticated',
      user: { role: 'MT_ADMIN' } as UserResponse,
      isInternal: true,
      hasRole: (...roles: string[]) => roles.includes('MT_ADMIN'),
    });
    renderGuard('/internal/x');
    expect(screen.getByText('internal content')).toBeInTheDocument();
  });
});
