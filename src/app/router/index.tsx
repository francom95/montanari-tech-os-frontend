import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { UserRole } from '@/shared/api';
import { RoleGuard } from '@/features/auth';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ProjectListPage } from '@/features/projects/pages/ProjectListPage';
import { NewProjectWizardPage } from '@/features/projects/pages/NewProjectWizardPage';
import { ProjectLayout } from '@/features/projects/layout/ProjectLayout';
import { ProjectOverviewPage } from '@/features/projects/pages/ProjectOverviewPage';
import { StageTimelinePage } from '@/features/stages/pages/StageTimelinePage';
import { StageDocumentEditorPage } from '@/features/stages/pages/StageDocumentEditorPage';
import { DiscoveryPage } from '@/features/stages/pages/DiscoveryPage';
import { MaterialsPage } from '@/features/materials/MaterialsPage';
import { WorkspaceCreditsPage } from '@/features/credits/pages/WorkspaceCreditsPage';
import { ProjectCreditsTab } from '@/features/credits/pages/ProjectCreditsTab';
import { ExportPage } from '@/features/exports/ExportPage';
import { ReviewQueuePage } from '@/features/reviews/pages/ReviewQueuePage';
import { ReviewDetailPage } from '@/features/reviews/pages/ReviewDetailPage';
import { AuditLogPage } from '@/features/auditLogs/AuditLogPage';
import { TeamPage } from '@/features/team/TeamPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { StageTemplatesPage } from '@/features/admin/StageTemplatesPage';
import { ModelPoliciesPage } from '@/features/admin/ModelPoliciesPage';
import { InternalUsersPage } from '@/features/admin/InternalUsersPage';

const CLIENT_ROLES: UserRole[] = ['CLIENT_USER', 'CLIENT_ADMIN'];
const INTERNAL_ROLES: UserRole[] = ['MT_REVIEWER', 'MT_ADMIN', 'SYSTEM_ADMIN'];
const ADMIN_ROLES: UserRole[] = ['MT_ADMIN', 'SYSTEM_ADMIN'];

const clientGuard = (el: React.ReactNode) => <RoleGuard allow={CLIENT_ROLES}>{el}</RoleGuard>;
const internalGuard = (el: React.ReactNode, roles: UserRole[] = INTERNAL_ROLES) => (
  <RoleGuard allow={roles}>{el}</RoleGuard>
);

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/dashboard" replace /> },

  // Public (registration is admin-only — no self-service signup route)
  { path: '/login', element: <LoginPage /> },

  // Client zone
  { path: '/app', element: clientGuard(<Navigate to="/app/dashboard" replace />) },
  { path: '/app/dashboard', element: clientGuard(<DashboardPage />) },
  { path: '/app/projects', element: clientGuard(<ProjectListPage />) },
  { path: '/app/projects/new', element: clientGuard(<NewProjectWizardPage />) },

  // Project detail (nested layout: shell + ProjectHeader tabs + outlet)
  {
    path: '/app/projects/:projectId',
    element: clientGuard(<ProjectLayout />),
    children: [
      { index: true, element: <ProjectOverviewPage /> },
      { path: 'stages', element: <StageTimelinePage /> },
      { path: 'stages/:stageKey', element: <StageDocumentEditorPage /> },
      { path: 'materials', element: <MaterialsPage /> },
      { path: 'intake', element: <DiscoveryPage /> },
      { path: 'credits', element: <ProjectCreditsTab /> },
      { path: 'exports', element: <ExportPage /> },
    ],
  },

  { path: '/app/credits', element: clientGuard(<WorkspaceCreditsPage />) },
  { path: '/app/team', element: <RoleGuard allow={['CLIENT_ADMIN'] as UserRole[]}><TeamPage /></RoleGuard> },
  { path: '/app/settings', element: clientGuard(<SettingsPage />) },

  // Internal zone
  { path: '/internal', element: internalGuard(<Navigate to="/internal/reviews" replace />) },
  { path: '/internal/reviews', element: internalGuard(<ReviewQueuePage />) },
  { path: '/internal/reviews/:reviewId', element: internalGuard(<ReviewDetailPage />) },
  { path: '/internal/stage-templates', element: internalGuard(<StageTemplatesPage />, ADMIN_ROLES) },
  { path: '/internal/model-policies', element: internalGuard(<ModelPoliciesPage />, ADMIN_ROLES) },
  { path: '/internal/users', element: internalGuard(<InternalUsersPage />, ADMIN_ROLES) },
  { path: '/internal/audit-logs', element: internalGuard(<AuditLogPage />, ADMIN_ROLES) },

  { path: '*', element: <Navigate to="/" replace /> },
]);
