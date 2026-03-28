const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/userValidator');

// @route   POST /api/users/register
// @desc    Register a new customer or partner
// @access  Public
router.post('/register', validate(registerSchema), userController.register);

// @route   POST /api/users/login
// @desc    Authenticate customer & get token
// @access  Public
router.post('/login', validate(loginSchema), userController.login);


// @route   PATCH /api/users/:id
// @desc    Update user profile
// @access  Private (auth middleware should be added here later)
router.patch('/:id', userController.updateProfile);

module.exports = router;
