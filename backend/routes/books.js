// Make sure these routes are in your books.js file:
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// CRUD operations
router.get('/', bookController.getAllBooks);
router.get('/search/:query', bookController.searchBooks);  // Put search before :id
router.get('/category/:category', bookController.getBooksByCategory);  // Put category before :id
router.get('/available', bookController.getAvailableBooks);  // Put available before :id
router.get('/:id', bookController.getBookById);  // This should come after other specific routes
router.post('/', bookController.createBook);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;