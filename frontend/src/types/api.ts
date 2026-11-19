/**
 * Shared API types used by the frontend.
 * These mirror the backend Prisma schema — keep them in sync.
 *
 * Note: The backend normalises ScanStatus to lowercase before returning.
 * The DB stores QUEUED/RUNNING/COMPLETED/FAILED (uppercase) internally.
 */

// ─── Scan ──────────────────────────────────────────────────────────────────
/** Lowercase, as returned by GET /api/scans/:id */
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed';
export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';
export type IssueSource = 'axe' | 'gemini';
export type FixType =
  | 'alt_text'
  | 'aria_label'
  | 'aria_role'
  | 'contrast'
  | 'heading_order'
  | 'label'
  | 'tabindex'
  | 'lang'
  | 'other';

export interface Scan {
  id: string;
  projectId: string | null;
  targetUrl: string;
  status: ScanStatus;
  score: number | null;
  screenshotUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  issues?: Issue[];
}

export interface Issue {
  id: string;
  scanId: string;
  ruleId: string;
  wcagCriteria: string | null;
  severity: IssueSeverity;
  selector: string;
  description: string;
  elementHtml: string | null;
  source: IssueSource;
  fix?: Fix | null;
}

export interface Fix {
  id: string;
  issueId: string;
  fixType: FixType;
  fixValue: string;
  explanation: string;
  status: string;
}

// ─── Scan API requests/responses ──────────────────────────────────────────
export interface CreateScanRequest {
  targetUrl: string;
  projectName?: string;
}

export interface CreateScanResponse {
  scanId: string;
  status: ScanStatus;
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}
