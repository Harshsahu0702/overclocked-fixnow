const PartnerProfile = require('../models/PartnerProfile');

const checkProfileCompleted = async (req, res, next) => {
    try {
        if (req.user.role !== 'partner') {
            return next();
        }

        const partner = await PartnerProfile.findById(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner not found" });
        }

        if (!partner.profileCompleted) {
            return res.status(403).json({ 
                success: false, 
                message: "Please complete your profile first (UPI, QR Code, etc.)", 
                profileCompleted: false 
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: "Profile Check Error", error: error.message });
    }
};

module.exports = checkProfileCompleted;
