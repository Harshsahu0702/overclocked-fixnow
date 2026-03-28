import React, { useState, useEffect } from 'react';
import {
    Map as MapIcon, Users, TrendingUp, AlertCircle, CheckSquare,
    Wrench, IndianRupee, Activity, ShieldCheck, XCircle,
    MapPin, Power, Ban, Eye, Zap, Search, Clock
} from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const socket = io('http://localhost:5000');

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const AdminDashboard = () => {
    const [partners, setPartners] = useState([]);
    const [allMissions, setAllMissions] = useState([]);
    const [livePartners, setLivePartners] = useState({});
    const [view, setView] = useState('stats'); // stats, requests, partners, map, jobs
    const [stats, setStats] = useState({ revenue: 0, totalMissions: 0, totalPartners: 0, activePartners: 0, totalCustomers: 0 });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        socket.emit('join', { role: 'admin', id: 'global_admin' });

        fetchStats();
        fetchPartners();
        fetchAllMissions();
        fetchOnlineWorkers();

        socket.on('partner_location_update', (data) => {
            setLivePartners(prev => ({
                ...prev,
                [data.partnerId]: data.coords
            }));
        });

        socket.on('job_created', () => {
            fetchStats();
            fetchAllMissions();
        });

        socket.on('admin_status_update', () => {
            fetchStats();
            fetchAllMissions();
        });

        return () => {
            socket.off('partner_location_update');
            socket.off('admin_status_update');
            socket.off('job_created');
        };
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/platform-stats');
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchPartners = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/partners');
            setPartners(res.data.partners);
        } catch (err) { console.error(err); }
    };

    const fetchAllMissions = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/all-missions');
            setAllMissions(res.data.jobs);
        } catch (err) { console.error(err); }
    };

    const fetchOnlineWorkers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/online-workers');
            const workersMap = {};
            res.data.workers.forEach(w => {
                workersMap[w._id] = w.location.coordinates;
            });
            setLivePartners(workersMap);
        } catch (err) { console.error(err); }
    };

    const handleVerify = async (profileId, status) => {
        try {
            await axios.post('http://localhost:5000/api/admin/verify-partner', { profileId, status });
            fetchPartners();
        } catch (err) { alert("Error verifying partner"); }
    };

    const handleForceOffline = async (userId) => {
        try {
            await axios.post('http://localhost:5000/api/admin/force-offline', { userId });
            fetchPartners();
            fetchOnlineWorkers();
        } catch (err) { alert("Error forcing offline"); }
    };

    const handleSelectPartner = async (partnerSummary) => {
        setSelectedRequest({ ...partnerSummary, isLoading: true });
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/partner/${partnerSummary._id}`);
            if (res.data.success) {
                setSelectedRequest(res.data.partner);
            }
        } catch (error) {
            console.error(error);
            setSelectedRequest(partnerSummary);
        }
    };

    const filteredMissions = allMissions.filter(j => filterStatus === 'ALL' ? true : j.status === filterStatus);

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex overflow-hidden font-sans text-black">
            {/* Sidebar */}
            <div className="w-80 bg-[#0A0A0A] text-white p-8 hidden lg:flex flex-col border-r-[12px] border-yellow-400">
                <div className="flex items-center gap-3 mb-16 px-2">
                    <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-black shadow-[6px_6px_0_0_#fff] animate-pulse">
                        <Zap size={32} strokeWidth={3} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-[1000] uppercase italic tracking-tighter leading-none">FixNow</h1>
                        <p className="text-[10px] font-black tracking-[0.4em] text-yellow-400 mt-1 opacity-80 uppercase">Control</p>
                    </div>
                </div>

                <nav className="space-y-4 flex-1">
                    <button onClick={() => setView('stats')} className={`w-full flex items-center gap-4 font-black uppercase italic tracking-tight p-5 rounded-3xl transition-all ${view === 'stats' ? 'bg-yellow-400 text-black shadow-[8px_8px_0_0_#fff]' : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-2 border-transparent'}`}>
                        <TrendingUp size={24} /> Dashboard
                    </button>
                    <button onClick={() => setView('requests')} className={`w-full flex items-center gap-4 font-black uppercase italic tracking-tight p-5 rounded-3xl transition-all ${view === 'requests' ? 'bg-yellow-400 text-black shadow-[8px_8px_0_0_#fff]' : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-2 border-transparent'}`}>
                        <ShieldCheck size={24} /> Onboarding
                    </button>
                    <button onClick={() => setView('partners')} className={`w-full flex items-center gap-4 font-black uppercase italic tracking-tight p-5 rounded-3xl transition-all ${view === 'partners' ? 'bg-yellow-400 text-black shadow-[8px_8px_0_0_#fff]' : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-2 border-transparent'}`}>
                        <Users size={24} /> Partners
                    </button>
                    <button onClick={() => setView('jobs')} className={`w-full flex items-center gap-4 font-black uppercase italic tracking-tight p-5 rounded-3xl transition-all ${view === 'jobs' ? 'bg-yellow-400 text-black shadow-[8px_8px_0_0_#fff]' : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-2 border-transparent'}`}>
                        <Activity size={24} /> All Missions
                    </button>
                    <button onClick={() => setView('map')} className={`w-full flex items-center gap-4 font-black uppercase italic tracking-tight p-5 rounded-3xl transition-all ${view === 'map' ? 'bg-yellow-400 text-black shadow-[8px_8px_0_0_#fff]' : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-2 border-transparent'}`}>
                        <MapIcon size={24} /> Live Map
                    </button>
                </nav>


            </div>

            {/* Main Content */}
            <div className="flex-1 p-12 overflow-y-auto">
                <header className="flex justify-between items-end mb-16">
                    <div>
                        <h2 className="text-7xl font-[1000] uppercase italic tracking-tighter leading-[0.8]">ADMIN <br /> COMMAND</h2>
                        <div className="flex gap-2 mt-6">
                            <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-widest">v2.0 Extreme</span>
                            <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-widest">Real-time Sync Active</span>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {view === 'stats' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_#FACC15] relative overflow-hidden group">
                                <Activity className="absolute -right-6 -bottom-6 text-slate-50 group-hover:text-yellow-100 transition-colors" size={120} strokeWidth={1} />
                                <p className="text-xs font-[1000] uppercase tracking-widest text-zinc-400 mb-4">Total Missions</p>
                                <h3 className="text-5xl font-black italic relative z-10 tracking-tight">{stats?.totalMissions || 0}</h3>
                            </div>
                            <div className="bg-black text-white p-10 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_#fff] relative overflow-hidden group">
                                <Users className="absolute -right-6 -bottom-6 text-white/5" size={120} strokeWidth={1} />
                                <p className="text-xs font-[1000] uppercase tracking-widest text-yellow-400 mb-4">Active Partners</p>
                                <h3 className="text-5xl font-black italic relative z-10 text-yellow-400 tracking-tight">{stats?.activePartners || 0} / {stats?.totalPartners || 0}</h3>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_#000] relative overflow-hidden group">
                                <ShieldCheck className="absolute -right-6 -bottom-6 text-slate-50" size={120} strokeWidth={1} />
                                <p className="text-xs font-[1000] uppercase tracking-widest text-zinc-400 mb-4">Total App Users</p>
                                <h3 className="text-5xl font-black italic relative z-10 tracking-tight">{stats?.totalCustomers || 0}</h3>
                            </div>
                        </motion.div>
                    )}

                    {view === 'requests' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            {[...partners].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).filter(p => p.status === 'PENDING').map(p => (
                                <div key={p._id} onClick={() => handleSelectPartner(p)} className="bg-white p-8 rounded-[3.5rem] border-4 border-black shadow-[12px_12px_0_0_#000] flex items-center justify-between cursor-pointer hover:-translate-y-2 hover:shadow-[16px_16px_0_0_#000] transition-all">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-4 border-black overflow-hidden rotate-[-2deg] hover:rotate-0 transition-transform shadow-[4px_4px_0_0_#000]">
                                            <img src={p.selfie || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="avatar" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-3xl font-[1000] uppercase italic tracking-tighter">{p.name}</h4>
                                                <span className="px-4 py-1 text-[10px] font-black uppercase bg-zinc-100 border-2 border-black rounded-full italic">NEW REQUEST</span>
                                            </div>
                                            <p className="text-zinc-600 font-bold uppercase italic text-xs tracking-widest">{p.skills?.join(' • ') || 'No skills listed'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="bg-yellow-400 text-black px-10 py-5 rounded-2xl border-4 border-black font-[1000] uppercase italic shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">VERIFY PROFILE</button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {view === 'partners' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            {[...partners].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).filter(p => p.status !== 'PENDING').map(p => (
                                <div key={p._id} onClick={() => handleSelectPartner(p)} className="bg-white p-8 rounded-[3.5rem] border-4 border-black shadow-[12px_12px_0_0_#000] flex items-center justify-between cursor-pointer hover:shadow-[16px_16px_0_0_#000] transition-all">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-4 border-black overflow-hidden shadow-[6px_6px_10px_rgba(0,0,0,0.1)]">
                                            <img src={p.selfie || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="avatar" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-3xl font-[1000] uppercase italic tracking-tighter">{p.name}</h4>
                                                <span className={`px-4 py-1 text-[10px] font-black uppercase italic rounded-full border-2 border-black ${p.isOnline ? 'bg-emerald-400' : 'bg-slate-200'}`}>
                                                    {p.isOnline ? 'LIVE ON DUTY' : 'OFFLINE'}
                                                </span>
                                            </div>
                                            <p className="text-zinc-400 font-black uppercase italic text-xs tracking-widest">{p.skills?.join(' • ') || 'No skills listed'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={(e) => { e.stopPropagation(); handleForceOffline(p._id); }} className="bg-red-100 text-red-600 px-8 py-5 rounded-2xl border-4 border-black font-black uppercase italic shadow-[4px_4px_0_0_#000] hover:bg-red-200"><Power size={24} /></button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {view === 'jobs' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                            {/* Mission Filters */}
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {['ALL', 'CREATED', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s)}
                                        className={`px-6 py-3 rounded-2xl border-4 border-black font-black uppercase italic text-xs whitespace-nowrap transition-all ${filterStatus === s ? 'bg-black text-yellow-400 shadow-none translate-y-1' : 'bg-white text-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {filteredMissions.map(job => (
                                    <div
                                        key={job._id}
                                        onClick={() => setSelectedJob(job)}
                                        className="bg-white p-10 rounded-[4rem] border-[6px] border-black shadow-[15px_15px_0_0_#000] cursor-pointer hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-[2rem] border-b-4 border-l-4 border-black font-black uppercase italic text-xs tracking-[0.2em] ${job.status === 'PAID' ? 'bg-emerald-400' : job.status === 'CANCELLED' ? 'bg-red-400 text-white' : 'bg-yellow-400'}`}>
                                            {job.status}
                                        </div>

                                        <div className="flex justify-between items-start mb-10 pt-4">
                                            <h4 className="text-4xl font-[1000] uppercase italic tracking-tighter leading-none max-w-[70%]">{job.service}</h4>
                                            <p className="text-4xl font-[1000] italic text-black">₹{job.finalPrice || job.basePrice}</p>
                                        </div>

                                        <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-black">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-widest">Customer</p>
                                                <p className="font-black uppercase italic">{job.customerId?.name || 'Unknown'}</p>
                                            </div>
                                            <div className="text-black/20 font-black">→</div>
                                            <div className="flex-1 text-right">
                                                <p className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-widest">Partner</p>
                                                <p className="font-black uppercase italic">{job.partnerId?.name || 'SEARCHING...'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-widest opacity-60">
                                            <div className="flex items-center gap-2"><Clock size={14} /> {new Date(job.createdAt).toLocaleString()}</div>
                                            <div className="flex items-center gap-2"><MapPin size={14} /> View Tracking</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {view === 'map' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[750px] w-full rounded-[5rem] border-[12px] border-black shadow-[30px_30px_0_0_#FACC15] overflow-hidden">
                            <MapContainer center={[23.72, 86.95]} zoom={5} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {Object.entries(livePartners).map(([id, coords]) => (
                                    <Marker key={id} position={[coords[1], coords[0]]}>
                                        <Popup>
                                            <div className="font-black uppercase italic p-2">
                                                <p className="text-yellow-500 mb-1">LIVE BHAIYA</p>
                                                <p>ID: {id.slice(-6)}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mission Detail Modal */}
            <AnimatePresence>
                {selectedJob && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedJob(null)} className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-8 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, rotate: -2 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[4rem] border-[10px] border-black shadow-[30px_30px_0_0_#FACC15] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="bg-yellow-400 p-12 border-b-8 border-black flex justify-between items-start">
                                <div>
                                    <span className="bg-black text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-[0.3em] mb-4 inline-block">MISSION RECORD #{selectedJob._id.slice(-6)}</span>
                                    <h2 className="text-6xl font-[1000] uppercase italic tracking-tighter leading-none">{selectedJob.service}</h2>
                                    <p className="mt-4 font-black uppercase italic tracking-widest text-black/60 flex items-center gap-2 underline"><MapPin size={16} /> {selectedJob.location.address}</p>
                                </div>
                                <button onClick={() => setSelectedJob(null)} className="bg-black text-white p-4 rounded-3xl border-4 border-black shadow-[6px_6px_0_0_#fff] hover:scale-110 transition-transform"><XCircle size={40} /></button>
                            </div>

                            <div className="p-12 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-12">
                                    <div className="bg-white p-8 rounded-[3rem] border-4 border-black shadow-[10px_10px_0_0_#000]">
                                        <h4 className="text-xl font-black uppercase italic mb-6 border-b-4 border-black/5 pb-2">Mission Logistics</h4>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-black">
                                                <span className="text-xs font-black uppercase opacity-40">Status</span>
                                                <span className="text-xl font-black uppercase italic text-emerald-500 animate-pulse">{selectedJob.status}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-black">
                                                <span className="text-xs font-black uppercase opacity-40">Booking Value</span>
                                                <span className="text-2xl font-[1000] italic">₹{selectedJob.finalPrice || selectedJob.basePrice}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-black">
                                                <span className="text-xs font-black uppercase opacity-40">Payment Status</span>
                                                <span className="text-lg font-black uppercase italic">{selectedJob.status === 'PAID' ? '✅ SUCCESS' : '🕒 PENDING'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 px-1 border-t-2 border-dashed border-black/10">
                                                <p className="text-[10px] font-black uppercase opacity-40">Platform Cut (5%)</p>
                                                <p className="text-lg font-black text-red-500 italic">-₹{((selectedJob.finalPrice || selectedJob.basePrice || 0) * 0.05).toFixed(2)}</p>
                                            </div>
                                            <div className="flex justify-between items-center py-2 px-1">
                                                <p className="text-[10px] font-black uppercase opacity-40">Partner Payout (95%)</p>
                                                <p className="text-2xl font-[1000] text-emerald-500 italic">₹{((selectedJob.finalPrice || selectedJob.basePrice || 0) * 0.95).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black text-white p-8 rounded-[3rem] border-4 border-black shadow-[10px_10px_0_0_#FACC15]">
                                        <h4 className="text-xl font-black uppercase italic mb-6 border-b-4 border-white/10 pb-2">Network Parties</h4>
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-full border-4 border-yellow-400 overflow-hidden bg-white">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedJob.customerId?.name}`} alt="" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-yellow-400">Customer</p>
                                                    <p className="text-2xl font-[1000] uppercase italic tracking-tighter">{selectedJob.customerId?.name}</p>
                                                    <p className="text-xs font-bold opacity-60 underline tracking-widest">{selectedJob.customerId?.phone}</p>
                                                </div>
                                            </div>
                                            <div className="h-10 border-l-4 border-dashed border-white/20 ml-8"></div>
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-full border-4 border-emerald-400 overflow-hidden bg-white">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedJob.partnerId?.name}`} alt="" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-emerald-400">Assigned Partner</p>
                                                    <p className="text-2xl font-[1000] uppercase italic tracking-tighter">{selectedJob.partnerId?.name || 'UNASSIGNED'}</p>
                                                    <p className="text-xs font-bold opacity-60 underline tracking-widest">{selectedJob.partnerId?.phone || '...'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0_0_#000] overflow-hidden flex flex-col">
                                    <h4 className="text-3xl font-[1000] uppercase italic mb-8 border-b-8 border-yellow-400 inline-block">Operation Timeline</h4>
                                    <div className="space-y-8 overflow-y-auto pr-4 custom-scrollbar flex-1 pb-10">
                                        {(selectedJob.statusHistory || []).length > 0 ? (
                                            [...selectedJob.statusHistory].reverse().map((h, i) => (
                                                <div key={i} className="relative pl-12">
                                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-black bg-yellow-400 flex items-center justify-center font-black text-xs shadow-[4px_4px_0_0_#000]">{selectedJob.statusHistory.length - i}</div>
                                                    {i !== (selectedJob.statusHistory.length - 1) && <div className="absolute left-4 top-8 w-1 h-full bg-black/10"></div>}
                                                    <div>
                                                        <p className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1">{h.status}</p>
                                                        <p className="text-[10px] font-black opacity-40 uppercase italic tracking-widest">{new Date(h.timestamp).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-20 opacity-20 font-black uppercase italic">No Timeline Data Found</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Existing Request Detail Modal (unchanged logic, just styled more) */}
            <AnimatePresence>
                {selectedRequest && <JobRequestModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onVerify={handleVerify} />}
            </AnimatePresence>

            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 10px; }`}</style>
        </div>
    );
};

/* Extracted Request Modal for Partner Onboarding */
const JobRequestModal = ({ request, onClose, onVerify }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-8 overflow-y-auto">
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="bg-white p-12 rounded-[4rem] border-8 border-black shadow-[25px_25px_0_0_#FACC15] w-full max-w-6xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <button onClick={onClose} className="absolute top-8 right-8 text-black hover:text-red-500 transition-colors"><XCircle size={48} strokeWidth={2.5} /></button>
            <div className="flex flex-col md:flex-row gap-12 pt-4">
                <div className="w-full md:w-[35%] space-y-8">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Live Selfie Capture</p>
                        <div className="w-full aspect-[4/5] rounded-[3rem] border-8 border-black overflow-hidden shadow-[12px_12px_0_0_#000]">
                            <img src={request.selfie || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.name}`} alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-[65%] space-y-10">
                    <div>
                        <h2 className="text-7xl font-[1000] uppercase italic tracking-tighter leading-none mb-4 text-black">{request.name}</h2>
                        <div className="flex gap-3">
                            <span className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase italic tracking-widest leading-none flex items-center">{request.status}</span>
                            <span className="bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase italic tracking-widest leading-none flex items-center">Exp: {request.experience} Years</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[3rem] border-4 border-black shadow-[10px_10px_0_0_#000]">
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40 mb-2">Primary Contact</p>
                            <p className="text-2xl font-[1000] italic tracking-tight">{request.phone}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40 mb-2">Registered Email</p>
                            <p className="text-lg font-black italic tracking-tight truncate">{request.email || 'N/A'}</p>
                        </div>
                        <div className="col-span-full">
                            <p className="text-[10px] font-black uppercase opacity-40 mb-2">Skill Arsenal</p>
                            <div className="flex flex-wrap gap-2">
                                {request.skills?.map(s => <span key={s} className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase italic">{s}</span>)}
                            </div>
                        </div>
                    </div>
                    {request.status === 'PENDING' && (
                        <div className="flex gap-6">
                            <button onClick={() => { onVerify(request._id, 'APPROVED'); onClose(); }} className="flex-1 bg-emerald-400 py-6 rounded-3xl border-4 border-black font-black uppercase italic text-3xl shadow-[8px_8px_0_0_#000] hover:translate-y-1 hover:shadow-none transition-all">APPROVE BHAIYA</button>
                            <button onClick={() => { onVerify(request._id, 'REJECTED'); onClose(); }} className="bg-red-500 text-white px-10 rounded-3xl border-4 border-black font-black uppercase shadow-[8px_8px_0_0_#000]"><Ban size={30} /></button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    </motion.div>
);

export default AdminDashboard;
