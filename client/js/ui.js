// ui.js — shared UI helpers (confirm dialog, status change dialog, stars, badge, card builder)
import { booksAPI } from './api.js';
import { showToast } from './toast.js';

// ---- Confirm dialog -----------------------------------------
export function confirmDialog(title, message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="btn btn-outline" data-act="cancel">Batal</button>
          <button class="btn btn-danger" data-act="ok">Ya, Hapus</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      const act = e.target.dataset.act;
      if (!act) return;
      overlay.remove();
      resolve(act === 'ok');
    });
  });
}

// ---- Status change dialog with note input -------------------
export function statusChangeDialog(bookTitle, oldStatus, newStatus) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box" style="text-align: left; max-width: 480px;">
        <h3 style="margin-bottom: 8px;">Ubah Status Membaca</h3>
        <p style="color: var(--text-secondary); margin-bottom: 14px; font-size: 0.95rem; line-height: 1.5;">
          Buku: <strong>${bookTitle}</strong><br>
          Perubahan: <span style="color:var(--text-secondary);">${oldStatus || 'Baru'}</span> &rarr; <span style="font-weight:600; color:var(--accent);">${newStatus}</span>
        </p>
        <div class="form-group" style="margin-bottom: 16px;">
          <label style="font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; display: block;">Catatan Riwayat (Opsional)</label>
          <textarea id="status-note-input" placeholder="Tuliskan catatan, misal: Selesai bab 5, selesai dibaca saat liburan, dll..." style="width: 100%; min-height: 75px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: inherit; font-size: 0.9rem;"></textarea>
        </div>
        <div class="confirm-actions" style="justify-content: flex-end; gap: 8px;">
          <button class="btn btn-outline" data-act="cancel">Batal</button>
          <button class="btn btn-primary" data-act="save">Simpan Status & Catatan</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const noteInput = overlay.querySelector('#status-note-input');
    noteInput.focus();

    overlay.addEventListener('click', e => {
      const act = e.target.dataset.act;
      if (!act) return;
      if (act === 'cancel') {
        overlay.remove();
        resolve({ confirmed: false });
      } else if (act === 'save') {
        const note = noteInput.value.trim();
        overlay.remove();
        resolve({ confirmed: true, note });
      }
    });
  });
}

// ---- Quick note edit dialog for history ---------------------
export function noteEditDialog(bookTitle, currentNote = '') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box" style="text-align: left; max-width: 480px;">
        <h3 style="margin-bottom: 8px;">Edit Catatan Riwayat</h3>
        <p style="color: var(--text-secondary); margin-bottom: 12px; font-size: 0.95rem;">
          Buku: <strong>${bookTitle}</strong>
        </p>
        <div class="form-group" style="margin-bottom: 16px;">
          <label style="font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; display: block;">Catatan Anda</label>
          <textarea id="history-note-input" placeholder="Tuliskan catatan untuk riwayat membaca ini..." style="width: 100%; min-height: 85px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: inherit; font-size: 0.95rem;">${currentNote || ''}</textarea>
        </div>
        <div class="confirm-actions" style="justify-content: flex-end; gap: 8px;">
          <button class="btn btn-outline" data-act="cancel">Batal</button>
          <button class="btn btn-primary" data-act="save">Simpan Catatan</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const noteInput = overlay.querySelector('#history-note-input');
    noteInput.focus();

    overlay.addEventListener('click', e => {
      const act = e.target.dataset.act;
      if (!act) return;
      if (act === 'cancel') {
        overlay.remove();
        resolve({ confirmed: false });
      } else if (act === 'save') {
        const note = noteInput.value.trim();
        overlay.remove();
        resolve({ confirmed: true, note });
      }
    });
  });
}

// ---- Status badge -------------------------------------------
export function statusBadge(status) {
  const cls = {
    'To Read': 'badge-to-read',
    'Reading': 'badge-reading',
    'Completed': 'badge-completed',
  }[status] || '';
  return `<span class="badge ${cls}">${status}</span>`;
}

// ---- Star rating widget -------------------------------------
export function starsWidget(current, onChange) {
  const div = document.createElement('div');
  div.className = 'stars';
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('span');
    s.textContent = i <= (current || 0) ? '★' : '☆';
    if (i <= (current || 0)) s.classList.add('filled');
    s.addEventListener('click', () => onChange(i));
    div.appendChild(s);
  }
  return div;
}

// ---- Build a book card element ------------------------------
export function buildBookCard(book, { onRefresh } = {}) {
  const card = document.createElement('div');
  card.className = 'book-card';

  const coverSrc = book.coverUrl || 'https://via.placeholder.com/220x300/F3EDE4/8B6914?text=No+Cover';
  const authors = book.authors && book.authors.length ? book.authors.join(', ') : 'Penulis tidak diketahui';

  card.innerHTML = `
    <img class="card-cover" src="${coverSrc}" alt="${book.title}" loading="lazy" />
    <div class="card-body">
      <div class="card-title">${book.title}</div>
      <div class="card-author">${authors}</div>
      <div class="card-meta">
        ${statusBadge(book.readingStatus)}
        <button class="card-fav" data-id="${book.id}" aria-label="Toggle favorite">${book.isFavorite ? '★' : '☆'}</button>
      </div>
    </div>
    <div class="card-actions">
      <button data-act="detail">Detail</button>
      <button data-act="edit">Edit</button>
      <button data-act="delete">Hapus</button>
      <select data-act="status" title="Ubah status membaca">
        ${['To Read','Reading','Completed'].map(s => `<option value="${s}"${s===book.readingStatus?' selected':''}>${s}</option>`).join('')}
      </select>
    </div>`;

  // Toggle favorite
  card.querySelector('.card-fav').addEventListener('click', async e => {
    e.stopPropagation();
    await booksAPI.toggleFavorite(book.id);
    showToast(book.isFavorite ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit');
    if (onRefresh) onRefresh();
  });

  // Open detail
  card.querySelector('[data-act="detail"]').addEventListener('click', e => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-detail', { detail: book.id }));
  });

  // Edit metadata
  card.querySelector('[data-act="edit"]').addEventListener('click', e => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-edit', { detail: book }));
  });

  // Delete
  card.querySelector('[data-act="delete"]').addEventListener('click', async e => {
    e.stopPropagation();
    const yes = await confirmDialog('Hapus Buku', `Yakin ingin menghapus "${book.title}"?`);
    if (!yes) return;
    await booksAPI.remove(book.id);
    showToast('Buku berhasil dihapus');
    if (onRefresh) onRefresh();
  });

  // Status change with dialog for note
  const statusSelect = card.querySelector('[data-act="status"]');
  statusSelect.addEventListener('change', async e => {
    e.stopPropagation();
    const targetStatus = statusSelect.value;
    if (targetStatus === book.readingStatus) return;

    const res = await statusChangeDialog(book.title, book.readingStatus, targetStatus);
    if (!res.confirmed) {
      statusSelect.value = book.readingStatus; // revert selection
      return;
    }

    try {
      await booksAPI.updateStatus(book.id, targetStatus, res.note);
      showToast(`Status diubah ke ${targetStatus}` + (res.note ? ' beserta catatan' : ''));
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast('Gagal mengubah status: ' + err.message, 'error');
      statusSelect.value = book.readingStatus;
    }
  });

  // Click anywhere on card body opens detail
  card.querySelector('.card-body').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-detail', { detail: book.id }));
  });

  return card;
}
