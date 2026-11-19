const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// CRUD operations
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.post('/', bookController.createBook);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

// Additional actions
router.patch('/:id/favorite', bookController.toggleFavorite);
router.patch('/:id/status', bookController.updateReadingStatus);
router.patch('/:id/rating', bookController.updateRating);
router.get('/:id/history', bookController.getBookHistory);

module.exports = router;
