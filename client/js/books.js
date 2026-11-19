// client/js/books.js
import { booksAPI, externalBooksAPI } from './api.js';
import { storage } from './storage.js';

// Utility to create a book card element
function createBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';
  const img = document.createElement('img');
  img.src = book.coverUrl || 'https://via.placeholder.com/80x120?text=No+Cover';
  img.alt = book.title;
  const info = document.createElement('div');
  info.className = 'info';
  const title = document.createElement('h3');
  title.textContent = book.title;
  const authors = document.createElement('p');
  authors.textContent = book.authors && book.authors.length ? `Penulis: ${book.authors.join(', ')}` : '';
  const actions = document.createElement('div');
  actions.className = 'actions';
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.onclick = () => openEditModal(book);
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Hapus';
  delBtn.onclick = () => deleteBook(book.id);
  const favBtn = document.createElement('button');
  favBtn.textContent = book.isFavorite ? '★' : '☆';
  favBtn.onclick = () => toggleFavorite(book.id);
  const statusSelect = document.createElement('select');
  ['To Read', 'Reading', 'Completed'].forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === book.readingStatus) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusSelect.onchange = () => updateStatus(book.id, statusSelect.value);

  actions.append(editBtn, delBtn, favBtn, statusSelect);
  info.append(title, authors);
  card.append(img, info, actions);
  return card;
}

async function loadAndRenderLibrary(container) {
  container.innerHTML = '<h2>My Library</h2><div id="books">Memuat...</div>';
  try {
    const books = await booksAPI.getAll();
    const listDiv = container.querySelector('#books');
    listDiv.innerHTML = '';
    books.forEach(b => listDiv.appendChild(createBookCard(b)));
  } catch (e) {
    container.querySelector('#books').textContent = 'Gagal memuat buku.';
    console.error(e);
  }
}

// ---------- Add / Edit Book ----------
function renderAddForm(container, draft = null) {
  container.innerHTML = `
    <h2>Tambah Buku</h2>
    <form id="add-book-form">
      <label>Judul*:<input type="text" name="title" required></label><br>
      <label>Penulis: <input type="text" name="authors"></label><br>
      <label>Kategori: <input type="text" name="category"></label><br>
      <label>Penerbit: <input type="text" name="publisher"></label><br>
      <label>Tahun terbit: <input type="text" name="publishedDate"></label><br>
      <label>ISBN: <input type="text" name="isbn"></label><br>
      <label>URL Cover: <input type="text" name="coverUrl"></label><br>
      <label>Deskripsi:<br><textarea name="description"></textarea></label><br>
      <button type="submit">Simpan</button>
    </form>
    <p><small>* wajib</small></p>
  `;
  const form = container.querySelector('#add-book-form');
  if (draft) {
    for (const [k, v] of Object.entries(draft)) {
      const field = form.elements.namedItem(k);
      if (field) field.value = v;
    }
  }
  // Save draft on each input change
  form.addEventListener('input', () => {
    const data = {
      title: form.title.value,
      authors: form.authors.value ? form.authors.value.split(',').map(s => s.trim()) : [],
      category: form.category.value,
      publisher: form.publisher.value,
      publishedDate: form.publishedDate.value,
      isbn: form.isbn.value,
      coverUrl: form.coverUrl.value,
      description: form.description.value,
    };
    storage.set('bookLibrary_bookDraft', data);
  });

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const data = {
      title: form.title.value.trim(),
      authors: form.authors.value ? form.authors.value.split(',').map(s => s.trim()) : [],
      category: form.category.value.trim() || null,
      publisher: form.publisher.value.trim() || null,
      publishedDate: form.publishedDate.value.trim() || null,
      isbn: form.isbn.value.trim() || null,
      coverUrl: form.coverUrl.value.trim() || null,
      description: form.description.value.trim() || null,
    };
    try {
      await booksAPI.create(data);
      storage.remove('bookLibrary_bookDraft');
      alert('Buku berhasil ditambahkan');
      location.hash = '#/library';
    } catch (e) {
      alert('Gagal menambahkan buku: ' + e.message);
    }
  });
}

function openEditModal(book) {
  // Simple edit reuse add form with pre‑filled data
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.padding = '20px';
  box.style.maxWidth = '500px';
  box.style.width = '100%';
  box.innerHTML = `
    <h3>Edit Buku</h3>
    <form id="edit-book-form">
      <label>Judul*:<input type="text" name="title" required></label><br>
      <label>Penulis: <input type="text" name="authors"></label><br>
      <label>Kategori: <input type="text" name="category"></label><br>
      <label>Penerbit: <input type="text" name="publisher"></label><br>
      <label>Tahun terbit: <input type="text" name="publishedDate"></label><br>
      <label>ISBN: <input type="text" name="isbn"></label><br>
      <label>URL Cover: <input type="text" name="coverUrl"></label><br>
      <label>Deskripsi:<br><textarea name="description"></textarea></label><br>
      <button type="submit">Simpan</button>
      <button type="button" id="cancel-edit">Batal</button>
    </form>
  `;
  modal.appendChild(box);
  document.body.appendChild(modal);
  const form = box.querySelector('#edit-book-form');
  // prefill
  form.title.value = book.title;
  form.authors.value = (book.authors || []).join(', ');
  form.category.value = book.category || '';
  form.publisher.value = book.publisher || '';
  form.publishedDate.value = book.publishedDate || '';
  form.isbn.value = book.isbn || '';
  form.coverUrl.value = book.coverUrl || '';
  form.description.value = book.description || '';

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const updated = {
      title: form.title.value.trim(),
      authors: form.authors.value ? form.authors.value.split(',').map(s => s.trim()) : [],
      category: form.category.value.trim() || null,
      publisher: form.publisher.value.trim() || null,
      publishedDate: form.publishedDate.value.trim() || null,
      isbn: form.isbn.value.trim() || null,
      coverUrl: form.coverUrl.value.trim() || null,
      description: form.description.value.trim() || null,
    };
    try {
      await booksAPI.update(book.id, updated);
      alert('Buku diperbarui');
      modal.remove();
      location.reload(); // quick refresh of list
    } catch (e) {
      alert('Gagal mengupdate: ' + e.message);
    }
  });
  box.querySelector('#cancel-edit').onclick = () => modal.remove();
}

