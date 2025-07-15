const db = require('../database/db');

// Get all reviews
exports.getAllReviews = (req, res) => {
    const sql = `SELECT r.*, b.title as book_title, m.name as member_name 
                 FROM reviews r
                 JOIN books b ON r.book_id = b.id
                 JOIN members m ON r.member_id = m.id
                 ORDER BY r.created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ reviews: rows });
    });
};

// Get review by ID
exports.getReviewById = (req, res) => {
    const sql = `SELECT r.*, b.title as book_title, m.name as member_name 
                 FROM reviews r
                 JOIN books b ON r.book_id = b.id
                 JOIN members m ON r.member_id = m.id
                 WHERE r.id = ?`;
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        res.json({ review: row });
    });
};

// Create new review
exports.createReview = (req, res) => {
    const { book_id, member_id, rating, comment } = req.body;
    
    if (!book_id || !member_id || !rating) {
        res.status(400).json({ error: 'Book ID, member ID, and rating are required' });
        return;
    }

    if (rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Rating must be between 1 and 5' });
        return;
    }

    const sql = `INSERT INTO reviews (book_id, member_id, rating, comment) VALUES (?, ?, ?, ?)`;
    db.run(sql, [book_id, member_id, rating, comment], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Review created successfully'
        });
    });
};

// Update review
exports.updateReview = (req, res) => {
    const { rating, comment } = req.body;
    
    if (rating && (rating < 1 || rating > 5)) {
        res.status(400).json({ error: 'Rating must be between 1 and 5' });
        return;
    }

    const sql = `UPDATE reviews SET 
                 rating = COALESCE(?, rating),
                 comment = COALESCE(?, comment)
                 WHERE id = ?`;
    
    db.run(sql, [rating, comment, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        res.json({ message: 'Review updated successfully', changes: this.changes });
    });
};

// Delete review
exports.deleteReview = (req, res) => {
    const sql = 'DELETE FROM reviews WHERE id = ?';
    
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        res.json({ message: 'Review deleted successfully', changes: this.changes });
    });
};

// Get book reviews
exports.getBookReviews = (req, res) => {
    const sql = `SELECT r.*, m.name as member_name 
                 FROM reviews r
                 JOIN members m ON r.member_id = m.id
                 WHERE r.book_id = ?
                 ORDER BY r.created_at DESC`;
    
    db.all(sql, [req.params.bookId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ reviews: rows });
    });
};

// Get member reviews
exports.getMemberReviews = (req, res) => {
    const sql = `SELECT r.*, b.title as book_title 
                 FROM reviews r
                 JOIN books b ON r.book_id = b.id
                 WHERE r.member_id = ?
                 ORDER BY r.created_at DESC`;
    
    db.all(sql, [req.params.memberId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ reviews: rows });
    });
};