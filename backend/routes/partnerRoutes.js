const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validators/userValidator');

// @route   POST /api/partners/login
// @desc    Partner login (checks specifically in PartnerProfile)
// @access  Public
router.post('/login', validate(loginSchema), partnerController.login);


// @route   POST /api/partners/toggle-status
// @desc    Toggle partner's online/offline status
// @access  Private (Partner Only)
router.post('/toggle-status', partnerController.toggleStatus);

// @route   GET /api/partners/stats/:userId
// @desc    Get partner dashboard statistics
// @access  Private (Partner Only)
router.get('/stats/:userId', partnerController.getStats);

// @route   GET /api/partners/ledger/:userId
// @desc    Get partner's transaction ledger
// @access  Private (Partner Only)
router.get('/ledger/:userId', partnerController.getLedger);

// @route   GET /api/partners/available-count
// @desc    Get count of online partners for landing page
// @access  Public
router.get('/available-count', partnerController.getAvailableCount);

module.exports = router;
