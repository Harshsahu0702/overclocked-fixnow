// FixNow Mission Control Server - Refreshed at 2:15AM
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const PartnerProfile = require('./models/PartnerProfile');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Make Socket.IO available globally
global.io = io;
app.set('io', io);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('FixNow API is Running 🚀');
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on('join', ({ role, id }) => {
        const userId = (id && typeof id === 'object') ? id._id : id;
        socket.join(`${role}_${userId}`);
        if (role === 'partner') socket.join('all_partners');
        if (role === 'admin') socket.join('admin_panel');
        console.log(`User ${userId} joined as ${role}`);
    });

    socket.on('update_location', async (data) => {
        const { userId, role, coords } = data; // coords: [lng, lat]
        if (role === 'partner') {
            // Updated: Partners now live ONLY in PartnerProfile collection
            await PartnerProfile.findByIdAndUpdate(userId, {
                location: { type: 'Point', coordinates: coords }
            });

            // Broadcast to admins and customers looking for this partner
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

    // START: Job Lifecycle Events
    socket.on('request_bhaiya', (data) => {
        const { job, partners } = data;
        console.log(`🚀 Dispatching Job ${job._id} to ${partners?.length} partners`);
        if (partners && Array.isArray(partners)) {
            partners.forEach(id => {
                const pId = (id && typeof id === 'object') ? id._id : id;
                console.log(`  -> Notifying Partner: ${pId}`);
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
        console.log(`   Customer ID: ${cId}, Partner ID: ${partnerId}`);
        console.log(`   Emitting to room: customer_${cId} and job_${jobId}`);

        const payload = job ? { ...job, status } : { jobId, status };

        // Emit to job room (CRITICAL for realtime updates)
        if (jobId) {
            console.log(`   ✉️ Broadcasting to job_${jobId}`);
            io.to(`job_${jobId}`).emit('status_changed', payload);
        }

        // Also emit to customer room
        if (cId) {
            console.log(`   ✉️ Sending to customer_${cId}`);
            io.to(`customer_${cId}`).emit('status_changed', payload);
        }

        // Handle single partner target
        if (partnerId) {
            const pId = (partnerId && typeof partnerId === 'object') ? partnerId._id : partnerId;
            io.to(`partner_${pId}`).emit('status_changed', payload);
        }

        // Handle multiple partner targets (for broadcast cancellation/offering)
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 FixNow Server running on port ${PORT}`);
});
