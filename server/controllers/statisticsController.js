const pool = require('../config/database');

exports.getStatistics = async (req, res) => {
  try {
    const [[totalRes]] = await pool.query('SELECT COUNT(*) AS total FROM books');
    const [[toReadRes]] = await pool.query("SELECT COUNT(*) AS cnt FROM books WHERE reading_status='To Read'");
    const [[readingRes]] = await pool.query("SELECT COUNT(*) AS cnt FROM books WHERE reading_status='Reading'");
    const [[completedRes]] = await pool.query("SELECT COUNT(*) AS cnt FROM books WHERE reading_status='Completed'");
    const [[favoriteRes]] = await pool.query('SELECT COUNT(*) AS cnt FROM books WHERE is_favorite = 1');
    
    // Arrays of rows (do NOT use [[categoryRows]])
    const [categoryRows] = await pool.query('SELECT COALESCE(category, "Tanpa Kategori") AS category, COUNT(*) AS cnt FROM books GROUP BY category ORDER BY cnt DESC');
    const [monthlyRows] = await pool.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS cnt FROM books GROUP BY month ORDER BY month ASC`);
    const [[ratingRow]] = await pool.query('SELECT AVG(rating) AS avgRating FROM books WHERE rating IS NOT NULL');

    let avg = null;
    if (ratingRow && ratingRow.avgRating !== null && ratingRow.avgRating !== undefined) {
      const num = parseFloat(ratingRow.avgRating);
      if (!isNaN(num)) {
        avg = parseFloat(num.toFixed(2));
      }
    }

    res.json({
      totalBooks: (totalRes && totalRes.total) || 0,
      statusCounts: {
        toRead: (toReadRes && toReadRes.cnt) || 0,
        reading: (readingRes && readingRes.cnt) || 0,
        completed: (completedRes && completedRes.cnt) || 0,
      },
      favorites: (favoriteRes && favoriteRes.cnt) || 0,
      categories: Array.isArray(categoryRows) ? categoryRows : [],
      booksPerMonth: Array.isArray(monthlyRows) ? monthlyRows : [],
      averageRating: avg,
    });
  } catch (err) {
    console.error('Error in getStatistics:', err);
    res.status(500).json({ error: 'Failed to fetch statistics: ' + err.message });
  }
};
