const Job = require('../models/Job');
const User = require('../models/User');
const PartnerProfile = require('../models/PartnerProfile');

exports.createJob = async (req, res) => {
    try {
        const { customerId, serviceType, location, price, description } = req.body;
        console.log("📝 New Booking (Customer in User, Partner in Profile):", { customerId, serviceType, price });

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ success: false, message: "Invalid location" });
        }

        // Direct Geospatial Search in PartnerProfile collection (Bhaiya Only)
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
        }).limit(10); 

        console.log(`📍 Found ${nearestPartners.length} partners nearby directly in Profile collection`);

        const targetPartnerIds = nearestPartners.map(p => p._id);
        if (targetPartnerIds.length === 0) {
            return res.status(404).json({ success: false, message: "No Bhaiya nearby! Plz try again later." });
        }

        // 2. Create Job
        const job = new Job({
            customerId,
            partnerIds: targetPartnerIds, 
            service: serviceType || "General Service",
            description,
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
};

exports.getActiveJob = async (req, res) => {
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
};

exports.getJobHistory = async (req, res) => {
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
};

exports.acceptJob = async (req, res) => {
    try {
        const { partnerId } = req.body; // Actually PartnerProfile ID
        const job = await Job.findById(req.params.id);

        if (!job) return res.status(404).json({ success: false, message: "Job not found" });
        if (job.status !== 'OFFERED') return res.status(400).json({ success: false, message: "Job already taken" });

        // CRITICAL CHECK: Partner should not be BUSY
        const profile = await PartnerProfile.findById(partnerId);
        if (profile?.workingStatus === 'BUSY') {
            return res.status(400).json({ success: false, message: "Mission Overlap! Terminate current operation first." });
        }

        job.partnerId = partnerId;
        job.status = 'ACCEPTED';
        job.otp = Math.floor(1000 + Math.random() * 9000).toString();
        job.finalPrice = job.basePrice;

        await job.save();
        const populatedJob = await Job.findById(job._id).populate('customerId').populate('partnerId');

        await PartnerProfile.findByIdAndUpdate(partnerId, { workingStatus: 'BUSY' });

        // Socket logic - Safely get IDs
        const cId = (populatedJob.customerId?._id || job.customerId).toString();
        const pId = partnerId.toString();

        const payload = { jobId: job._id, status: job.status, customerId: cId, partnerId: pId, job: populatedJob };
        global.io.to(`job_${job._id}`).emit('status_changed', payload);
        global.io.to(`customer_${cId}`).emit('status_changed', payload);

        res.json({ success: true, job: populatedJob });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.proposePrice = async (req, res) => {
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
};

exports.updateJobStatus = async (req, res) => {
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
            const profile = await PartnerProfile.findById(job.partnerId);
            if (profile) {
                profile.totalJobs += 1;
                // 5% Platform Cut Applied (95% to Partner)
                const totalAmount = (job.finalPrice || job.basePrice || 0);
                const partnerEarnings = totalAmount * 0.95;
                
                profile.earnings += partnerEarnings;
                profile.walletBalance += partnerEarnings;
                await profile.save();
                console.log(`💰 Platform Cut Applied: Mission ${job._id} (₹${totalAmount}) -> Partner: ₹${partnerEarnings.toFixed(2)}, Platform: ₹${(totalAmount * 0.05).toFixed(2)}`);
            }
        }

        if (status === 'PAID') {
            await PartnerProfile.findByIdAndUpdate(job.partnerId, { workingStatus: 'AVAILABLE' });
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

        res.json({ success: true, job: populatedJob });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
