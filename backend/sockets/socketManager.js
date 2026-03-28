const PartnerProfile = require('../models/PartnerProfile');

const socketManager = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join appropriate rooms based on role and ID
        socket.on('join', ({ role, id }) => {
            const userId = (id && typeof id === 'object') ? id._id : id;
            if (userId) {
                socket.join(`${role}_${userId}`);
                if (role === 'partner') socket.join('all_partners');
                if (role === 'admin') socket.join('admin_panel');
                console.log(`User ${userId} joined as ${role}`);
            }
        });

        // Real-time location tracking
        socket.on('update_location', async (data) => {
            const { userId, role, coords } = data; // coords: [lng, lat]
            if (role === 'partner' && userId) {
                await PartnerProfile.findByIdAndUpdate(userId, {
                    location: { type: 'Point', coordinates: coords }
                });

                // Broadcast to admin panel and specific job room
                io.to('admin_panel').emit('partner_location_update', { partnerId: userId, coords });
                if (data.jobId) {
                    io.to(`job_${data.jobId}`).emit('bhaiya_location', {
                        lat: coords[1],
                        lng: coords[0],
                        partnerId: userId
                    });
                }
            }
        });

        // Job Lifecycle Events
        socket.on('request_bhaiya', (data) => {
            const { job, partners } = data;
            console.log(`🚀 Dispatching Job ${job._id} to ${partners?.length} partners`);
            if (partners && Array.isArray(partners)) {
                partners.forEach(id => {
                    const pId = (id && typeof id === 'object') ? id._id : id;
                    io.to(`partner_${pId}`).emit('new_job_request', job);
                });
            }
            io.to('admin_panel').emit('job_created', job);
        });

        socket.on('propose_price', (data) => {
            const { jobId, customerId, partnerId, price } = data;
            io.to(`customer_${customerId}`).emit('price_offer', { jobId, partnerId, price });
        });

        socket.on('accept_offer', (data) => {
            const { jobId, partnerId, customerId, price } = data;
            io.to(`partner_${partnerId}`).emit('offer_accepted', { jobId, price });
        });

        socket.on('job_status_update', (data) => {
            const { jobId, customerId, partnerId, partnerIds, status, job } = data;
            const cId = (customerId && typeof customerId === 'object') ? customerId._id : customerId;
            
            console.log(`📡 Status Update: Job ${jobId} -> ${status}`);
            const payload = job ? { ...job, status } : { jobId, status };

            if (jobId) io.to(`job_${jobId}`).emit('status_changed', payload);
            if (cId) io.to(`customer_${cId}`).emit('status_changed', payload);
            if (partnerId) {
                const pId = (partnerId && typeof partnerId === 'object') ? partnerId._id : partnerId;
                io.to(`partner_${pId}`).emit('status_changed', payload);
            }
            if (partnerIds && Array.isArray(partnerIds)) {
                partnerIds.forEach(id => {
                    const targetId = (id && typeof id === 'object') ? id._id : id;
                    io.to(`partner_${targetId}`).emit('status_changed', payload);
                });
            }
            io.to('admin_panel').emit('admin_status_update', payload);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Client disconnected');
        });
    });
};

module.exports = socketManager;
