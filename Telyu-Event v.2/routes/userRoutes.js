const express = require('express');
const userControl = require('../controllers/userController');
const authControl = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', userControl.register);
router.post('/login', userControl.login);
router.get('/profile', authControl.protect, userControl.getProfile);

module.exports = router;
