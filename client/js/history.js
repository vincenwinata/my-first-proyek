// history.js — Reading History page (chronological status transitions with note tools & responsive safe layout)
import { historyAPI, booksAPI } from './api.js';
import { noteEditDialog } from './ui.js';
import { showToast } from './toast.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function renderHistory(container) {
  container.innerHTML = `
    <div class="page-heading">
      <h2>🕐 Reading History</h2>
      <p>Log kronologis riwayat perubahan status membaca beserta catatan pribadi Anda</p>
    </div>
    <div class="toolbar">
      <input type="text" id="hist-search" placeholder="🔍 Filter riwayat berdasarkan judul, status, atau kata dalam catatan..." />
    </div>
    <div class="section-box" id="hist-box">
      <div id="hist-content">Memuat riwayat...</div>
    </div>
  `;

  const searchEl = container.querySelector('#hist-search');
  const contentEl = container.querySelector('#hist-content');

  try {
    const [history, books] = await Promise.all([
      historyAPI.getAll(),
      booksAPI.getAll().catch(() => [])
    ]);

    const bookMap = new Map();
    books.forEach(b => bookMap.set(b.id, b));

    function render(filterText = '') {
      const kw = filterText.toLowerCase().trim();
      let filtered = history;

      if (kw) {
        filtered = history.filter(h => {
          const book = bookMap.get(h.book_id);
          const title = book ? book.title.toLowerCase() : '';
          const oldStatus = (h.old_status || '').toLowerCase();
          const newStatus = (h.new_status || '').toLowerCase();
          const note = (h.note || '').toLowerCase();
          return title.includes(kw) || oldStatus.includes(kw) || newStatus.includes(kw) || note.includes(kw);
        });
      }

      if (!filtered.length) {
        contentEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📜</div>
            <h3>${filterText ? 'Tidak ada riwayat yang cocok' : 'Belum Ada Riwayat'}</h3>
            <p>${filterText ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Perubahan status membaca buku akan otomatis dicatat di sini beserta catatan Anda.'}</p>
          </div>
        `;
        return;
      }

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-responsive';

      const table = document.createElement('table');
      table.className = 'data-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th style="min-width: 160px;">Buku</th>
            <th style="width: 140px;">Status Lama</th>
            <th style="width: 140px;">Status Baru</th>
            <th class="note-col">Catatan Riwayat</th>
            <th style="width: 160px;">Waktu Perubahan</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector('tbody');
      filtered.forEach(h => {
        const book = bookMap.get(h.book_id);
        const title = book ? book.title : `Buku #${h.book_id}`;
        const tr = document.createElement('tr');

        let noteCellHtml = '';
        if (h.note) {
          const isLong = h.note.length > 70;
          noteCellHtml = `
            <div class="note-container">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div class="note-text" id="note-text-${h.id}" title="${escapeHtml(h.note)}">${escapeHtml(h.note)}</div>
                <button class="btn btn-outline btn-sm btn-edit-note" style="padding: 2px 7px; font-size: 0.75rem; flex-shrink: 0;" title="Edit catatan">✏️</button>
              </div>
              ${isLong ? `<button type="button" class="note-toggle-btn" data-target="note-text-${h.id}">Selengkapnya</button>` : ''}
            </div>
          `;
        } else {
          noteCellHtml = `<button class="btn btn-outline btn-sm btn-add-note" style="padding: 3px 10px; font-size: 0.8rem; color: var(--accent);">+ Tambah Catatan</button>`;
        }

        tr.innerHTML = `
          <td>
            <a href="javascript:void(0)" class="book-link" style="font-weight: 600; text-decoration: underline;" data-id="${h.book_id}">
              ${escapeHtml(title)}
            </a>
          </td>
          <td><span style="color: var(--text-secondary);">${escapeHtml(h.old_status || '—')}</span></td>
          <td><span style="font-weight: 600; color: var(--accent);">${escapeHtml(h.new_status)}</span></td>
          <td class="note-col">${noteCellHtml}</td>
          <td style="color: var(--text-secondary); white-space: nowrap; font-size: 0.85rem;">
            ${new Date(h.changed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
          </td>
        `;

        // Open book detail on title click
        tr.querySelector('.book-link').addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('open-detail', { detail: h.book_id }));
        });

        // Add or Edit note button handler
        const noteBtn = tr.querySelector('.btn-edit-note, .btn-add-note');
        if (noteBtn) {
          noteBtn.addEventListener('click', async () => {
            const res = await noteEditDialog(title, h.note || '');
            if (!res.confirmed) return;

            try {
              await historyAPI.updateNote(h.id, res.note);
              h.note = res.note || null;
              showToast(res.note ? 'Catatan berhasil diperbarui!' : 'Catatan dihapus');
              render(searchEl.value);
            } catch (err) {
              showToast('Gagal menyimpan catatan: ' + err.message, 'error');
            }
          });
        }

        tbody.appendChild(tr);
      });

      // Expand / Collapse buttons
      tableWrapper.appendChild(table);
      tableWrapper.querySelectorAll('.note-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = btn.dataset.target;
          const textEl = tableWrapper.querySelector('#' + targetId);
          if (textEl) {
            const isExpanded = textEl.classList.toggle('expanded');
            btn.textContent = isExpanded ? 'Sembunyikan' : 'Selengkapnya';
          }
        });
      });

      contentEl.innerHTML = '';
      contentEl.appendChild(tableWrapper);
    }

    let debounce;
    searchEl.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => render(searchEl.value), 250);
    });

    render();
  } catch (err) {
    console.error(err);
    contentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Gagal memuat riwayat</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}
