const pool = require('../config/database');

// Helper to map DB row to book object
function mapBook(row) {
  let authors = [];
  if (row.authors) {
    try {
      const parsed = JSON.parse(row.authors);
      authors = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch (e) {
      authors = [row.authors];
    }
  }
  return {
    id: row.id,
    googleVolumeId: row.google_volume_id,
    title: row.title,
    authors,
    category: row.category,
    publisher: row.publisher,
    publishedDate: row.published_date,
    isbn: row.isbn,
    description: row.description,
    coverUrl: row.cover_url,
    readingStatus: row.reading_status,
    isFavorite: !!row.is_favorite,
    rating: row.rating,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

exports.getAllBooks = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    const books = rows.map(mapBook);
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

exports.getBookById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json(mapBook(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

exports.createBook = async (req, res) => {
  const {
    googleVolumeId,
    title,
    authors,
    category,
    publisher,
    publishedDate,
    isbn,
    description,
    coverUrl,
    source = 'manual',
    readingStatus = 'To Read',
    isFavorite = false,
    rating = null,
  } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const [result] = await pool.execute(
      `INSERT INTO books (google_volume_id, title, authors, category, publisher, published_date, isbn, description, cover_url, source, reading_status, is_favorite, rating)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        googleVolumeId || null,
        title,
        authors ? JSON.stringify(authors) : null,
        category || null,
        publisher || null,
        publishedDate || null,
        isbn || null,
        description || null,
        coverUrl || null,
        source,
        readingStatus,
        isFavorite ? 1 : 0,
        rating,
      ]
    );
    const insertedId = result.insertId;
    const [newRows] = await pool.query('SELECT * FROM books WHERE id = ?', [insertedId]);
    res.status(201).json(mapBook(newRows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

exports.updateBook = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const allowed = ['title', 'authors', 'category', 'publisher', 'publishedDate', 'isbn', 'description', 'coverUrl', 'readingStatus', 'isFavorite', 'rating'];
  const setClauses = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      let column = key;
      if (key === 'publishedDate') column = 'published_date';
      else if (key === 'coverUrl') column = 'cover_url';
      else if (key === 'readingStatus') column = 'reading_status';
      else if (key === 'isFavorite') column = 'is_favorite';
      else if (key === 'authors') column = 'authors';
      else column = key;
      setClauses.push(`${column} = ?`);
      if (key === 'authors') values.push(JSON.stringify(fields[key]));
      else if (key === 'isFavorite') values.push(fields[key] ? 1 : 0);
      else values.push(fields[key]);
    }
  }
  if (setClauses.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  try {
    await pool.execute(`UPDATE books SET ${setClauses.join(', ')} WHERE id = ?`, [...values, id]);
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    res.json(mapBook(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update book' });
  }
};

exports.deleteBook = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM books WHERE id = ?', [id]);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

exports.toggleFavorite = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT is_favorite FROM books WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    const newValue = rows[0].is_favorite ? 0 : 1;
    await pool.execute('UPDATE books SET is_favorite = ? WHERE id = ?', [newValue, id]);
    const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    res.json(mapBook(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

exports.updateReadingStatus = async (req, res) => {
  const { id } = req.params;
  const { readingStatus, note } = req.body;
  if (!readingStatus) return res.status(400).json({ error: 'readingStatus required' });
  try {
    const [oldRows] = await pool.query('SELECT reading_status FROM books WHERE id = ?', [id]);
    if (oldRows.length === 0) return res.status(404).json({ error: 'Book not found' });
    const oldStatus = oldRows[0].reading_status;
    await pool.execute('UPDATE books SET reading_status = ? WHERE id = ?', [readingStatus, id]);
    
    // Insert history record with note
    const noteVal = (note && typeof note === 'string' && note.trim().length > 0) ? note.trim() : null;
    await pool.execute(
      'INSERT INTO reading_history (book_id, old_status, new_status, note) VALUES (?,?,?,?)',
      [id, oldStatus, readingStatus, noteVal]
    );
    const [newRows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    res.json(mapBook(newRows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.updateRating = async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  if (rating == null) return res.status(400).json({ error: 'rating required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });
  try {
    await pool.execute('UPDATE books SET rating = ? WHERE id = ?', [rating, id]);
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    res.json(mapBook(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update rating' });
  }
};

exports.getBookHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM reading_history WHERE book_id = ? ORDER BY changed_at DESC', [id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};
