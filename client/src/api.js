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

// Amounts are stored in KES; USD is derived from the admin-set rate.
let usdRate = 129;
export const setUsdRate = r => { if (Number(r) > 0) usdRate = Number(r); };
export const getUsdRate = () => usdRate;
export const usd = n => '$' + (Number(n || 0) / usdRate).toLocaleString(undefined, { maximumFractionDigits: 2 });
export const money = n => `${usd(n)} (${kes(n)})`;
