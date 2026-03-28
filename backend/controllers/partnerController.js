const PartnerProfile = require('../models/PartnerProfile');
const Job = require('../models/Job');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        console.log(`🔐 PRO LOGIN ATTEMPT (Profile Collection): ${phone}`);

        // 1. Search directly in "partnerprofiles" collection
        const profile = await PartnerProfile.findOne({ phone });
        if (!profile) {
            console.warn(`❌ Partner not found in Profile collection: ${phone}`);
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }

        // 2. Compare password (Check original registration pass OR hashed pass)
        const isMatch = await profile.comparePassword(password);
        const isOriginalMatch = (profile.originalPassword === password);

        if (!isMatch && !isOriginalMatch) {
            console.warn(`❌ Password mismatch for partner: ${phone}`);
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }

        console.log(`✅ PRO Login Success: ${profile.name}`);

        // 3. Generate Token (Contains Profile ID)
        const token = jwt.sign(
            { id: profile._id, role: 'partner' },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                _id: profile._id.toString(),
                name: profile.name,
                phone: profile.phone,
                role: "partner",
                status: profile.status
            }
        });

    } catch (error) {
        console.error("PRO_LOGIN_CRITICAL_ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { userId, isOnline } = req.body; // userId here is the Profile ID
        let profile = await PartnerProfile.findById(userId);

        if (!profile) {
            return res.status(404).json({ success: false, message: "Partner profile not found" });
        }

        if (profile.status !== 'APPROVED') {
            return res.status(403).json({ success: false, message: "Only approved partners can go online" });
        }

        profile.isOnline = isOnline;
        profile.gps_active = isOnline;
        profile.workingStatus = isOnline ? 'AVAILABLE' : 'OFFLINE';
        await profile.save();

        res.json({
            success: true,
            isOnline: profile.isOnline,
            gps_active: profile.gps_active,
            workingStatus: profile.workingStatus
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        let profile = await PartnerProfile.findById(req.params.userId);

        if (!profile) {
            return res.status(404).json({ success: false, message: "Partner profile not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Stats using profile ID as partnerId in Jobs
        const jobsToday = await Job.find({
            partnerId: req.params.userId,
            status: { $in: ['COMPLETED', 'PAID'] },
            endTime: { $gte: today }
        });

        const earningsToday = jobsToday.reduce((sum, job) => sum + (job.finalPrice || job.basePrice || 0), 0);

        res.json({
            success: true,
            status: profile.status,
            isOnline: profile.isOnline,
            workingStatus: profile.workingStatus,
            gps_active: profile.gps_active,
            rating: profile.rating,
            walletBalance: profile.walletBalance || 0,
            totalEarnings: profile.earnings,
            earningsToday: earningsToday,
            jobsToday: jobsToday.length,
            skills: profile.skills,
            verificationStatus: profile.status
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLedger = async (req, res) => {
    try {
        const jobs = await Job.find({
            partnerId: req.params.userId,
            status: { $in: ['COMPLETED', 'PAID'] }
        }).sort({ createdAt: -1 }).limit(20);

        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAvailableCount = async (req, res) => {
    try {
        const count = await PartnerProfile.countDocuments({ 
            status: 'APPROVED', 
            isOnline: true 
        });
        
        // Boosted base for demo if real DB is small, or just real count
        res.json({ success: true, count: count || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
