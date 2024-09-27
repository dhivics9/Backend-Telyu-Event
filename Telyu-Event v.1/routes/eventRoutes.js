const express = require('express');
const router = express.Router();

const eventControl = require('../controllers/eventController');
const authControl = require('../middleware/authMiddleware');


// Public routes
router.get('/', authControl.protect, eventControl.getEvents);
router.get('/date', authControl.protect, eventControl.getEventByDate);

// Protected routes
router.post('/register/:eventId', authControl.protect, eventControl.registerForEvent);
router.post('/payment/:id', authControl.protect, eventControl.makePayment);

//Protected routes (Without authentication)
// router.post('/register/:id', eventControl.registerForEvent);
// router.post('/:id/payment', eventControl.makePayment);

// Organization routes
router.post('/add', authControl.protect, authControl.authorize, eventControl.addEvent);
router.put('/edit/:id', authControl.protect, authControl.authorize, eventControl.updateEvent);
router.delete('/delete/:id', authControl.protect, authControl.authorize, eventControl.deleteEvent);

//Organization routes (Wihout authentication)
// router.post('/add', eventControl.addEvent);
// router.put('/edit/:id', eventControl.updateEvent);
// router.delete('/delete/:id', eventControl.deleteEvent);

module.exports = router;
