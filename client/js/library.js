// library.js — My Library page (grid/list, search, filter, sort)
import { booksAPI } from './api.js';
import { buildBookCard } from './ui.js';
import { storage } from './storage.js';

export async function renderLibrary(container, params) {
  container.innerHTML = `
    <div class="page-heading"><h2>My Library</h2><p>Kelola semua buku dalam koleksi Anda</p></div>
    <div class="toolbar">
      <input type="text" id="lib-search" placeholder="🔍 Cari judul atau penulis…" />
      <select id="lib-status"><option value="">Semua Status</option><option value="To Read">To Read</option><option value="Reading">Reading</option><option value="Completed">Completed</option></select>
      <select id="lib-category"><option value="">Semua Kategori</option></select>
      <select id="lib-sort"><option value="newest">Terbaru</option><option value="title">Judul A–Z</option><option value="rating">Rating Tertinggi</option></select>
      <button class="view-toggle" id="lib-view">Grid</button>
    </div>
    <div id="lib-list" class="book-grid"></div>
  `;

  const searchEl   = container.querySelector('#lib-search');
  const statusEl   = container.querySelector('#lib-status');
  const catEl      = container.querySelector('#lib-category');
  const sortEl     = container.querySelector('#lib-sort');
  const viewBtn    = container.querySelector('#lib-view');
  const listEl     = container.querySelector('#lib-list');

  // apply URL params
  if (params && params.get('status')) statusEl.value = params.get('status');

  // restore prefs
  const savedView = storage.get('view', 'grid');
  viewBtn.textContent = savedView === 'grid' ? 'List' : 'Grid';
  if (savedView === 'list') listEl.classList.add('book-list-view');

  let allBooks = [];

  async function loadBooks() {
    try {
      allBooks = await booksAPI.getAll();
      // populate category filter
      const cats = [...new Set(allBooks.map(b => b.category).filter(Boolean))];
      catEl.innerHTML = '<option value="">Semua Kategori</option>';
      cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catEl.appendChild(o); });
      render();
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Gagal memuat buku</h3><p>${err.message}</p></div>`;
    }
  }

  function render() {
    const keyword  = searchEl.value.trim().toLowerCase();
    const status   = statusEl.value;
    const category = catEl.value;
    const sort     = sortEl.value;

    let books = [...allBooks];
    if (keyword) books = books.filter(b => b.title.toLowerCase().includes(keyword) || (b.authors||[]).join(' ').toLowerCase().includes(keyword));
    if (status)  books = books.filter(b => b.readingStatus === status);
    if (category) books = books.filter(b => b.category === category);

    if (sort === 'title')   books.sort((a,b) => a.title.localeCompare(b.title));
    if (sort === 'newest')  books.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'rating')  books.sort((a,b) => (b.rating||0) - (a.rating||0));

    // save last filter
    storage.set('lastFilter', { status, category, sort });

    listEl.innerHTML = '';
    if (!books.length) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>Tidak ada buku ditemukan</h3><p>Coba ubah filter atau tambahkan buku baru.</p><a href="#/add-book" class="btn btn-primary btn-sm">➕ Tambah Buku</a></div>`;
      return;
    }
    books.forEach(b => listEl.appendChild(buildBookCard(b, { onRefresh: loadBooks })));
  }

  // events
  let debounce;
  searchEl.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(render, 300); });
  statusEl.addEventListener('change', render);
  catEl.addEventListener('change', render);
  sortEl.addEventListener('change', render);
  viewBtn.addEventListener('click', () => {
    const isGrid = !listEl.classList.toggle('book-list-view');
    viewBtn.textContent = isGrid ? 'List' : 'Grid';
    storage.set('view', isGrid ? 'grid' : 'list');
  });

  await loadBooks();
}
