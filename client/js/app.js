// app.js — Main application entrypoint, routing, and UI lifecycle
import { storage } from './storage.js';
import { renderDashboard } from './dashboard.js';
import { renderLibrary } from './library.js';
import { renderAddBook } from './addBook.js';
import { renderFavorites } from './favorites.js';
import { renderReadingList } from './readingList.js';
import { renderHistory } from './history.js';
import { renderStatistics } from './statistics.js';
import { openBookDetail } from './bookDetail.js';
import { openEditModal } from './editBook.js';

// ---- 1. Theme Management -----------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

function initTheme() {
  const saved = storage.get('theme', 'light');
  applyTheme(saved);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      storage.set('theme', next);
      applyTheme(next);
    });
  }
}

// ---- 2. Mobile Sidebar & Navigation -----------------------
function initMobileNavigation() {
  const menuBtn = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking a link on mobile
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        }
      });
    });
  }
}

// ---- 3. Modal System ---------------------------------------
function initModal() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');

  if (overlay && closeBtn) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        overlay.classList.remove('open');
      }
    });
  }
}

// ---- 4. Hash-based Single Page Application Router ---------
function updateActiveNavLink(pageName) {
  document.querySelectorAll('.sidebar li a').forEach(a => {
    if (a.dataset.page === pageName) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

function router() {
  const hash = location.hash || '#/dashboard';
  const content = document.getElementById('content');
  if (!content) return;

  // Split path & query parameters
  const [rawRoute, queryString] = hash.slice(2).split('?');
  const route = (rawRoute || 'dashboard').toLowerCase();
  const params = new URLSearchParams(queryString || '');

  updateActiveNavLink(route);
  content.innerHTML = '';

  switch (route) {
    case 'dashboard':
      renderDashboard(content);
      break;
    case 'library':
      renderLibrary(content, params);
      break;
    case 'add-book':
      renderAddBook(content);
      break;
    case 'favorites':
      renderFavorites(content);
      break;
    case 'reading-list':
      renderReadingList(content);
      break;
    case 'history':
      renderHistory(content);
      break;
    case 'statistics':
      renderStatistics(content);
      break;
    default:
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>Halaman Tidak Ditemukan</h2>
          <p>Halaman yang Anda tuju tidak tersedia.</p>
          <a href="#/dashboard" class="btn btn-primary btn-sm">Kembali ke Dashboard</a>
        </div>
      `;
  }
}

// ---- 5. Global Custom Event Listeners ----------------------
window.addEventListener('open-detail', (e) => {
  if (e.detail) openBookDetail(e.detail);
});

window.addEventListener('open-edit', (e) => {
  if (e.detail) openEditModal(e.detail);
});

window.addEventListener('hashchange', router);

// ---- 6. Initialization on Load -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNavigation();
  initModal();
  router();
});
