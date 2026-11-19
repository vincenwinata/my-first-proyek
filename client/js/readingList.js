// readingList.js — Reading List page (grouped by status)
import { booksAPI } from './api.js';
import { buildBookCard } from './ui.js';

export async function renderReadingList(container) {
  container.innerHTML = `
    <div class="page-heading"><h2>📋 Reading List</h2><p>Kelompokkan buku berdasarkan status membaca</p></div>
    <div class="tab-nav" id="rl-tabs">
      <button class="tab-btn active" data-status="">Semua</button>
      <button class="tab-btn" data-status="To Read">📖 To Read</button>
      <button class="tab-btn" data-status="Reading">📗 Reading</button>
      <button class="tab-btn" data-status="Completed">✅ Completed</button>
    </div>
    <div id="rl-list" class="book-grid"></div>
  `;

  const tabNav = container.querySelector('#rl-tabs');
  const listEl = container.querySelector('#rl-list');
  let allBooks = [];
  let activeStatus = '';

  async function load() {
    allBooks = await booksAPI.getAll();
    render();
  }

  function render() {
    let books = activeStatus ? allBooks.filter(b => b.readingStatus === activeStatus) : [...allBooks];
    listEl.innerHTML = '';
    if (!books.length) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>Tidak ada buku${activeStatus ? ' berstatus ' + activeStatus : ''}</h3></div>`;
      return;
    }
    books.forEach(b => listEl.appendChild(buildBookCard(b, { onRefresh: load })));
  }

  tabNav.addEventListener('click', e => {
    if (!e.target.classList.contains('tab-btn')) return;
    tabNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeStatus = e.target.dataset.status;
    render();
  });

  await load();
}
