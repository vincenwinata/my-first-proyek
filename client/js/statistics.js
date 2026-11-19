// statistics.js — Statistics page with metrics and visual charts
import { statsAPI } from './api.js';

let statusChartInstance = null;
let monthlyChartInstance = null;
let categoryChartInstance = null;

export async function renderStatistics(container) {
  container.innerHTML = `
    <div class="page-heading">
      <h2>📈 Statistik Koleksi</h2>
      <p>Analisis detail metrik buku, kategori, dan kebiasaan membaca</p>
    </div>
    <div id="stats-container">
      <div class="stat-cards">
        <div class="stat-card skeleton" style="height: 100px;"></div>
        <div class="stat-card skeleton" style="height: 100px;"></div>
        <div class="stat-card skeleton" style="height: 100px;"></div>
        <div class="stat-card skeleton" style="height: 100px;"></div>
        <div class="stat-card skeleton" style="height: 100px;"></div>
        <div class="stat-card skeleton" style="height: 100px;"></div>
      </div>
    </div>
  `;

  const statsBox = container.querySelector('#stats-container');

  try {
    const stats = await statsAPI.get();

    if (!stats || stats.totalBooks === 0) {
      statsBox.innerHTML = `
        <div class="section-box empty-state">
          <div class="empty-icon">📊</div>
          <h3>Belum Ada Data Statistik</h3>
          <p>Mulai tambahkan buku ke perpustakaan Anda untuk melihat analisis statistik yang lengkap.</p>
          <a href="#/add-book" class="btn btn-primary btn-sm">➕ Tambah Buku Pertama</a>
        </div>
      `;
      return;
    }

    const avgDisplay = (stats.averageRating !== null && stats.averageRating !== undefined)
      ? `${stats.averageRating}`
      : '—';

    statsBox.innerHTML = `
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">📚 ${stats.totalBooks}</div>
          <div class="stat-label">Total Buku</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">📖 ${(stats.statusCounts && stats.statusCounts.toRead) || 0}</div>
          <div class="stat-label">To Read</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">📗 ${(stats.statusCounts && stats.statusCounts.reading) || 0}</div>
          <div class="stat-label">Reading</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">✅ ${(stats.statusCounts && stats.statusCounts.completed) || 0}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">⭐ ${stats.favorites || 0}</div>
          <div class="stat-label">Buku Favorit</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">★ ${avgDisplay}</div>
          <div class="stat-label">Rata-rata Rating</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--gap);">
        <div class="section-box">
          <h3>Distribusi Status Membaca</h3>
          <div class="chart-container" style="max-width: 320px; height: 260px; margin: 0 auto;">
            <canvas id="chart-status"></canvas>
          </div>
        </div>
        <div class="section-box">
          <h3>Buku Ditambahkan Per Bulan</h3>
          <div class="chart-container" style="height: 260px;">
            <canvas id="chart-monthly"></canvas>
          </div>
        </div>
      </div>

      <div class="section-box" style="margin-top: var(--gap);">
        <h3>Distribusi Kategori Koleksi</h3>
        <div id="category-section">
          <div class="chart-container" style="width: 100%; min-height: 240px;">
            <canvas id="chart-categories"></canvas>
          </div>
          <div style="margin-top: 20px;" id="category-list"></div>
        </div>
      </div>
    `;

    if (typeof Chart !== 'undefined') {
      // 1. Status Doughnut Chart
      const ctxStatus = statsBox.querySelector('#chart-status');
      if (ctxStatus) {
        if (statusChartInstance) { statusChartInstance.destroy(); statusChartInstance = null; }
        statusChartInstance = new Chart(ctxStatus, {
          type: 'doughnut',
          data: {
            labels: ['To Read', 'Reading', 'Completed'],
            datasets: [{
              data: [
                (stats.statusCounts && stats.statusCounts.toRead) || 0,
                (stats.statusCounts && stats.statusCounts.reading) || 0,
                (stats.statusCounts && stats.statusCounts.completed) || 0,
              ],
              backgroundColor: ['#90CAF9', '#FFE082', '#A5D6A7'],
              borderColor: 'var(--surface)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }

      // 2. Monthly Additions Bar Chart
      const monthlyList = Array.isArray(stats.booksPerMonth) ? stats.booksPerMonth : [];
      const monthlyLabels = monthlyList.map(m => m.month);
      const monthlyData = monthlyList.map(m => m.cnt);
      const ctxMonthly = statsBox.querySelector('#chart-monthly');

      if (ctxMonthly) {
        if (monthlyChartInstance) { monthlyChartInstance.destroy(); monthlyChartInstance = null; }
        monthlyChartInstance = new Chart(ctxMonthly, {
          type: 'bar',
          data: {
            labels: monthlyLabels.length ? monthlyLabels : ['Belum ada data'],
            datasets: [{
              label: 'Jumlah Buku',
              data: monthlyData.length ? monthlyData : [0],
              backgroundColor: '#D4B96A',
              hoverBackgroundColor: '#8B6914',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
          }
        });
      }

      // 3. Category Horizontal Bar Chart
      const categoryList = Array.isArray(stats.categories) ? stats.categories : [];
      const catLabels = categoryList.map(c => c.category || 'Tanpa Kategori');
      const catData = categoryList.map(c => c.cnt);
      const ctxCategory = statsBox.querySelector('#chart-categories');

      if (ctxCategory && catLabels.length > 0) {
        if (categoryChartInstance) { categoryChartInstance.destroy(); categoryChartInstance = null; }
        categoryChartInstance = new Chart(ctxCategory, {
          type: 'bar',
          data: {
            labels: catLabels,
            datasets: [{
              label: 'Jumlah Buku',
              data: catData,
              backgroundColor: '#8B6914',
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
          }
        });
      }
    }

    // Category tags
    const catListEl = statsBox.querySelector('#category-list');
    const categoryList = Array.isArray(stats.categories) ? stats.categories : [];
    if (categoryList.length) {
      let catHtml = '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
      categoryList.forEach(c => {
        catHtml += `
          <span style="background:var(--accent-bg); border:1px solid var(--accent-light); padding:6px 12px; border-radius:20px; font-size:0.85rem; color:var(--accent-hover);">
            <strong>${c.category || 'Tanpa Kategori'}:</strong> ${c.cnt} buku
          </span>
        `;
      });
      catHtml += '</div>';
      catListEl.innerHTML = catHtml;
    }
  } catch (err) {
    console.error('Statistics render error:', err);
    statsBox.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Gagal Memuat Statistik</h3>
        <p>${err.message}</p>
        <button class="btn btn-outline btn-sm" onclick="location.reload()">Coba Lagi</button>
      </div>
    `;
  }
}
