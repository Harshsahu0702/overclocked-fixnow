const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PartnerProfile = require('../models/PartnerProfile');
const Job = require('../models/Job');
const { sendApprovalMail } = require('../utils/mailer');

// 1. Get all partner applications (PROFILES ONLY)
router.get('/partners', async (req, res) => {
    try {
        const partners = await PartnerProfile.find()
            .select('name phone selfie email skills status isOnline createdAt');
        res.json({ success: true, partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Get single partner detail
router.get('/partner/:id', async (req, res) => {
    try {
        const partner = await PartnerProfile.findById(req.params.id);
        if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });
        res.json({ success: true, partner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Approve/Reject partner
router.post('/verify-partner', async (req, res) => {
    try {
        const { profileId, status } = req.body;

        const profile = await PartnerProfile.findById(profileId);
        if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

        console.log(`🛠️ Admin Verification: ${profileId} -> ${status}`);
        profile.status = status;
        await profile.save();

        if (status === 'APPROVED' && profile.email) {
            console.log(`📧 Sending approval mail to: ${profile.email}`);
            await sendApprovalMail(
                profile.email, 
                profile.name, 
                profile.phone, 
                profile.originalPassword || "Your signup password"
            );
        }
        
        res.json({ success: true, profile });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Get online workers for map (PRO Only)
router.get('/online-workers', async (req, res) => {
    try {
        const workers = await PartnerProfile.find({ isOnline: true }).select('name phone location status');
        res.json({ success: true, workers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Force Offline
router.post('/force-offline', async (req, res) => {
    try {
        const { userId } = req.body; // In this system, userId refers to the Profile ID for partners
        await PartnerProfile.findByIdAndUpdate(userId, { isOnline: false, workingStatus: 'OFFLINE' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. Get all Active Jobs (Ongoing)
router.get('/active-jobs', async (req, res) => {
    try {
        const jobs = await Job.find({ status: { $nin: ['PAID', 'CANCELLED', 'COMPLETED'] } })
            .populate('customerId')
            .populate({ path: 'partnerId', model: 'PartnerProfile' })
            .sort({ createdAt: -1 });
        
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 7. Get ALL Missions (History & Ongoing)
router.get('/all-missions', async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('customerId')
            .populate({ path: 'partnerId', model: 'PartnerProfile' })
            .sort({ createdAt: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 8. Platform Overview Stats
router.get('/platform-stats', async (req, res) => {
    try {
        const jobs = await Job.find({ status: { $in: ['COMPLETED', 'PAID'] } });
        const revenue = jobs.reduce((sum, j) => sum + (j.finalPrice || j.basePrice || 0), 0);
        
        const totalPartners = await PartnerProfile.countDocuments();
        const activePartners = await PartnerProfile.countDocuments({ isOnline: true });
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalMissions = await Job.countDocuments();

        console.log("📊 Admin Stats Fetch:", { revenue, totalMissions, totalPartners, totalCustomers });
        
        res.json({
            success: true,
            revenue,
            totalMissions,
            totalPartners,
            activePartners,
            totalCustomers
        });
    } catch (error) {
        console.error("❌ Stats Fetch Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
