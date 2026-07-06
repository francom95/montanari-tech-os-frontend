import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '@/shared/api';
import { LoadingState } from '@/shared/components';
import { useAuth } from './AuthContext';

/**
 * Route guard. Redirects anonymous users to /login (preserving intended path), and
 * users without one of `allow` roles to their home zone. Renders children only when
 * the session is resolved and authorized.
 */
export function RoleGuard({ allow, children }: { allow?: UserRole[]; children: ReactNode }) {
  const { status, user, isInternal } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState label="Restoring session…" minHeight={400} />;

  if (status === 'anonymous' || !user) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    // Send them to the home of the zone they belong to.
    return <Navigate to={isInternal ? '/internal/reviews' : '/app/dashboard'} replace />;
  }

  return <>{children}</>;
}

/** Inline permission gate — renders children only if the current user has one of the roles. */
export function PermissionGate({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const { hasRole } = useAuth();
  return hasRole(...allow) ? <>{children}</> : null;
}
