// bookDetail.js — renders book detail inside the global modal with reading history & notes
import { booksAPI } from './api.js';
import { showToast } from './toast.js';
import { statusBadge, starsWidget, confirmDialog, statusChangeDialog } from './ui.js';

export async function openBookDetail(bookId) {
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  body.innerHTML = '<p>Memuat…</p>';
  overlay.classList.add('open');

  try {
    const [book, history] = await Promise.all([
      booksAPI.get(bookId),
      booksAPI.getHistory(bookId).catch(() => [])
    ]);

    const na   = '<span style="color:var(--text-secondary)">Tidak tersedia</span>';
    const authors = book.authors && book.authors.length ? book.authors.join(', ') : na;
    const coverSrc = book.coverUrl || 'https://via.placeholder.com/160x240/F3EDE4/8B6914?text=No+Cover';

    body.innerHTML = `
      <div class="detail-top">
        <img class="detail-cover" src="${coverSrc}" alt="${book.title}" />
        <div class="detail-info">
          <h2>${book.title}</h2>
          <div class="detail-author">${authors}</div>
          <div id="detail-stars" style="margin:8px 0;"></div>
          <dl class="detail-meta-grid">
            <dt>Status</dt>    <dd>${statusBadge(book.readingStatus)}</dd>
            <dt>Kategori</dt>  <dd>${book.category || na}</dd>
            <dt>Penerbit</dt>  <dd>${book.publisher || na}</dd>
            <dt>Tahun</dt>     <dd>${book.publishedDate || na}</dd>
            <dt>ISBN</dt>      <dd>${book.isbn || na}</dd>
            <dt>Sumber</dt>    <dd>${book.source === 'google_books' ? 'Google Books' : 'Manual'}</dd>
            <dt>Favorit</dt>   <dd>${book.isFavorite ? '⭐ Ya' : 'Tidak'}</dd>
          </dl>
        </div>
      </div>
      <div class="detail-desc">${book.description || '<em>Deskripsi tidak tersedia.</em>'}</div>
      
      <div class="detail-actions">
        <select id="detail-status" class="btn btn-outline btn-sm" title="Ubah status membaca & tambah catatan">
          ${['To Read','Reading','Completed'].map(s=>`<option value="${s}"${s===book.readingStatus?' selected':''}>${s}</option>`).join('')}
        </select>
        <button id="detail-fav" class="btn btn-outline btn-sm">${book.isFavorite ? '★ Unfavorite' : '☆ Favorite'}</button>
        <button id="detail-edit" class="btn btn-outline btn-sm">✏️ Edit Metadata</button>
        <button id="detail-delete" class="btn btn-danger btn-sm">🗑 Hapus</button>
      </div>

      <div style="margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
        <h3 style="font-size: 1.05rem; margin-bottom: 10px;">📜 Riwayat Perubahan Status Buku Ini</h3>
        <div id="detail-history-box"></div>
      </div>
    `;

    // History table inside book detail
    const histBox = body.querySelector('#detail-history-box');
    if (history && history.length > 0) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';

      const tbl = document.createElement('table');
      tbl.className = 'data-table';
      tbl.style.fontSize = '0.85rem';
      tbl.innerHTML = `
        <thead>
          <tr>
            <th style="width: 140px;">Transisi</th>
            <th class="note-col">Catatan</th>
            <th style="width: 130px;">Waktu</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = tbl.querySelector('tbody');
      history.forEach(h => {
        const tr = document.createElement('tr');
        const noteHtml = h.note
          ? `<div class="note-text" style="-webkit-line-clamp: 2;" title="${h.note}">${h.note}</div>`
          : '<span style="color:var(--text-secondary); font-style:italic;">Tidak ada catatan</span>';

        tr.innerHTML = `
          <td><strong>${h.old_status || '—'} &rarr; ${h.new_status}</strong></td>
          <td class="note-col">${noteHtml}</td>
          <td style="color:var(--text-secondary); white-space:nowrap;">
            ${new Date(h.changed_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
          </td>
        `;
        tbody.appendChild(tr);
      });
      wrapper.appendChild(tbl);
      histBox.innerHTML = '';
      histBox.appendChild(wrapper);
    } else {
      histBox.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem;"><em>Belum ada catatan riwayat perubahan status untuk buku ini.</em></p>';
    }

    // Stars rating widget
    const starsContainer = body.querySelector('#detail-stars');
    starsContainer.appendChild(starsWidget(book.rating, async r => {
      await booksAPI.updateRating(book.id, r);
      showToast(`Rating diubah ke ${r}`);
      openBookDetail(bookId); // refresh
    }));

    // Status change with dialog for note
    const statusSelect = body.querySelector('#detail-status');
    statusSelect.addEventListener('change', async e => {
      const targetStatus = e.target.value;
      if (targetStatus === book.readingStatus) return;

      const res = await statusChangeDialog(book.title, book.readingStatus, targetStatus);
      if (!res.confirmed) {
        statusSelect.value = book.readingStatus;
        return;
      }

      try {
        await booksAPI.updateStatus(book.id, targetStatus, res.note);
        showToast(`Status diubah ke ${targetStatus}` + (res.note ? ' beserta catatan' : ''));
        openBookDetail(bookId);
      } catch (err) {
        showToast('Gagal mengubah status: ' + err.message, 'error');
        statusSelect.value = book.readingStatus;
      }
    });

    // Toggle favorite
    body.querySelector('#detail-fav').addEventListener('click', async () => {
      await booksAPI.toggleFavorite(book.id);
      showToast(book.isFavorite ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit');
      openBookDetail(bookId);
    });

    // Edit metadata
    body.querySelector('#detail-edit').addEventListener('click', () => {
      overlay.classList.remove('open');
      window.dispatchEvent(new CustomEvent('open-edit', { detail: book }));
    });

    // Delete
    body.querySelector('#detail-delete').addEventListener('click', async () => {
      const yes = await confirmDialog('Hapus Buku', `Yakin ingin menghapus "${book.title}"?`);
      if (!yes) return;
      await booksAPI.remove(book.id);
      showToast('Buku berhasil dihapus');
      overlay.classList.remove('open');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

  } catch (err) {
    body.innerHTML = `<p style="color:var(--error)">Gagal memuat detail: ${err.message}</p>`;
  }
}
