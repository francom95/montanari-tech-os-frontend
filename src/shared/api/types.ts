/**
 * API contract types — derived directly from the backend DTOs and domain enums
 * (com.montanaritech.os.*). These are the SAME contract the backend defines; they
 * are hand-derived only as an interim until we regenerate from the live OpenAPI spec
 * (`npm run gen:api` once the backend is running — see package.json). Do not add
 * fields the backend doesn't return.
 */

// ---- Enums (mirror backend domain enums) ----

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'AUTHENTICATION_REQUIRED'
  | 'ACCOUNT_DISABLED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'NOT_ENOUGH_CREDITS'
  | 'EXECUTION_BLOCKED'
  | 'INTERNAL_ERROR';

export type UserRole =
  | 'CLIENT_USER'
  | 'CLIENT_ADMIN'
  | 'MT_REVIEWER'
  | 'MT_ADMIN'
  | 'SYSTEM_ADMIN';

export type UserStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';

export type ProjectType =
  | 'INSTITUTIONAL_WEB'
  | 'LANDING_PAGE'
  | 'INTERNAL_SYSTEM'
  | 'MOBILE_APP'
  | 'MARKETPLACE'
  | 'SAAS'
  | 'ERP'
  | 'BOOKING_SYSTEM'
  | 'EVENT_SYSTEM'
  | 'AI_SYSTEM'
  | 'AUTOMATION'
  | 'LEGACY_MIGRATION';

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export type ProjectRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskTag = 'PAYMENTS' | 'HEALTH' | 'PERSONAL_DATA';

export type StageStatus =
  | 'DRAFT'
  | 'LOCKED'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_HUMAN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED';

export type ModelTier =
  | 'FABLE_5'
  | 'CODING_STANDARD_MODEL'
  | 'CHEAP_FAST_MODEL'
  | 'DESIGN_MODEL'
  | 'CLAUDE_DESIGN'
  | 'QA_MODEL'
  | 'SECURITY_MODEL'
  | 'HUMAN_REVIEW';

export type StageExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'AWAITING_IMPORT'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'CANCELLED';

export type ExecutionMode = 'AUTOMATIC' | 'MANUAL';

export type CreditTransactionType =
  | 'TOP_UP'
  | 'RESERVE'
  | 'CONSUME'
  | 'RELEASE'
  | 'ADJUSTMENT'
  | 'HUMAN_REVIEW_FEE';

export type HumanReviewStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type MaterialType =
  | 'FILE'
  | 'LINK'
  | 'PDF'
  | 'IMAGE'
  | 'AUDIO'
  | 'LOGO'
  | 'REFERENCE';

export type MaterialStatus = 'UPLOADED' | 'TEXT_EXTRACTED' | 'FAILED';

export type ExportJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type AuditAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'MATERIAL_UPLOADED'
  | 'MATERIAL_DELETED'
  | 'STAGE_DOCUMENT_EDITED'
  | 'STAGE_EXECUTION_STARTED'
  | 'STAGE_EXECUTION_COMPLETED'
  | 'CREDITS_CONSUMED'
  | 'CREDITS_TOPPED_UP'
  | 'CREDITS_ADJUSTED'
  | 'HUMAN_REVIEW_REQUESTED'
  | 'HUMAN_REVIEW_APPROVED'
  | 'HUMAN_REVIEW_REJECTED'
  | 'EXPORT_COMPLETED'
  | 'EXPORT_FAILED';

// ---- Error envelope (shared/exception/ApiError) ----

export interface ApiError {
  code: ErrorCode;
  message: string;
  details: string[] | null;
  traceId: string | null;
  timestamp: string;
}

// ---- Spring Pageable page shape (for Page<T> endpoints) ----

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index (0-based)
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

// ---- Auth ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: string; // "Bearer"
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
  allDevices: boolean;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ---- Users / Organizations ----

export interface UserResponse {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  manualExecutionEnabled: boolean;
  createdAt: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  status: OrganizationStatus;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
}

// ---- Projects ----

