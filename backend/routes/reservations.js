const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// CRUD operations
router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.delete('/:id', reservationController.deleteReservation);

// Additional features
router.get('/member/:memberId', reservationController.getMemberReservations);
router.get('/book/:bookId', reservationController.getBookReservations);
router.put('/:id/return', reservationController.returnBook);
router.get('/overdue', reservationController.getOverdueReservations);

module.exports = router;