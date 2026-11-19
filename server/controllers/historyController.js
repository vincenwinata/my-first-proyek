const pool = require('../config/database');

exports.getAllHistory = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reading_history ORDER BY changed_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reading history' });
  }
};

exports.getHistoryByBookId = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM reading_history WHERE book_id = ? ORDER BY changed_at DESC', [id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history for book' });
  }
};

exports.updateHistoryNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const noteVal = (note && typeof note === 'string' && note.trim().length > 0) ? note.trim() : null;
    await pool.execute('UPDATE reading_history SET note = ? WHERE id = ?', [noteVal, id]);
    res.json({ message: 'Note updated successfully', note: noteVal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update history note' });
  }
};
