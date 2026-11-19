/**
 * Shared TypeScript types used across the backend.
 * Keep this file free of runtime dependencies — types only.
 */

// ─── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Scan job queue entry ─────────────────────────────────────────────────────

export interface ScanJob {
  scanId: string;
  projectId: string;
  targetUrl: string;
  userId: string;
}

// ─── Pipeline context passed through all modules ─────────────────────────────

export interface PipelineContext {
  scanId: string;
  targetUrl: string;
  userId: string;
  projectId: string;
}
