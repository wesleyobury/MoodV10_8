export interface ApiResponse<T = any> { data: T | null; error: any; status: number; ok: boolean; isNetworkError?: boolean }
export async function apiFetch<T = any>(path: string, options: any = {}): Promise<ApiResponse<T>> {
  const { timeoutMs, ...o } = options;
  try {
    const res = await fetch(path, { ...o, headers: { 'Content-Type': 'application/json', ...(o.headers || {}) } });
    const text = await res.text(); let json: any = null; try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) return { data: null, error: json?.detail || json?.message || text, status: res.status, ok: false };
    return { data: json, error: null, status: res.status, ok: true };
  } catch (e) { return { data: null, error: 'net', status: 0, ok: false, isNetworkError: true }; }
}
export async function authFetch<T = any>(path: string, token: string, options: any = {}) { return apiFetch<T>(path, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } }); }
