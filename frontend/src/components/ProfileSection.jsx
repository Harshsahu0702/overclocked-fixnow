import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, Settings, LogOut, Check, Edit2, Phone, Mail, Clock, MapPin, Star } from 'lucide-react';
import axios from 'axios';

const ProfileSection = ({ user, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('history');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    useEffect(() => {
        fetchHistory();
    }, [user?._id]);

    const fetchHistory = async () => {
        if (!user?._id) return;
        try {
            const res = await axios.get(`http://10.74.227.253:5000/api/jobs/history/${user._id}?role=${user.role || 'customer'}`);
            if (res.data.success) {
                setHistory(res.data.jobs);
            }
        } catch (err) {
            console.error("Fetch history error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const res = await axios.patch(`http://10.74.227.253:5000/api/users/${user._id}`, {
                ...formData,
                role: user.role
            });
            if (res.data.success) {
                onUpdate(res.data.user);
                setIsEditing(false);
                alert("Profile Updated! 🚀");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Update failed!");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.reload();
    };

    const tabs = [
        { id: 'history', label: 'Job History', icon: Briefcase },
        { id: 'settings', label: 'Edit Profile', icon: Settings }
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 2 }}
                className="relative w-full max-w-[600px] bg-white border-[6px] border-black shadow-[20px_20px_0_0_#FACC15] rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-yellow-400 p-8 border-b-[6px] border-black relative overflow-hidden flex-shrink-0">
                    {/* Crazy Background Decoration */}
                    <div className="absolute -right-10 -top-10 opacity-10 rotate-12 pointer-events-none">
                        <User size={200} strokeWidth={1} />
                    </div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-black rounded-3xl blur-none transition-all group-hover:-inset-1"></div>
                                <div className="relative w-24 h-24 rounded-2xl border-4 border-black bg-white overflow-hidden shadow-[8px_8px_0_0_#000] rotate-[-2deg] group-hover:rotate-0 transition-transform">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="avatar" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-black text-yellow-400 px-2 py-1 border-2 border-black text-[8px] font-black uppercase italic rotate-12 shadow-[2px_2px_0_0_#FACC15]">
                                    Verified
                                </div>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-2 rotate-[-1deg]">
                                    <Star size={10} className="text-yellow-400" fill="currentColor" /> Premium User
                                </div>
                                <h2 className="text-4xl font-[1000] uppercase italic tracking-tighter leading-none text-black drop-shadow-[2px_2px_0_#FFF]">{user?.name}</h2>
                                <p className="font-black uppercase text-[10px] tracking-widest mt-2 opacity-60 italic flex items-center gap-1">
                                    <MapPin size={10} /> Member since 2024
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white border-4 border-black rounded-2xl hover:bg-black hover:text-yellow-400 transition-all shadow-[6px_6px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none">
                            <X size={28} strokeWidth={4} />
                        </button>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-4 px-4 flex items-center justify-center gap-3 font-black uppercase italic text-sm border-4 border-black rounded-2xl transition-all ${activeTab === tab.id ? 'bg-black text-yellow-500 shadow-none translate-x-2 translate-y-2' : 'bg-white text-black shadow-[8px_8px_0_0_#000] hover:-translate-y-1'}`}
                            >
                                <tab.icon size={20} strokeWidth={3} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50 flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'history' ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-12 h-12 border-4 border-black border-t-yellow-400 rounded-full animate-spin"></div>
                                        <p className="font-black uppercase italic text-xs">Loading Missions...</p>
                                    </div>
                                ) : history.length > 0 ? (
                                    history.map((job) => (
                                        <div key={job._id} className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase italic border-2 border-black rounded-lg ${job.status === 'PAID' ? 'bg-green-400' : 'bg-red-400 text-white'}`}>
                                                        {job.status}
                                                    </span>
                                                    <h3 className="text-xl font-black uppercase italic mt-3">{job.service}</h3>
                                                </div>
                                                <p className="text-2xl font-[1000] italic">₹{job.finalPrice || job.basePrice}</p>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-xs font-black uppercase italic opacity-60">
                                                    <Clock size={14} strokeWidth={3} />
                                                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-black uppercase italic opacity-60">
                                                    <MapPin size={14} strokeWidth={3} />
                                                    {job.location?.address || 'Location Unknown'}
                                                </div>
                                            </div>

                                            {job.partnerId && (
                                                <div className="pt-4 border-t-2 border-black/5 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border-2 border-black bg-yellow-400 flex items-center justify-center text-xl">👷</div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase opacity-40 leading-none">Partner</p>
                                                        <p className="text-sm font-black uppercase italic">{job.partnerId.name}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 border-4 border-black border-dashed rounded-[3rem] bg-white">
                                        <div className="text-6xl mb-4">🏜️</div>
                                        <h3 className="font-black uppercase italic text-xl">No Missions Yet</h3>
                                        <p className="font-black text-xs uppercase opacity-40 mt-2">Book a Bhaiya to start history!</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-[1000] uppercase italic tracking-[0.2em] ml-1">Full Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User size={18} className="text-black group-focus-within:text-yellow-500 transition-colors" strokeWidth={3} />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-white border-4 border-black rounded-2xl outline-none font-black uppercase italic text-sm shadow-[6px_6px_0_0_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-[1000] uppercase italic tracking-[0.2em] ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Phone size={18} className="text-black group-focus-within:text-yellow-500 transition-colors" strokeWidth={3} />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-white border-3 border-black rounded-2xl outline-none font-black uppercase italic text-sm shadow-[6px_6px_0_0_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-[1000] uppercase italic tracking-[0.2em] ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-black group-focus-within:text-yellow-500 transition-colors" strokeWidth={3} />
                                            </div>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-white border-3 border-black rounded-2xl outline-none font-black uppercase italic text-sm shadow-[6px_6px_0_0_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpdate}
                                    className="w-full py-5 bg-black text-yellow-500 rounded-3xl border-4 border-black font-black text-xl uppercase italic shadow-[8px_8px_0_0_#FACC15] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
                                >
                                    <Check size={24} strokeWidth={4} /> Save Changes
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full py-4 bg-white text-red-500 rounded-2xl border-2 border-black font-black text-[10px] uppercase italic hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut size={16} strokeWidth={3} /> Logout Forever
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #000;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default ProfileSection;
