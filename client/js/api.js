// api.js — fetch wrapper and endpoint helpers
const BASE = '/api';

async function request(url, opts = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const booksAPI = {
  getAll:          ()          => request('/books'),
  get:             (id)        => request(`/books/${id}`),
  create:          (data)      => request('/books',           { method: 'POST',   body: JSON.stringify(data) }),
  update:          (id, data)  => request(`/books/${id}`,     { method: 'PUT',    body: JSON.stringify(data) }),
  remove:          (id)        => request(`/books/${id}`,     { method: 'DELETE' }),
  toggleFavorite:  (id)        => request(`/books/${id}/favorite`, { method: 'PATCH' }),
  updateStatus:    (id, s, note = null) => request(`/books/${id}/status`,   { method: 'PATCH', body: JSON.stringify({ readingStatus: s, note }) }),
  updateRating:    (id, r)     => request(`/books/${id}/rating`,   { method: 'PATCH', body: JSON.stringify({ rating: r }) }),
  getHistory:      (id)        => request(`/books/${id}/history`),
};

export const historyAPI = {
  getAll:     ()         => request('/history'),
  updateNote: (id, note) => request(`/history/${id}/note`, { method: 'PATCH', body: JSON.stringify({ note }) }),
};

export const statsAPI = {
  get: () => request('/statistics'),
};

export const searchAPI = {
  google: (q, type = 'all') => request(`/external-books?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`),
};
