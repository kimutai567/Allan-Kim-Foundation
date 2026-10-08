const BASE = '/api';

export async function api(path, { method = 'GET', body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('akf_token');
  if (admin && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && admin) {
    localStorage.removeItem('akf_token');
    window.location.href = '/admin/login';
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const kes = n => 'KES ' + Number(n || 0).toLocaleString();
