const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/', historyController.getAllHistory);
router.get('/:id', historyController.getHistoryByBookId);
router.patch('/:id/note', historyController.updateHistoryNote);

module.exports = router;
