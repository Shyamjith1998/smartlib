const db = require('../database/db');

// Get all reservations
exports.getAllReservations = (req, res) => {
    const sql = `SELECT r.*, b.title as book_title, m.name as member_name 
                 FROM reservations r
                 JOIN books b ON r.book_id = b.id
                 JOIN members m ON r.member_id = m.id
                 ORDER BY r.reservation_date DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ reservations: rows });
    });
};

// Get reservation by ID
exports.getReservationById = (req, res) => {
    const sql = `SELECT r.*, b.title as book_title, m.name as member_name 
                 FROM reservations r
                 JOIN books b ON r.book_id = b.id
                 JOIN members m ON r.member_id = m.id
                 WHERE r.id = ?`;
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }
        res.json({ reservation: row });
    });
};

// Create new reservation
exports.createReservation = (req, res) => {
    const { book_id, member_id, due_date } = req.body;
    
    if (!book_id || !member_id || !due_date) {
        res.status(400).json({ error: 'Book ID, member ID, and due date are required' });
        return;
    }

    // Check if book is available
    db.get('SELECT available_copies FROM books WHERE id = ?', [book_id], (err, book) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!book || book.available_copies <= 0) {
            res.status(400).json({ error: 'Book not available' });
            return;
        }

        // Create reservation
        const sql = `INSERT INTO reservations (book_id, member_id, due_date) VALUES (?, ?, ?)`;
        db.run(sql, [book_id, member_id, due_date], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Update book availability
            db.run('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book_id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.status(201).json({
                    id: this.lastID,
                    message: 'Reservation created successfully'
                });
            });
        });
    });
};

// Update reservation
exports.updateReservation = (req, res) => {
    const { due_date, status } = req.body;
    
    const sql = `UPDATE reservations SET 
                 due_date = COALESCE(?, due_date),
                 status = COALESCE(?, status),
                 updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
    
    db.run(sql, [due_date, status, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }
        res.json({ message: 'Reservation updated successfully', changes: this.changes });
    });
};

// Delete reservation
exports.deleteReservation = (req, res) => {
    // First get the reservation to restore book availability
    db.get('SELECT book_id, status FROM reservations WHERE id = ?', [req.params.id], (err, reservation) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!reservation) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }

        const sql = 'DELETE FROM reservations WHERE id = ?';
        db.run(sql, [req.params.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // If reservation was active, restore book availability
            if (reservation.status === 'active') {
                db.run('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [reservation.book_id]);
            }

            res.json({ message: 'Reservation deleted successfully', changes: this.changes });
        });
    });
};

// Get member reservations
exports.getMemberReservations = (req, res) => {
    const sql = `SELECT r.*, b.title as book_title 
                 FROM reservations r
                 JOIN books b ON r.book_id = b.id
                 WHERE r.member_id = ?
                 ORDER BY r.reservation_date DESC`;
    
    db.all(sql, [req.params.memberId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ reservations: rows });
    });
};

// Get book reservations
exports.getBookReservations = (req, res) => {
    const sql = `SELECT r.*, m.name as member_name 
                 FROM reservations r
                 JOIN members m ON r.member_id = m.id
                 WHERE r.book_id = ?
                 ORDER BY r.reservation_date DESC`;
    
    db.all(sql, [req.params.bookId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ reservations: rows });
    });
};

// Return book
exports.returnBook = (req, res) => {
    const reservationId = req.params.id;
    
    db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], (err, reservation) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!reservation) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }

        const returnDate = new Date().toISOString().split('T')[0];
        const dueDate = new Date(reservation.due_date);
        const returnDateObj = new Date(returnDate);
        
        // Calculate late fee (€1 per day)
        let lateFee = 0;
        if (returnDateObj > dueDate) {
            const daysLate = Math.ceil((returnDateObj - dueDate) / (1000 * 60 * 60 * 24));
            lateFee = daysLate * 1;
        }

        const sql = `UPDATE reservations SET 
                     return_date = ?,
                     status = 'returned',
                     late_fee = ?,
                     updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`;
        
        db.run(sql, [returnDate, lateFee, reservationId], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Update book availability
            db.run('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [reservation.book_id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ 
                    message: 'Book returned successfully',
                    late_fee: lateFee
                });
            });
        });
    });
};

// Get overdue reservations
exports.getOverdueReservations = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const sql = `SELECT r.*, b.title as book_title, m.name as member_name, m.email as member_email
                 FROM reservations r
                 JOIN books b ON r.book_id = b.id
                 JOIN members m ON r.member_id = m.id
                 WHERE r.status = 'active' AND r.due_date < ?
                 ORDER BY r.due_date`;
    
    db.all(sql, [today], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ reservations: rows });
    });
};