const db = require('../database/db');

// Get all books
exports.getAllBooks = (req, res) => {
    const sql = 'SELECT * FROM books ORDER BY title';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ books: rows });
    });
};

// Get book by ID
exports.getBookById = (req, res) => {
    const sql = 'SELECT * FROM books WHERE id = ?';
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }
        res.json({ book: row });
    });
};

// Create new book
exports.createBook = (req, res) => {
    const { isbn, title, author, publisher, year, category, total_copies, location } = req.body;
    
    if (!isbn || !title || !author) {
        res.status(400).json({ error: 'ISBN, title, and author are required' });
        return;
    }

    const sql = `INSERT INTO books (isbn, title, author, publisher, year, category, total_copies, available_copies, location) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [isbn, title, author, publisher, year, category, total_copies || 1, total_copies || 1, location];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Book created successfully'
        });
    });
};

// Update book
exports.updateBook = (req, res) => {
    const { isbn, title, author, publisher, year, category, total_copies, available_copies, location } = req.body;
    
    const sql = `UPDATE books SET 
                 isbn = COALESCE(?, isbn),
                 title = COALESCE(?, title),
                 author = COALESCE(?, author),
                 publisher = COALESCE(?, publisher),
                 year = COALESCE(?, year),
                 category = COALESCE(?, category),
                 total_copies = COALESCE(?, total_copies),
                 available_copies = COALESCE(?, available_copies),
                 location = COALESCE(?, location),
                 updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
    
    const params = [isbn, title, author, publisher, year, category, total_copies, available_copies, location, req.params.id];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }
        res.json({ message: 'Book updated successfully', changes: this.changes });
    });
};

// Delete book
exports.deleteBook = (req, res) => {
    const sql = 'DELETE FROM books WHERE id = ?';
    
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }
        res.json({ message: 'Book deleted successfully', changes: this.changes });
    });
};

// Search books
exports.searchBooks = (req, res) => {
    const query = `%${req.params.query}%`;
    const sql = `SELECT * FROM books 
                 WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? 
                 ORDER BY title`;
    
    db.all(sql, [query, query, query], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ books: rows });
    });
};

// Get books by category
exports.getBooksByCategory = (req, res) => {
    const sql = 'SELECT * FROM books WHERE category = ? ORDER BY title';
    
    db.all(sql, [req.params.category], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ books: rows });
    });
};

// Get available books
exports.getAvailableBooks = (req, res) => {
    const sql = 'SELECT * FROM books WHERE available_copies > 0 ORDER BY title';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ books: rows });
    });
};