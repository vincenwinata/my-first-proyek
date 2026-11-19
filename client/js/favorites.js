// favorites.js — Favorites page
import { booksAPI } from './api.js';
import { buildBookCard } from './ui.js';

export async function renderFavorites(container) {
  container.innerHTML = `
    <div class="page-heading"><h2>⭐ Favorites</h2><p>Buku yang Anda tandai sebagai favorit</p></div>
    <div class="toolbar">
      <input type="text" id="fav-search" placeholder="🔍 Cari favorit…" />
      <select id="fav-sort"><option value="newest">Terbaru</option><option value="title">Judul A–Z</option><option value="rating">Rating</option></select>
    </div>
    <div id="fav-list" class="book-grid"></div>
  `;

  const searchEl = container.querySelector('#fav-search');
  const sortEl   = container.querySelector('#fav-sort');
  const listEl   = container.querySelector('#fav-list');

  let allFavs = [];

  async function load() {
    const all = await booksAPI.getAll();
    allFavs = all.filter(b => b.isFavorite);
    render();
  }

  function render() {
    const kw   = searchEl.value.trim().toLowerCase();
    const sort = sortEl.value;
    let books  = [...allFavs];
    if (kw) books = books.filter(b => b.title.toLowerCase().includes(kw) || (b.authors||[]).join(' ').toLowerCase().includes(kw));
    if (sort === 'title')  books.sort((a,b) => a.title.localeCompare(b.title));
    if (sort === 'newest') books.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'rating') books.sort((a,b) => (b.rating||0) - (a.rating||0));

    listEl.innerHTML = '';
    if (!books.length) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⭐</div><h3>Belum ada favorit</h3><p>Tandai buku sebagai favorit dari halaman library.</p></div>';
      return;
    }
    books.forEach(b => listEl.appendChild(buildBookCard(b, { onRefresh: load })));
  }

  let debounce;
  searchEl.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(render, 300); });
  sortEl.addEventListener('change', render);

  await load();
}