async function deleteBook(id) {
  if (!confirm('Yakin ingin menghapus buku ini?')) return;
  try {
    await booksAPI.delete(id);
    alert('Buku dihapus');
    location.reload();
  } catch (e) {
    alert('Gagal menghapus: ' + e.message);
  }
}

async function toggleFavorite(id) {
  try {
    await booksAPI.toggleFavorite(id);
    location.reload();
  } catch (e) {
    alert('Gagal mengubah favorit: ' + e.message);
  }
}

async function updateStatus(id, status) {
  try {
    await booksAPI.updateStatus(id, status);
    // No full reload needed; status will reflect next render
  } catch (e) {
    alert('Gagal mengubah status: ' + e.message);
  }
}

// ---------- Favorites view ----------
async function renderFavorites(container) {
  container.innerHTML = '<h2>Favorit</h2><div id="fav">Memuat...</div>';
  try {
    const books = await booksAPI.getAll();
    const favBooks = books.filter(b => b.isFavorite);
    const div = container.querySelector('#fav');
    div.innerHTML = '';
    favBooks.forEach(b => div.appendChild(createBookCard(b)));
    if (!favBooks.length) div.textContent = 'Tidak ada buku favorit.';
  } catch (e) {
    container.querySelector('#fav').textContent = 'Gagal memuat favorit.';
  }
}

// ---------- Reading List view (filter by status) ----------
async function renderReadingList(container) {
  container.innerHTML = '<h2>Reading List</h2><select id="status-filter"><option value="">Semua</option><option value="To Read">To Read</option><option value="Reading">Reading</option><option value="Completed">Completed</option></select><div id="list"></div>';
  const listDiv = container.querySelector('#list');
  const filter = container.querySelector('#status-filter');
  async function load() {
    listDiv.textContent = 'Memuat...';
    try {
      const books = await booksAPI.getAll();
      const filtered = filter.value ? books.filter(b => b.readingStatus === filter.value) : books;
      listDiv.innerHTML = '';
      filtered.forEach(b => listDiv.appendChild(createBookCard(b)));
      if (!filtered.length) listDiv.textContent = 'Tidak ada buku pada status ini.';
    } catch (e) {
      listDiv.textContent = 'Gagal memuat list.';
    }
  }
  filter.addEventListener('change', load);
  load();
}

// ---------- Add Book page (including Google Books search) ----------
function renderAddBook(container) {
  const draft = storage.get('bookLibrary_bookDraft');
  renderAddForm(container, draft);

  // Add a simple search section below the manual form
  const searchDiv = document.createElement('div');
  searchDiv.innerHTML = `
    <h3>Tambah via Google Books</h3>
    <input type="text" id="gb-search" placeholder="Kata kunci" />
    <button id="gb-search-btn">Cari</button>
    <div id="gb-results"></div>
  `;
  container.appendChild(searchDiv);
  const btn = searchDiv.querySelector('#gb-search-btn');
  const input = searchDiv.querySelector('#gb-search');
  const resultsDiv = searchDiv.querySelector('#gb-results');
  btn.onclick = async () => {
    const query = input.value.trim();
    if (!query) return;
    resultsDiv.textContent = 'Mencari...';
    try {
      const results = await externalBooksAPI.search(query);
      resultsDiv.innerHTML = '';
      results.forEach(item => {
        const card = document.createElement('article');
        card.className = 'book-card';
        const img = document.createElement('img');
        img.src = item.coverUrl || 'https://via.placeholder.com/80x120?text=No+Cover';
        const info = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = item.title;
        const authors = document.createElement('p');
        authors.textContent = item.authors && item.authors.length ? `Penulis: ${item.authors.join(', ')}` : '';
        const pickBtn = document.createElement('button');
        pickBtn.textContent = 'Pilih';
        pickBtn.onclick = async () => {
          // Pre‑fill draft with selected data and switch to manual form for confirmation/edit
          const draftData = {
            title: item.title,
            authors: item.authors,
            category: item.category,
            publisher: item.publisher,
            publishedDate: item.publishedDate,
            isbn: item.isbn,
            coverUrl: item.coverUrl,
            description: item.description,
          };
          storage.set('bookLibrary_bookDraft', draftData);
          alert('Data buku telah di‑draft. Silakan beri penyesuaian pada formulir di atas.');
        };
        info.append(title, authors);
        card.append(img, info, pickBtn);
        resultsDiv.appendChild(card);
      });
    } catch (e) {
      resultsDiv.textContent = 'Gagal mencari buku.';
    }
  };
}

export { renderLibrary, renderAddBook, renderFavorites, renderReadingList };

// Helper to render library (reuse load function)
async function renderLibrary(container) {
  await loadAndRenderLibrary(container);
}
