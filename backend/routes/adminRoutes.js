const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// @route   GET /api/admin/partners
// @desc    Get all partner applications
// @access  Private (Admin)
router.get('/partners', adminController.getAllPartners);

// @route   GET /api/admin/partner/:id
// @desc    Get detailed info of a single partner
// @access  Private (Admin)
router.get('/partner/:id', adminController.getPartnerById);

// @route   POST /api/admin/verify-partner
// @desc    Approve or reject a partner application
// @access  Private (Admin)
router.post('/verify-partner', adminController.verifyPartner);

// @route   GET /api/admin/online-workers
// @desc    Get map view of all online workers
// @access  Private (Admin)
router.get('/online-workers', adminController.getOnlineWorkers);

// @route   POST /api/admin/force-offline
// @desc    Force a partner offline manually
// @access  Private (Admin)
router.post('/force-offline', adminController.forceOffline);

// @route   GET /api/admin/active-jobs
// @desc    Monitor all ongoing jobs
// @access  Private (Admin)
router.get('/active-jobs', adminController.getActiveJobs);

// @route   GET /api/admin/all-missions
// @desc    Full mission history/ledger
// @access  Private (Admin)
router.get('/all-missions', adminController.getAllMissions);

// @route   GET /api/admin/platform-stats
// @desc    Overall dashboard performance stats
// @access  Private (Admin)
router.get('/platform-stats', adminController.getPlatformStats);

module.exports = router;
