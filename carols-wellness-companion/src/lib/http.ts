// Small client-side fetch helper. Throws with a friendly message on failure.

export async function apiPost<T = unknown>(url: string, body?: unknown): Promise<T> {
  return request<T>('POST', url, body);
}
export async function apiPut<T = unknown>(url: string, body?: unknown): Promise<T> {
  return request<T>('PUT', url, body);
}
export async function apiDelete<T = unknown>(url: string, body?: unknown): Promise<T> {
  return request<T>('DELETE', url, body);
}
export async function apiGet<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status}).`;
}
