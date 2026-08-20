// Client-side API helpers for the CRM.
// All requests include credentials for session cookies.

const BASE = '/api/v1';

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: Record<string, any>;
};

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Network error' }));
  return data as ApiResponse<T>;
}

export const api = {
  // Generic data CRUD
  list: <T = any>(entity: string, params?: Record<string, string | number | undefined>) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as any).toString() : '';
    return request<T[]>(`/data/${entity}${qs}`);
  },
  get: <T = any>(entity: string, id: string) => request<T>(`/data/${entity}/${id}`),
  create: <T = any>(entity: string, data: any) => request<T>(`/data/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
  update: <T = any>(entity: string, id: string, data: any) => request<T>(`/data/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: <T = any>(entity: string, id: string) => request<T>(`/data/${entity}/${id}`, { method: 'DELETE' }),

  // 360 views
  student360: (id: string) => request<any>(`/student-360/${id}`),
  lead360: (id: string) => request<any>(`/lead-360/${id}`),

  // Actions
  action: (name: string, data: any) => request<any>(`/actions/${name}`, { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard & me
  dashboard: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/dashboard${qs}`);
  },
  me: () => request<any>(`/me`),

  // Global search
  search: (q: string) => request<any>(`/global-search?q=${encodeURIComponent(q)}`),

  // Options (dropdown lists)
  options: (type: string) => request<any[]>(`/options?type=${type}`),
};
