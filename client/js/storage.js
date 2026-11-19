// storage.js — LocalStorage wrapper
const PREFIX = 'bookLibrary_';

export const storage = {
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
    catch (e) { console.warn('storage.set error', e); }
  },
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem(PREFIX + key); }
    catch (e) { /* ignore */ }
  }
};
