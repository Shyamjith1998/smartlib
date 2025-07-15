const db = require('../database/db');

// Get all members
exports.getAllMembers = (req, res) => {
    const sql = 'SELECT * FROM members ORDER BY name';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ members: rows });
    });
};

// Get member by ID
exports.getMemberById = (req, res) => {
    const sql = 'SELECT * FROM members WHERE id = ?';
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }
        res.json({ member: row });
    });
};

// Create new member
exports.createMember = (req, res) => {
    const { member_id, name, email, phone, address, membership_type } = req.body;
    
    if (!member_id || !name || !email) {
        res.status(400).json({ error: 'Member ID, name, and email are required' });
        return;
    }

    const sql = `INSERT INTO members (member_id, name, email, phone, address, membership_type) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [member_id, name, email, phone, address, membership_type || 'standard'];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Member created successfully'
        });
    });
};

// Update member
exports.updateMember = (req, res) => {
    const { name, email, phone, address, membership_type, status } = req.body;
    
    const sql = `UPDATE members SET 
                 name = COALESCE(?, name),
                 email = COALESCE(?, email),
                 phone = COALESCE(?, phone),
                 address = COALESCE(?, address),
                 membership_type = COALESCE(?, membership_type),
                 status = COALESCE(?, status),
                 updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
    
    const params = [name, email, phone, address, membership_type, status, req.params.id];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }
        res.json({ message: 'Member updated successfully', changes: this.changes });
    });
};

// Delete member
exports.deleteMember = (req, res) => {
    const sql = 'DELETE FROM members WHERE id = ?';
    
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }
        res.json({ message: 'Member deleted successfully', changes: this.changes });
    });
};

// Search members
exports.searchMembers = (req, res) => {
    const query = `%${req.params.query}%`;
    const sql = `SELECT * FROM members 
                 WHERE name LIKE ? OR email LIKE ? OR member_id LIKE ? 
                 ORDER BY name`;
    
    db.all(sql, [query, query, query], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ members: rows });
    });
};

// Get members by status
exports.getMembersByStatus = (req, res) => {
    const sql = 'SELECT * FROM members WHERE status = ? ORDER BY name';
    
    db.all(sql, [req.params.status], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ members: rows });
    });
};