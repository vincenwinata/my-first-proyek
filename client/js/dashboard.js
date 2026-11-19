// dashboard.js — Dashboard page
import { statsAPI, booksAPI, historyAPI } from './api.js';

let dashChartInstance = null;

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-heading">
      <h2>Dashboard</h2>
      <p>Ringkasan koleksi dan aktivitas membaca perpustakaan pribadi Anda</p>
    </div>
    <div class="stat-cards" id="dash-cards">
      <div class="stat-card skeleton" style="height: 100px;"></div>
      <div class="stat-card skeleton" style="height: 100px;"></div>
      <div class="stat-card skeleton" style="height: 100px;"></div>
      <div class="stat-card skeleton" style="height: 100px;"></div>
      <div class="stat-card skeleton" style="height: 100px;"></div>
      <div class="stat-card skeleton" style="height: 100px;"></div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--gap);">
      <div class="section-box">
        <h3>Aktivitas Penambahan Buku Bulanan</h3>
        <div class="chart-container" style="min-height: 220px;">
          <canvas id="dash-chart"></canvas>
        </div>
      </div>
      <div class="section-box">
        <h3>Buku Terakhir Ditambahkan</h3>
        <div id="dash-recent">Memuat buku...</div>
      </div>
    </div>
    <div class="section-box" style="margin-top: var(--gap);">
      <h3>Riwayat Aktivitas Membaca Terbaru</h3>
      <div id="dash-activity">Memuat riwayat...</div>
    </div>
  `;

  try {
    const [stats, allBooks, history] = await Promise.all([
      statsAPI.get(),
      booksAPI.getAll().catch(() => []),
      historyAPI.getAll().catch(() => [])
    ]);

    // ---- 1. Stat cards (clickable) ----
    const cardBox = container.querySelector('#dash-cards');
    cardBox.innerHTML = '';

    const avgRatingVal = (stats.averageRating !== null && stats.averageRating !== undefined)
      ? `${stats.averageRating}`
      : '—';

    const cards = [
      { label: 'Total Buku',  value: stats.totalBooks || 0,             icon: '📚' },
      { label: 'To Read',     value: (stats.statusCounts && stats.statusCounts.toRead) || 0,    icon: '📖', filter: 'To Read' },
      { label: 'Reading',     value: (stats.statusCounts && stats.statusCounts.reading) || 0,   icon: '📗', filter: 'Reading' },
      { label: 'Completed',   value: (stats.statusCounts && stats.statusCounts.completed) || 0, icon: '✅', filter: 'Completed' },
      { label: 'Favorites',   value: stats.favorites || 0,              icon: '⭐', page: '#/favorites' },
      { label: 'Rata-rata Rating', value: avgRatingVal,                 icon: '★' },
    ];

    cards.forEach(c => {
      const el = document.createElement('div');
      el.className = 'stat-card';
      el.innerHTML = `
        <div class="stat-value">${c.icon} ${c.value}</div>
        <div class="stat-label">${c.label}</div>
      `;
      if (c.filter) {
        el.style.cursor = 'pointer';
        el.title = `Lihat buku dengan status ${c.filter}`;
        el.onclick = () => { location.hash = `#/library?status=${encodeURIComponent(c.filter)}`; };
      } else if (c.page) {
        el.style.cursor = 'pointer';
        el.title = `Lihat buku favorit`;
        el.onclick = () => { location.hash = c.page; };
      }
      cardBox.appendChild(el);
    });

    // ---- 2. Chart.js (Monthly Activity) ----
    const monthlyList = Array.isArray(stats.booksPerMonth) ? stats.booksPerMonth : [];
    const months = monthlyList.map(m => m.month);
    const counts = monthlyList.map(m => m.cnt);
    const canvas = container.querySelector('#dash-chart');

    if (canvas && typeof Chart !== 'undefined') {
      if (dashChartInstance) {
        dashChartInstance.destroy();
        dashChartInstance = null;
      }

      dashChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: months.length ? months : ['Belum ada data'],
          datasets: [{
            label: 'Buku Ditambahkan',
            data: counts.length ? counts : [0],
            backgroundColor: '#D4B96A',
            hoverBackgroundColor: '#8B6914',
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y} buku ditambahkan`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    }

    // ---- 3. Recent books ----
    const recentDiv = container.querySelector('#dash-recent');
    const recent = Array.isArray(allBooks) ? allBooks.slice(0, 4) : [];

    if (!recent.length) {
      recentDiv.innerHTML = `
        <div class="empty-state" style="padding: 24px 0;">
          <div class="empty-icon" style="font-size: 2rem;">📭</div>
          <p>Belum ada buku dalam koleksi.</p>
          <a href="#/add-book" class="btn btn-primary btn-sm" style="margin-top: 8px;">➕ Tambah Buku</a>
        </div>
      `;
    } else {
      recentDiv.innerHTML = '';
      recent.forEach(b => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); cursor:pointer; transition: background 0.2s;';
        const coverSrc = b.coverUrl || 'https://via.placeholder.com/40x60/F3EDE4/8B6914?text=📖';
        const authors = (b.authors && b.authors.length) ? b.authors.join(', ') : 'Penulis tidak diketahui';
        
        row.innerHTML = `
          <img src="${coverSrc}" style="width:42px; height:60px; object-fit:cover; border-radius:4px; flex-shrink:0; background:var(--bg-alt);" alt="${b.title}" />
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.title}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${authors}</div>
            <div style="font-size:0.75rem; color:var(--accent); margin-top:2px;">${b.readingStatus}</div>
          </div>
        `;
        row.onclick = () => window.dispatchEvent(new CustomEvent('open-detail', { detail: b.id }));
        recentDiv.appendChild(row);
      });
    }

    // ---- 4. Recent activity ----
    const actDiv = container.querySelector('#dash-activity');
    const recentHist = Array.isArray(history) ? history.slice(0, 5) : [];

    if (!recentHist.length) {
      actDiv.innerHTML = `
        <div class="empty-state" style="padding: 24px 0;">
          <p>Belum ada catatan aktivitas membaca.</p>
        </div>
      `;
    } else {
      const bookMap = new Map();
      (allBooks || []).forEach(b => bookMap.set(b.id, b.title));

      const tbl = document.createElement('table');
      tbl.className = 'data-table';
      tbl.innerHTML = `
        <thead>
          <tr>
            <th>Buku</th>
            <th>Perubahan Status</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = tbl.querySelector('tbody');
      recentHist.forEach(h => {
        const bookTitle = bookMap.get(h.book_id) || `Buku #${h.book_id}`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${bookTitle}</strong></td>
          <td><span style="color:var(--text-secondary);">${h.old_status || '—'}</span> &rarr; <span style="font-weight:600; color:var(--accent);">${h.new_status}</span></td>
          <td style="color:var(--text-secondary); font-size:0.85rem;">${new Date(h.changed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
        `;
        tbody.appendChild(tr);
      });
      actDiv.innerHTML = '';
      actDiv.appendChild(tbl);
    }

  } catch (err) {
    console.error('Dashboard render error:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Gagal Memuat Dashboard</h3>
        <p>${err.message}</p>
        <button class="btn btn-outline btn-sm" onclick="location.reload()">Coba Lagi</button>
      </div>
    `;
  }
}
