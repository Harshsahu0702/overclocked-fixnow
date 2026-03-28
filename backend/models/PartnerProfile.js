const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerProfileSchema = new mongoose.Schema({
    // Identity Details (Moved from User to Profile for Total Separation)
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    
    // Professional Details
    skills: [{ type: String }],
    aadhaar: { type: String },
    aadhaarPic: { type: String },
    selfie: { type: String },
    originalPassword: { type: String }, // Store for approval email
    
    experience: { type: Number, default: 0 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    alternatePhone: { type: String },
    bio: { type: String },
    
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
    },
    isOnline: { type: Boolean, default: false },
    gps_active: { type: Boolean, default: false },
    workingStatus: {
        type: String,
        enum: ["AVAILABLE", "BUSY", "OFFLINE"],
        default: "OFFLINE"
    },
    
    // Geolocation for "Bhaiya Nearby" feature
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },

    rating: { type: Number, default: 5.0 },
    totalJobs: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

partnerProfileSchema.index({ location: '2dsphere' });

// Hash password before saving
partnerProfileSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
partnerProfileSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('PartnerProfile', partnerProfileSchema);
