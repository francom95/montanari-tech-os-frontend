import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppError } from '@/shared/api';
import { LoginPage } from './LoginPage';
import { authApi } from '../api/authApi';

vi.mock('../api/authApi', () => ({ authApi: { login: vi.fn() } }));
vi.mock('../AuthContext', () => ({ useAuth: () => ({ login: vi.fn() }) }));

const mockedLogin = vi.mocked(authApi.login);

function setup() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows validation errors when submitting empty', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('surfaces an invalid-credentials error from the API', async () => {
    mockedLogin.mockRejectedValueOnce(
      new AppError({ code: 'INVALID_CREDENTIALS', message: 'bad', status: 401 }),
    );
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
  });
});
