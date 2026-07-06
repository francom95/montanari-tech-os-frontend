import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppError } from '@/shared/api';
import { Button } from '@/shared/components';
import logoWhite from '@/assets/logo-white.png';
import { useAuth } from '../AuthContext';
import { authApi } from '../api/authApi';
import styles from './authLayout.module.css';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

const INTERNAL_ROLES = ['MT_REVIEWER', 'MT_ADMIN', 'SYSTEM_ADMIN'];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const tokens = await authApi.login(values);
      const user = await login(tokens.accessToken, tokens.refreshToken);
      // params.get() already URL-decodes the value once — decoding it again here would throw on
      // a value like "%25" (a lone "%" after the first decode) and, since that's inside this same
      // try block, would falsely report "Could not sign in" even though login just succeeded.
      const from = params.get('from');
      if (from) navigate(from, { replace: true });
      else navigate(INTERNAL_ROLES.includes(user.role) ? '/internal/reviews' : '/app/dashboard', {
        replace: true,
      });
    } catch (err) {
      setFormError(
        err instanceof AppError && err.code === 'INVALID_CREDENTIALS'
          ? 'Incorrect email or password.'
          : err instanceof AppError
            ? err.message
            : 'Could not sign in. Try again.',
      );
    }
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.brandPane}>
        <img src={logoWhite} alt="Montanari" />
        <div>
          <div className={styles.pitch}>The control center for AI-assisted software production.</div>
          <div className={styles.sub}>
            Order, traceability, credits and human review — every stage of your build, delegated to
            the right model and accountable end to end.
          </div>
        </div>
        <div className={styles.meta}>montanari-tech.com · SOC 2 Type II</div>
      </div>

      <div className={styles.formPane}>
        <div className={styles.card}>
          <h1 className={styles.h1}>Sign in</h1>
          <p className={styles.lead}>Welcome back. Enter your credentials to continue.</p>

          {formError && <div className={styles.formError}>{formError}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                {...register('email')}
              />
              {errors.email && <div className={styles.err}>{errors.email.message}</div>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                {...register('password')}
              />
              {errors.password && <div className={styles.err}>{errors.password.message}</div>}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              style={{ width: '100%', height: 42, marginTop: 4 }}
            >
              Sign in
            </Button>
          </form>

          <div className={styles.footer}>
            Access is provisioned by your organization admin.
          </div>
        </div>
      </div>
    </div>
  );
}
