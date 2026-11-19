const express = require('express');
const router = express.Router();
const { searchBooks } = require('../services/googleBooksService');

// GET /api/external-books?q=keyword&type=all|author|title
router.get('/', async (req, res) => {
  const { q, type } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
  try {
    const results = await searchBooks(q, type || 'all');
    res.json(results);
  } catch (err) {
    console.error('External search route error:', err);
    res.status(500).json({ error: 'Failed to fetch from Google Books' });
  }
});

module.exports = router;
