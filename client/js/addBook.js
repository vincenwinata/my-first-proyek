// addBook.js — Add Book page (manual form + Google Books search)
import { booksAPI, searchAPI } from './api.js';
import { storage } from './storage.js';
import { showToast } from './toast.js';

export function renderAddBook(container) {
  container.innerHTML = `
    <div class="page-heading">
      <h2>Tambah Buku</h2>
      <p>Tambahkan buku baru secara manual atau cari metadata otomatis via Google Books API</p>
    </div>
    <div class="tab-nav">
      <button class="tab-btn active" data-tab="manual">📝 Input Manual</button>
      <button class="tab-btn" data-tab="google">🔍 Cari Google Books</button>
    </div>
    <div id="tab-manual" class="section-box"></div>
    <div id="tab-google" class="section-box" style="display: none;"></div>
  `;

  const manualBox = container.querySelector('#tab-manual');
  const googleBox = container.querySelector('#tab-google');

  // ---- Tab navigation switching ----
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isManual = btn.dataset.tab === 'manual';
      manualBox.style.display = isManual ? 'block' : 'none';
      googleBox.style.display = isManual ? 'none' : 'block';
    });
  });

  // ---- Tab A: Manual form ----
  const draft = storage.get('bookDraft', {});
  manualBox.innerHTML = `
    <div style="margin-bottom: 16px; padding: 10px 14px; background: var(--accent-bg); border-left: 3px solid var(--accent); border-radius: var(--radius-sm); font-size: 0.9rem;">
      💡 <em>Draft isian Anda tersimpan otomatis di browser secara berkala.</em>
    </div>
    <form id="add-form">
      <div class="form-row">
        <div class="form-group">
          <label>Judul Buku *</label>
          <input name="title" required placeholder="Contoh: Bumi" value="${draft.title || ''}" />
        </div>
        <div class="form-group">
          <label>Penulis (pisahkan dengan koma jika lebih dari satu)</label>
          <input name="authors" placeholder="Contoh: Tere Liye" value="${draft.authors || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Kategori / Genre</label>
          <input name="category" placeholder="Contoh: Fiksi, Fantasi, Petualangan" value="${draft.category || ''}" />
        </div>
        <div class="form-group">
          <label>Penerbit</label>
          <input name="publisher" placeholder="Contoh: Gramedia Pustaka Utama" value="${draft.publisher || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tahun / Tanggal Terbit</label>
          <input name="publishedDate" placeholder="Contoh: 2014" value="${draft.publishedDate || ''}" />
        </div>
        <div class="form-group">
          <label>ISBN (10 atau 13 digit)</label>
          <input name="isbn" placeholder="Contoh: 9786020301129" value="${draft.isbn || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label>URL Gambar Cover (Opsional)</label>
        <input name="coverUrl" type="url" placeholder="https://example.com/cover.jpg" value="${draft.coverUrl || ''}" />
      </div>
      <div class="form-group">
        <label>Sinopsis / Deskripsi</label>
        <textarea name="description" placeholder="Tulis sinopsis ringkas buku ini...">${draft.description || ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Status Membaca</label>
          <select name="readingStatus">
            <option value="To Read" ${draft.readingStatus === 'To Read' ? 'selected' : ''}>To Read</option>
            <option value="Reading" ${draft.readingStatus === 'Reading' ? 'selected' : ''}>Reading</option>
            <option value="Completed" ${draft.readingStatus === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label>Rating Pribadi (1–5, Opsional)</label>
          <input name="rating" type="number" min="1" max="5" placeholder="Beri rating 1 - 5" value="${draft.rating || ''}" />
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button type="submit" class="btn btn-primary">💾 Simpan ke Database</button>
        <button type="button" class="btn btn-outline" id="btn-clear-draft">Kosongkan Form</button>
      </div>
    </form>
  `;

  const form = manualBox.querySelector('#add-form');

  // Auto-save draft on input
  form.addEventListener('input', () => {
    const d = {};
    new FormData(form).forEach((v, k) => { d[k] = v; });
    storage.set('bookDraft', d);
  });

  // Clear draft button
  manualBox.querySelector('#btn-clear-draft').addEventListener('click', () => {
    if (confirm('Yakin ingin mengosongkan seluruh formulir draft?')) {
      form.reset();
      storage.remove('bookDraft');
      delete form.dataset.source;
      showToast('Formulir draft dikosongkan');
    }
  });

  // Submit manual form
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const title = fd.get('title').trim();
    if (!title) {
      showToast('Judul buku wajib diisi', 'error');
      return;
    }

    const ratingVal = fd.get('rating') ? Number(fd.get('rating')) : null;
    if (ratingVal !== null && (ratingVal < 1 || ratingVal > 5)) {
      showToast('Rating harus berada pada rentang 1 sampai 5', 'error');
      return;
    }

    const payload = {
      title,
      authors: fd.get('authors') ? fd.get('authors').split(',').map(s => s.trim()).filter(Boolean) : [],
      category: fd.get('category').trim() || null,
      publisher: fd.get('publisher').trim() || null,
      publishedDate: fd.get('publishedDate') ? fd.get('publishedDate').trim() : null,
      isbn: fd.get('isbn').trim() || null,
      coverUrl: fd.get('coverUrl').trim() || null,
      description: fd.get('description').trim() || null,
      readingStatus: fd.get('readingStatus'),
      rating: ratingVal,
      source: form.dataset.source || 'manual',
      googleVolumeId: form.dataset.volumeId || null,
    };

    try {
      await booksAPI.create(payload);
      storage.remove('bookDraft');
      delete form.dataset.source;
      delete form.dataset.volumeId;
      showToast('Buku berhasil disimpan ke koleksi!');
      location.hash = '#/library';
    } catch (err) {
      showToast('Gagal menyimpan buku: ' + err.message, 'error');
    }
  });

  // ---- Tab B: Google Books search ----
  googleBox.innerHTML = `
    <div style="margin-bottom: 16px;">
      <p style="color: var(--text-secondary); margin-bottom: 12px; font-size: 0.95rem;">
        Ketik nama penulis atau judul buku (misalnya: <strong>Tere Liye</strong>, <strong>Andrea Hirata</strong>, atau <strong>Hujan</strong>).
      </p>
      <div class="toolbar">
        <select id="gb-type" style="flex: 0 0 160px;">
          <option value="all">🔍 Semua Kategori</option>
          <option value="author">✍️ Penulis (Author)</option>
          <option value="title">📖 Judul Buku (Title)</option>
        </select>
        <input type="text" id="gb-query" placeholder="Ketik kata kunci pencarian, mis: Tere Liye..." />
        <button class="btn btn-primary" id="gb-btn">Cari Buku</button>
      </div>
    </div>
    <div id="gb-results">
      <div class="empty-state" style="padding: 30px 0;">
        <div class="empty-icon" style="font-size: 2.5rem;">🔎</div>
        <h3>Mulai Pencarian Buku</h3>
        <p>Hasil dari Google Books akan ditampilkan di sini. Anda dapat memilih buku untuk meninjau dan mengoreksi data sebelum menyimpannya.</p>
      </div>
    </div>
  `;

  const gbType  = googleBox.querySelector('#gb-type');
  const gbInput = googleBox.querySelector('#gb-query');
  const gbBtn   = googleBox.querySelector('#gb-btn');
  const gbList  = googleBox.querySelector('#gb-results');

  async function executeGoogleSearch() {
    const q = gbInput.value.trim();
    if (!q) {
      showToast('Masukkan kata kunci pencarian terlebih dahulu', 'error');
      return;
    }

    const type = gbType.value;
    gbList.innerHTML = `
      <div class="empty-state" style="padding: 40px 0;">
        <div class="empty-icon" style="font-size: 2.5rem; animation: shimmer 1s infinite;">⏳</div>
        <p>Sedang mencari buku di Google Books API...</p>
      </div>
    `;

    try {
      const results = await searchAPI.google(q, type);
      gbList.innerHTML = '';

      if (!results || !results.length) {
        gbList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>Tidak Ada Buku Ditemukan</h3>
            <p>Tidak ditemukan buku untuk kata kunci "<strong>${q}</strong>". Coba periksa ejaan atau gunakan mode pencarian Penulis / Judul.</p>
          </div>
        `;
        return;
      }

      const grid = document.createElement('div');
      grid.className = 'book-grid';

      results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'book-card';
        const coverSrc = item.coverUrl || 'https://via.placeholder.com/220x300/F3EDE4/8B6914?text=No+Cover';
        const authors = (item.authors && item.authors.length) ? item.authors.join(', ') : 'Penulis tidak diketahui';
        const year = item.publishedDate ? item.publishedDate.slice(0, 4) : '';

        card.innerHTML = `
          <img class="card-cover" src="${coverSrc}" alt="${item.title}" loading="lazy" />
          <div class="card-body">
            <div class="card-title" title="${item.title}">${item.title}</div>
            <div class="card-author">✍️ ${authors}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
              ${year ? `📅 ${year} &bull; ` : ''}${item.category || 'Buku'}
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm" style="flex: 1; font-weight: 600;">
              ✓ Pilih & Koreksi Metadata
            </button>
          </div>
        `;

        card.querySelector('button').addEventListener('click', () => {
          // Pre-fill manual form with this data so user can review/edit before saving
          form.title.value         = item.title || '';
          form.authors.value       = authors !== 'Penulis tidak diketahui' ? authors : '';
          form.category.value      = item.category || '';
          form.publisher.value     = item.publisher || '';
          form.publishedDate.value = item.publishedDate || '';
          form.isbn.value          = item.isbn || '';
          form.coverUrl.value      = item.coverUrl || '';
          form.description.value   = item.description || '';
          form.dataset.source      = 'google_books';
          form.dataset.volumeId    = item.googleVolumeId || '';

          // Save draft state
          storage.set('bookDraft', {
            title: item.title,
            authors: form.authors.value,
            category: item.category,
            publisher: item.publisher,
            publishedDate: item.publishedDate,
            isbn: item.isbn,
            coverUrl: item.coverUrl,
            description: item.description,
          });

          // Switch to manual tab for review
          container.querySelector('.tab-btn[data-tab="manual"]').click();
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
          showToast('Data buku berhasil disalin! Silakan periksa dan klik "Simpan ke Database".');
        });

        grid.appendChild(card);
      });

      gbList.appendChild(grid);
    } catch (err) {
      console.error(err);
      gbList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Pencarian Gagal</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  gbBtn.addEventListener('click', executeGoogleSearch);
  gbInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeGoogleSearch();
    }
  });
}
