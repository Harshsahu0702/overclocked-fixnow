const User = require('../models/User');
const PartnerProfile = require('../models/PartnerProfile');
const Job = require('../models/Job');
const { sendApprovalMail } = require('../utils/mailer');

exports.getAllPartners = async (req, res) => {
    try {
        const partners = await PartnerProfile.find()
            .select('name phone selfie email skills status isOnline createdAt');
        res.json({ success: true, partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPartnerById = async (req, res) => {
    try {
        const partner = await PartnerProfile.findById(req.params.id);
        if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });
        res.json({ success: true, partner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyPartner = async (req, res) => {
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
};

exports.getOnlineWorkers = async (req, res) => {
    try {
        const workers = await PartnerProfile.find({ isOnline: true }).select('name phone location status');
        res.json({ success: true, workers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.forceOffline = async (req, res) => {
    try {
        const { userId } = req.body; // In this system, userId refers to the Profile ID for partners
        await PartnerProfile.findByIdAndUpdate(userId, { isOnline: false, workingStatus: 'OFFLINE' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getActiveJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: { $nin: ['PAID', 'CANCELLED', 'COMPLETED'] } })
            .populate('customerId')
            .populate({ path: 'partnerId', model: 'PartnerProfile' })
            .sort({ createdAt: -1 });
        
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllMissions = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('customerId')
            .populate({ path: 'partnerId', model: 'PartnerProfile' })
            .sort({ createdAt: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPlatformStats = async (req, res) => {
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
};
