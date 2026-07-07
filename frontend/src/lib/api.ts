import axios, { AxiosError } from 'axios';
import type {
  AnalyzeResult,
  ApiErrorShape,
  DownloadRequestPayload,
  HistoryEntry,
  ProgressResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
});

export class ApiRequestError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiRequestError';
  }
}

function toApiError(err: unknown): ApiRequestError {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<ApiErrorShape>;
    if (e.response?.data?.error) {
      return new ApiRequestError(e.response.data.error, e.response.data.code, e.response.status);
    }
    if (e.code === 'ECONNABORTED') {
      return new ApiRequestError('The request took too long. Please try again.', 'TIMEOUT');
    }
    if (!e.response) {
      return new ApiRequestError(
        'Couldn’t reach the server. Check your connection.',
        'NETWORK_ERROR',
      );
    }
  }
  return new ApiRequestError('Something went wrong. Please try again.', 'UNKNOWN');
}

export async function analyzeUrl(url: string): Promise<AnalyzeResult> {
  try {
    const { data } = await api.post<AnalyzeResult>('/api/analyze', { url });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function startDownload(payload: DownloadRequestPayload): Promise<{ jobId: string }> {
  try {
    const { data } = await api.post<{ jobId: string; status: string }>('/api/download', payload);
    return { jobId: data.jobId };
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getProgress(jobId: string): Promise<ProgressResponse> {
  try {
    const { data } = await api.get<ProgressResponse>(`/api/progress/${jobId}`);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function cancelDownload(jobId: string): Promise<void> {
  try {
    await api.post(`/api/download/${jobId}/cancel`);
  } catch (err) {
    throw toApiError(err);
  }
}

export function fileDownloadUrl(jobId: string): string {
  return `${API_BASE}/api/download/file/${jobId}`;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  try {
    const { data } = await api.get<{ history: HistoryEntry[] }>('/api/history');
    return data.history;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function clearHistoryRemote(): Promise<void> {
  try {
    await api.delete('/api/history');
  } catch (err) {
    throw toApiError(err);
  }
}
