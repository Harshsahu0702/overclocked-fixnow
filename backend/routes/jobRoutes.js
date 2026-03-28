const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const PartnerProfile = require('../models/PartnerProfile');

// 1. Create Job & Dispatch to Nearest
router.post('/create', async (req, res) => {
    try {
        const { customerId, serviceType, location, price, description, imageUrl } = req.body;
        console.log("📝 New Booking (Customer in User, Partner in Profile):", { customerId, serviceType, price });

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ success: false, message: "Invalid location" });
        }

        // 1. Find nearby partners directly in Profile collection
        const nearestPartners = await PartnerProfile.find({
            status: 'APPROVED',
            isOnline: true,
            workingStatus: 'AVAILABLE',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    $maxDistance: 7000 // 7km
                }
            }
        });

        // 2. Filter by Skill (as requested: "job sare bhiya jo us service provide kr rhe unko jana nchhaiye")
        const targetPartners = nearestPartners.filter(p => {
            if (!p.skills || p.skills.length === 0) return false;
            const searchTerm = serviceType.toLowerCase();
            return p.skills.some(s => s.toLowerCase().includes(searchTerm) || searchTerm.includes(s.toLowerCase()));
        });

        const targetPartnerIds = targetPartners.map(p => p._id);
        if (targetPartnerIds.length === 0) {
            return res.status(404).json({ success: false, message: `Hume koi specialized ${serviceType} nahi mila aapke pas! Plz try again later.` });
        }

        // 2. Create Job
        const job = new Job({
            customerId,
            partnerIds: targetPartnerIds, 
            service: serviceType || "General Service",
            description,
            imageUrl,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                address: location.address
            },
            basePrice: price,
            status: 'OFFERED'
        });

        await job.save();

        res.status(201).json({
            success: true,
            job,
            partnerIds: targetPartnerIds,
            message: "Dispatching to nearby Bhaiya!"
        });

    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Active Job for User/Partner
