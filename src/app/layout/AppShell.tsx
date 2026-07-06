import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button, Icon } from '@/shared/components';
import logoBlack from '@/assets/logo-black.png';
import { CLIENT_NAV, INTERNAL_NAV, type NavGroup } from './navConfig';
import styles from './AppShell.module.css';

export interface AppShellProps {
  zone: 'client' | 'internal';
  title: string;
  breadcrumb?: string[];
  primaryAction?: { label: string; icon?: string; onClick: () => void };
  children: ReactNode;
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function AppShell({ zone, title, breadcrumb, primaryAction, children }: AppShellProps) {
  const { user, hasRole, logout } = useAuth();
  const navigate = useNavigate();
  const groups: NavGroup[] = zone === 'internal' ? INTERNAL_NAV : CLIENT_NAV;

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src={logoBlack} alt="Montanari" />
        </div>

        {groups.map((group) => {
          const items = group.items.filter((i) => !i.roles || hasRole(...i.roles));
          if (items.length === 0) return null;
          return (
            <nav className={styles.navGroup} key={group.heading} aria-label={group.heading}>
              <div className={styles.navHeading}>{group.heading}</div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')
                  }
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          );
        })}

        <div className={styles.spacer} />

        {user && (
          <div className={styles.userCard}>
            <div className={styles.avatar}>{initials(user.firstName, user.lastName)}</div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>
                {user.firstName} {user.lastName}
              </div>
              <div className={styles.userRole}>{user.role}</div>
            </div>
            <button
              className={styles.navItem}
              style={{ width: 'auto', padding: 6 }}
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        )}
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div style={{ minWidth: 0 }}>
            {breadcrumb && breadcrumb.length > 0 && (
              <div className={styles.crumb}>
                {breadcrumb.map((c, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <Icon name="chevron_right" size={14} color="var(--color-text-muted)" />}
                    {c}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.title}>{title}</div>
          </div>
          <div style={{ flex: 1 }} />
          {primaryAction && (
            <Button variant="primary" icon={primaryAction.icon} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
