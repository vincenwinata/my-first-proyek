// editBook.js — Modal editor for books
import { booksAPI } from './api.js';
import { showToast } from './toast.js';

export function openEditModal(book) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');

  const authorsStr = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || '');

  body.innerHTML = `
    <h2>✏️ Edit Informasi Buku</h2>
    <p style="color: var(--text-secondary); margin-bottom: 20px;">Perbarui metadata buku "${book.title}"</p>
    
    <form id="edit-form">
      <div class="form-row">
        <div class="form-group">
          <label>Judul Buku *</label>
          <input name="title" required value="${book.title || ''}" />
        </div>
        <div class="form-group">
          <label>Penulis (pisah dengan koma)</label>
          <input name="authors" value="${authorsStr}" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Kategori</label>
          <input name="category" value="${book.category || ''}" />
        </div>
        <div class="form-group">
          <label>Penerbit</label>
          <input name="publisher" value="${book.publisher || ''}" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tahun Terbit</label>
          <input name="publishedDate" type="number" min="1000" max="2099" value="${book.publishedDate || ''}" />
        </div>
        <div class="form-group">
          <label>ISBN</label>
          <input name="isbn" value="${book.isbn || ''}" />
        </div>
      </div>

      <div class="form-group">
        <label>URL Cover</label>
        <input name="coverUrl" value="${book.coverUrl || ''}" />
      </div>

      <div class="form-group">
        <label>Deskripsi</label>
        <textarea name="description">${book.description || ''}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Status Membaca</label>
          <select name="readingStatus">
            <option value="To Read" ${book.readingStatus === 'To Read' ? 'selected' : ''}>To Read</option>
            <option value="Reading" ${book.readingStatus === 'Reading' ? 'selected' : ''}>Reading</option>
            <option value="Completed" ${book.readingStatus === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label>Rating (1–5)</label>
          <input name="rating" type="number" min="1" max="5" value="${book.rating || ''}" />
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px;">
        <button type="button" class="btn btn-outline" id="btn-cancel-edit">Batal</button>
        <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
      </div>
    </form>
  `;

  overlay.classList.add('open');

  body.querySelector('#btn-cancel-edit').onclick = () => {
    overlay.classList.remove('open');
  };

  const form = body.querySelector('#edit-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const title = fd.get('title').trim();
    if (!title) {
      showToast('Judul buku wajib diisi', 'error');
      return;
    }

    const ratingVal = fd.get('rating') ? Number(fd.get('rating')) : null;
    if (ratingVal !== null && (ratingVal < 1 || ratingVal > 5)) {
      showToast('Rating harus antara 1 sampai 5', 'error');
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
      rating: ratingVal
    };

    try {
      await booksAPI.update(book.id, payload);
      showToast('Data buku berhasil diperbarui!');
      overlay.classList.remove('open');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (err) {
      showToast('Gagal memperbarui: ' + err.message, 'error');
    }
  };
}
