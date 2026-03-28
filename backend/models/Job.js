const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    // Customers are still in the 'User' collection
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Partners are now in 'PartnerProfile' collection
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerProfile' },
    partnerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PartnerProfile' }], // For bulk dispatch offers
    
    service: { type: String, required: true },
    description: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }, // [lng, lat]
        address: String
    },
    status: {
        type: String,
        enum: ["CREATED", "OFFERED", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "PAID", "CANCELLED"],
        default: "CREATED"
    },
    basePrice: { type: Number, required: true },
    finalPrice: { type: Number },
    negotiatedPrice: { type: Number },
    offers: [{
        partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerProfile' },
        offeredPrice: Number,
        status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' }
    }],
    otp: { type: String }, // To start job
    startTime: Date,
    endTime: Date,
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    
    // Tracking Progress Timeline
    statusHistory: [{
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    
    createdAt: { type: Date, default: Date.now }
});

jobSchema.index({ location: '2dsphere' });

// Auto-track Status History
jobSchema.pre('save', async function () {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }
});

module.exports = mongoose.model('Job', jobSchema);
