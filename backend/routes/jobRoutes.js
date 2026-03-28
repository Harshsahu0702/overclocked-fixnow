const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const validate = require('../middlewares/validate');
const { createJobSchema, statusUpdateSchema } = require('../validators/jobValidator');

// @route   POST /api/jobs/create
// @desc    Create a new job and dispatch to nearest partners
// @access  Private (Customer)
router.post('/create', validate(createJobSchema), jobController.createJob);


// @route   GET /api/jobs/active/:userId
// @desc    Get the most recent active job for a user (customer or partner)
// @access  Private
router.get('/active/:userId', jobController.getActiveJob);

// @route   GET /api/jobs/history/:userId
// @desc    Get job history for a user (customer or partner)
// @access  Private
router.get('/history/:userId', jobController.getJobHistory);

// @route   POST /api/jobs/:id/accept
// @desc    Partner accepts a job offer
// @access  Private (Partner)
router.post('/:id/accept', jobController.acceptJob);

// @route   POST /api/jobs/:id/propose
// @desc    Partner proposes a different price (optional feature)
// @access  Private (Partner)
router.post('/:id/propose', jobController.proposePrice);

// @route   PATCH /api/jobs/:id/status
// @desc    Update job status lifecycle (ACCEPTED -> ON_THE_WAY -> IN_PROGRESS -> COMPLETED -> PAID)
// @access  Private
router.patch('/:id/status', validate(statusUpdateSchema), jobController.updateJobStatus);


module.exports = router;
