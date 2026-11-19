import apiClient from './client';
import type { Scan, CreateScanResponse } from '../types/api';

export const scansApi = {
  create: (targetUrl: string, projectName?: string) =>
    apiClient.post<{ success: true; data: CreateScanResponse }>('/api/scans', { targetUrl, projectName }),
  
  getById: (scanId: string) =>
    apiClient.get<{ success: true; data: Scan }>(`/api/scans/${scanId}`),
  
  downloadPatch: (scanId: string) =>
    apiClient.get(`/api/scans/${scanId}/patch`, { responseType: 'blob' }),
  
  downloadReport: (scanId: string) =>
    apiClient.get(`/api/scans/${scanId}/report`, { responseType: 'blob' }),

  getPreviewUrl: (
    scanId: string,
    selector?: string,
    mode: 'after' | 'before' = 'after',
    highlights: boolean = true
  ) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
    const params = new URLSearchParams();
    if (selector) params.set('selector', selector);
    params.set('mode', mode);
    params.set('highlights', String(highlights));
    return `${baseUrl}/api/scans/${scanId}/preview?${params.toString()}`;
  },
};