router.get('/active/:userId', async (req, res) => {
    try {
        const { role } = req.query;
        let query = { status: { $nin: ['PAID', 'CANCELLED'] } };

        if (role === 'partner') {
            // userId here is actually the PartnerProfile._id
            query.$or = [
                { partnerId: req.params.userId },
                { partnerIds: req.params.userId, status: 'OFFERED' }
            ];
        } else {
            query.customerId = req.params.userId;
        }

        const jobs = await Job.find(query)
            .populate('customerId')
            .populate('partnerId')
            .sort({ createdAt: -1 }); // Newest first by default

        // Prioritize actual engagements over pending offers
        const activeMission = jobs.find(j => ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(j.status));
        
        // SELF-HEALING: If BUSY but no active job found, reset partner status
        if (!activeMission && role === 'partner') {
            const profile = await PartnerProfile.findById(req.params.userId);
            if (profile && profile.workingStatus === 'BUSY') {
                console.log("🛠️ Healing Dangling Session: Resetting partner to AVAILABLE");
                profile.workingStatus = 'AVAILABLE';
                await profile.save();
            }
        }

        res.json({ success: true, job: activeMission || jobs[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2.1 Job History for User/Partner
router.get('/history/:userId', async (req, res) => {
    try {
        const { role } = req.query;
        let query = { status: { $in: ['PAID', 'CANCELLED', 'COMPLETED'] } };

        if (role === 'partner') {
            query.partnerId = req.params.userId;
        } else {
            query.customerId = req.params.userId;
        }

        const jobs = await Job.find(query)
            .populate('customerId')
            .populate('partnerId')
            .sort({ createdAt: -1 });

        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Accept Job (Atomic First-Come-First-Served)
router.post('/:id/accept', async (req, res) => {
    try {
        const { partnerId } = req.body;
        
        // ATOMIC UPDATE: Only update if status is still 'OFFERED'
        // This prevents race conditions where two partners accept at the same time
        const job = await Job.findOneAndUpdate(
            { _id: req.params.id, status: 'OFFERED' },
            { 
                $set: { 
                    status: 'ACCEPTED', 
                    partnerId: partnerId,
                    otp: Math.floor(1000 + Math.random() * 9000).toString(),
                    finalPrice: req.body.price || 300 // default or from request
                } 
            },
            { new: true }
        ).populate('customerId').populate('partnerId');

        if (!job) {
            return res.status(400).json({ 
                success: false, 
                message: "Mission no longer available. Another Bhaiya grabbed it first! 🚀" 
            });
        }

        // Mark partner as BUSY
        await PartnerProfile.findByIdAndUpdate(partnerId, { workingStatus: 'BUSY' });

        const cId = job.customerId?._id?.toString() || job.customerId?.toString();
        const pId = partnerId.toString();

        // 1. Notify Customer & Accepted Partner
        const payload = { jobId: job._id, status: job.status, customerId: cId, partnerId: pId, job };
        global.io.to(`job_${job._id}`).emit('status_changed', payload);
        global.io.to(`customer_${cId}`).emit('status_changed', payload);
        global.io.to(`partner_${pId}`).emit('status_changed', payload);

        // 2. BROADCAST "JOB_TAKEN" to all other partners who were offered this job
        // This ensures the job disappears from their dashboards immediately
        if (job.partnerIds && job.partnerIds.length > 0) {
            job.partnerIds.forEach(id => {
                const targetId = id.toString();
                if (targetId !== pId) {
                    console.log(`📡 Notifying partner ${targetId} to remove job ${job._id}`);
                    global.io.to(`partner_${targetId}`).emit('job_taken', { jobId: job._id });
                }
            });
        }

        res.json({ success: true, job });
    } catch (error) {
        console.error("Accept Job Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reject/Ignore Job
router.post('/:id/reject', async (req, res) => {
    try {
        const { partnerId } = req.body;
        await Job.findByIdAndUpdate(req.params.id, {
            $pull: { partnerIds: partnerId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Reject Job Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Propose Price
router.post('/:id/propose', async (req, res) => {
    try {
        const { partnerId, offeredPrice } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: "Job not found" });

        job.offers.push({ partnerId, offeredPrice, status: 'PENDING' });
        if (job.status === 'CREATED') job.status = 'OFFERED';
        await job.save();
        
        const populatedJob = await Job.findById(job._id).populate('customerId').populate('partnerId');
        res.json({ success: true, job: populatedJob });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Update Status Lifecycle
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: "Job not found" });

        if (status === 'IN_PROGRESS') {
            if (job.otp !== req.body.otp) return res.status(400).json({ success: false, message: "Invalid PIN code." });
            job.startTime = new Date();
        }

        job.status = status;

        if (status === 'COMPLETED') {
            job.endTime = new Date();
        }

        if (status === 'PAID') {
            await PartnerProfile.findByIdAndUpdate(job.partnerId, { workingStatus: 'AVAILABLE' });
            
            const profile = await PartnerProfile.findById(job.partnerId);
            if (profile) {
                profile.totalJobs += 1;
                // Full amount goes to Partner (No platform cut)
                const partnerEarnings = (job.finalPrice || job.basePrice || 0);
                
                profile.earnings = (profile.earnings || 0) + partnerEarnings;
                profile.walletBalance = (profile.walletBalance || 0) + partnerEarnings;
                await profile.save();
                console.log(`💰 Payment Processed: Mission ${job._id} (₹${partnerEarnings}) -> Partner Earnings Updated (Full Amount)`);
            }
        }

        if (status === 'CANCELLED' && job.partnerId) {
            await PartnerProfile.findByIdAndUpdate(job.partnerId, { workingStatus: 'AVAILABLE' });
        }

        await job.save();
        const populatedJob = await Job.findById(job._id).populate('customerId').populate('partnerId');

        if (!populatedJob) return res.status(404).json({ success: false, message: "Populated job not found after save" });

        const cId = (populatedJob.customerId?._id || job.customerId).toString();
        const pId = job.partnerId ? job.partnerId.toString() : null;

        const payload = { jobId: job._id, status: job.status, customerId: cId, partnerId: pId, job: populatedJob };
        global.io.to(`job_${job._id}`).emit('status_changed', payload);
        global.io.to(`customer_${cId}`).emit('status_changed', payload);
        if (pId) global.io.to(`partner_${pId}`).emit('status_changed', payload);

        // Notify other partners that the job is gone if cancelled
        if (status === 'CANCELLED' && job.partnerIds && job.partnerIds.length > 0) {
            job.partnerIds.forEach(id => {
                const targetId = id.toString();
                if (targetId !== pId) {
                    global.io.to(`partner_${targetId}`).emit('job_taken', { jobId: job._id });
                }
            });
        }

        res.json({ success: true, job: populatedJob });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
