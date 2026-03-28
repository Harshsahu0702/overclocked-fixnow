const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// @route   POST /api/ai/interpret
// @desc    Process customer request text to identify service, price, and nearby workers
// @access  Public
router.post("/interpret", aiController.interpretService);

module.exports = router;
