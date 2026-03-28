const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PartnerProfile = require('../models/PartnerProfile');
const { transporter } = require('../utils/mailer');
const jwt = require('jsonwebtoken');

const sendWelcomeMail = async (email, name) => {
    const mailOptions = {
        from: '"FixNow Network" <harshsahu10072006@gmail.com>',
        to: email,
        subject: '🚀 FixNow Partner Application Received!',
        html: `
            <div style="font-family: Arial, sans-serif; border: 10px solid #FACC15; padding: 40px; border-radius: 20px;">
                <h1 style="color: #000; text-transform: uppercase; font-style: italic;">Welcome to the Clan, ${name}!</h1>
                <p style="font-size: 18px; color: #333;">We have successfully received your <b>Partner Application</b> for the FixNow Network.</p>
                <div style="background: #000; color: #FACC15; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; font-size: 20px;">STATUS: UNDER REVIEW 🔍</p>
                </div>
                <p style="color: #666;">Our verification team is currently reviewing your Aadhaar and Selfie documents. This usually takes 2-4 hours during business days.</p>
                <p style="font-size: 14px; color: #999;">If this wasn't you, please ignore this email or contact support.</p>
                <hr style="border: 1px solid #eee;">
                <p style="font-weight: bold; text-align: center;">FixNow Technologies - Redefining Local Services</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${email}`);
    } catch (err) {
        console.error("📧 Email Error:", err.message);
    }
};

router.post('/register', async (req, res) => {
    try {
        const {
            phone, email, password, name, role,
            skills, customSkill, aadhaar, aadhaarPic, selfie,
            experience, gender, address, alternatePhone, bio, location
        } = req.body;

        console.log(`📝 Registration Attempt: ${role} - ${phone}`);

        // --- CASE 1: PARTNER REGISTRATION (Footer Signup) ---
        if (role === 'partner') {
            // Check if partner already exists in PartnerProfile
            const existingPartner = await PartnerProfile.findOne({ 
                $or: [{ phone }, { email: email || 'never_match' }] 
            });
            if (existingPartner) {
                return res.status(400).json({ success: false, message: "Partner already registered with this phone/email." });
            }

            const finalSkills = skills || [];
            if (customSkill) finalSkills.push(customSkill);

            const profile = new PartnerProfile({
                name,
                phone,
                email,
                password, // Will be hashed by pre-save hook in model
                skills: finalSkills,
                aadhaar,
                aadhaarPic,
                selfie,
                originalPassword: password, // For approval email
                experience,
                gender,
                address,
                alternatePhone,
                bio,
                location: location || { type: 'Point', coordinates: [0, 0] },
                status: "PENDING"
            });

            await profile.save();
            
            if (email) sendWelcomeMail(email, name);

            return res.status(201).json({
                success: true,
                message: "Application submitted successfully",
                user: { _id: profile._id, name, phone, role: 'partner' }
            });
        }

        // --- CASE 2: CUSTOMER REGISTRATION (Navbar Signup) ---
        const existingUser = await User.findOne({ 
            $or: [{ phone }, { email: email || 'never_match' }] 
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists with this phone/email." });
        }

        const user = new User({
            phone,
            email,
            password,
            name,
            role: 'customer',
            location: location || { type: 'Point', coordinates: [0, 0] }
        });

        await user.save();

        return res.status(201).json({
            success: true,
            user: { _id: user._id, name, phone, role: 'customer' }
        });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const phone = req.body.phone?.trim();
        const password = req.body.password?.trim();

        console.log(`🔑 Customer Login Attempt: ${phone}`);

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id.toString(),
                phone: user.phone,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login Server Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Update User Profile
router.patch('/:id', async (req, res) => {
    try {
        const { name, email, phone, role } = req.body;
        
        // Search in both collections since partners and customers are decoupled
        let user = await User.findById(req.params.id);
        let Model = User;

        if (!user) {
            user = await PartnerProfile.findById(req.params.id);
            Model = PartnerProfile;
        }
        
        if (!user) return res.status(404).json({ success: false, message: "User Not Found in any collection." });

        if (name) user.name = name;
        if (phone) user.phone = phone;
        
        // Handle Email - If empty string, set as undefined for sparse index compatibility
        if (email === '') {
            user.email = undefined; 
        } else if (email) {
            user.email = email;
        }

        await user.save();

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: Model === PartnerProfile ? 'partner' : 'customer'
            }
        });
    } catch (error) {
        console.error("Update Error:", error);
        // Better error message for duplicate keys
        let message = error.message;
        if (error.code === 11000) {
            message = "Phone number or Email already in use by another account! 🛑";
        }
        res.status(500).json({ success: false, message });
    }
});

module.exports = router;