export interface ProjectResponse {
  id: string;
  organizationId: string;
  name: string;
  projectType: ProjectType;
  businessObjective: string | null;
  status: ProjectStatus;
  riskLevel: ProjectRiskLevel;
  riskTags: RiskTag[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  projectType: ProjectType;
  businessObjective?: string | null;
  riskLevel?: ProjectRiskLevel | null;
  riskTags?: RiskTag[] | null;
}

export interface UpdateProjectRequest {
  name: string;
  businessObjective?: string | null;
  status: ProjectStatus;
  riskLevel: ProjectRiskLevel;
  riskTags?: RiskTag[] | null;
}

// ---- Execution preview (read-only, no side effects) ----

export type FableGateDecision = 'FABLE_REQUIRED' | 'DELEGATE';

export interface ExecutionPreviewResponse {
  gateDecision: FableGateDecision;
  modelTier: ModelTier;
  routingReason: string;
  estimatedCredits: number;
  maxCreditsPerExecution: number;
  exceedsCap: boolean;
  requiresHumanReview: boolean;
}

// ---- Stage documents ----

export interface StageDocumentResponse {
  id: string;
  projectId: string;
  stageKey: string;
  title: string;
  content: string | null;
  status: StageStatus;
  version: number;
  lockedReason: string | null;
  dependsOn: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStageDocumentContentRequest {
  content: string;
}

// ---- Stage templates (admin) ----

export interface StageTemplateResponse {
  id: string;
  stageKey: string;
  name: string;
  description: string | null;
  templateContent: string | null;
  defaultModelTier: ModelTier;
  defaultCreditEstimate: number;
  maxCreditsPerExecution: number;
  requiresHumanReviewByDefault: boolean;
  gateReusableAsStandard: boolean;
  gateComplexArchitecture: boolean;
  gateSecuritySensitive: boolean;
  gateLegacyInvolved: boolean;
  dependsOn: string[];
  orderIndex: number;
  version: number;
  active: boolean;
}

// ---- Model policies (admin) ----

export interface ModelPolicyResponse {
  escalationThreshold: number;
  disabledTiers: ModelTier[];
  version: number;
  updatedAt: string;
}

export interface UpdateModelPolicyRequest {
  escalationThreshold: number;
  disabledTiers: ModelTier[];
}

export interface UpdateStageTemplateRequest {
  name: string;
  description: string | null;
  templateContent: string | null;
  defaultModelTier: ModelTier;
  defaultCreditEstimate: number;
  maxCreditsPerExecution: number;
  requiresHumanReviewByDefault: boolean;
  gateReusableAsStandard: boolean;
  gateComplexArchitecture: boolean;
  gateSecuritySensitive: boolean;
  gateLegacyInvolved: boolean;
  active: boolean;
}

// ---- Executions ----

export interface ExecuteStageRequest {
  highAmbiguity?: boolean | null;
  contradictions?: boolean | null;
  criticalReview?: boolean | null;
  overrideTier?: ModelTier | null;
  overrideReason?: string | null;
}

export interface StageExecutionResponse {
  id: string;
  projectId: string;
  stageDocumentId: string;
  modelTier: ModelTier;
  status: StageExecutionStatus;
  executionMode: ExecutionMode;
  estimatedCredits: number;
  consumedCredits: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

// ---- Manual (subscription-delegated) execution ----

export interface ManualExportRequest {
  highAmbiguity?: boolean | null;
  contradictions?: boolean | null;
  criticalReview?: boolean | null;
}

export interface ManualExecutionExportResponse {
  execution: StageExecutionResponse;
  bundleMarkdown: string;
  suggestedFileName: string;
}

export interface ManualBundleResponse {
  bundleMarkdown: string;
  suggestedFileName: string;
  status: StageExecutionStatus;
}

export interface ManualImportRequest {
  content: string;
}

export interface UpdateManualExecutionRequest {
  enabled: boolean;
}

// ---- Credits ----

export interface WalletResponse {
  organizationId: string;
  balance: number;
  reserved: number;
  available: number;
}

export interface CreditTransactionResponse {
  id: string;
  projectId: string | null;
  stageExecutionId: string | null;
  transactionType: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export interface TopUpRequest {
  organizationId: string;
  amount: number;
  description?: string | null;
}

export interface AdjustmentRequest {
  organizationId: string;
  amount: number;
  reason: string;
}

// ---- Reviews ----

export interface HumanReviewResponse {
  id: string;
  projectId: string;
  stageDocumentId: string;
  stageKey: string;
  requestedBy: string;
  assignedTo: string | null;
  status: HumanReviewStatus;
  riskReason: string | null;
  reviewNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RequestHumanReviewRequest {
  comment?: string | null;
}

export interface ResolveReviewRequest {
  notes?: string | null;
}

// ---- Materials ----

export interface MaterialResponse {
  id: string;
  projectId: string;
  materialType: MaterialType;
  fileName: string | null;
  sourceUrl: string | null;
  status: MaterialStatus;
  createdAt: string;
}

// ---- Exports ----

export interface ExportJobResponse {
  id: string;
  projectId: string;
  requestedBy: string;
  status: ExportJobStatus;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
}

// ---- Audit ----

export interface AuditLogResponse {
  id: string;
  organizationId: string;
  userId: string | null;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  metadata: string | null;
  createdAt: string;
}

// ---- Project reports (living MD reports) ----

export type ProjectReportKey = 'MODEL_DELEGATION' | 'FABLE_GATE_REPORT' | 'CLAUDE_MD';

export interface ProjectReportResponse {
  reportKey: ProjectReportKey;
  content: string;
  updatedAt: string;
}
