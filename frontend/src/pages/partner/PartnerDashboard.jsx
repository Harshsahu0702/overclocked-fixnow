import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    MapPin, Power, Navigation, Clock, Wallet, Shield, Wrench,
    CheckCircle2, AlertCircle, Phone, MessageSquare, IndianRupee,
    Plus, Minus, TrendingUp, Star, Zap, LogOut,
    User as UserIcon, Briefcase, FileText, ChevronRight, Check, Eye, EyeOff,
    ArrowRight, Bell, Settings, Award, Map as MapIcon, Share2,
    Calendar, History, Navigation2, X, Info, Loader2, Play, CircleDot
} from 'lucide-react';
import { socket } from '../../socket';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Custom Marker for User
const UserPulseIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// Custom Marker for Bhaiya
const BhaiyaIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-6 h-6 bg-yellow-400 rounded-full border-2 border-black shadow-xl flex items-center justify-center font-black text-[8px] italic">B</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});


// Component to handle map view reset
const MapHelper = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
};

// ---------------------------------------------------------
// REFACTORED SUB-COMPONENTS (DEFINED OUTSIDE TO PREVENT RE-RENDERS)
// ---------------------------------------------------------

const AuthScreen = ({ handleLogin, loginData, setLoginData, showPass, setShowPass, authLoading, error }) => (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-8 font-sans overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm relative z-10 bg-white/80 backdrop-blur-3xl border border-white p-10 rounded-[3rem] shadow-2xl">
            <div className="text-center mb-10">
                <div className="relative inline-block group">
                    <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:rotate-[360deg] transition-transform duration-1000">
                        <Zap size={40} className="text-yellow-400 fill-yellow-400" />
                    </div>
                </div>
                <h1 className="text-4xl font-[1000] text-slate-900 tracking-tighter uppercase italic leading-none mb-3">FixNow <span className="text-yellow-500">PRO</span></h1>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200 backdrop-blur-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Authorized Personnel Only</span>
                </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-1.5 group">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 italic group-focus-within:text-black transition-colors">Identification Frequency</label>
                    <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={18} />
                        <input type="text" required placeholder="Phone Matrix" value={loginData.phone} onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })} className="w-full pl-14 pr-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold text-md outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-200" />
                    </div>
                </div>

                <div className="space-y-1.5 group">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 italic group-focus-within:text-black transition-colors">Neural Credential</label>
                    <div className="relative">
                        <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={18} />
                        <input
                            type={showPass ? "text" : "password"}
                            required
                            placeholder="Data String"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="w-full pl-14 pr-14 py-4.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold text-md outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-200 tracking-[0.2em]"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-black transition-colors">
                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500">
                        <AlertCircle size={18} />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none italic">{error}</p>
                    </motion.div>
                )}

                <button
                    disabled={authLoading}
                    type="submit"
                    className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg uppercase italic tracking-tighter hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                >
                    {authLoading ? <Loader2 className="animate-spin" size={20} /> : <>ESTABLISH UPLINK <ArrowRight size={20} /></>}
                </button>
            </form>

            <p className="text-center mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] italic">FixNow Operational Command v4.0.2</p>
        </motion.div>
    </div>
);


const DashboardHome = ({ stats, currentPos, isOnline, workingStatus, toggleOnline, newRequests, setNewRequests, handleAcceptMission }) => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 lg:p-6 bg-[#fafaf0] pb-40">
        {/* Left Column: Tactical Radar & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="h-[300px] lg:h-[460px] relative rounded-[3rem] bg-white border border-slate-100 shadow-xl overflow-hidden group">
                {/* HUD Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

                <MapContainer center={[23.68, 86.95]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className="grayscale">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {currentPos && (
                        <>
                            <Marker position={[currentPos.lat, currentPos.lng]} icon={BhaiyaIcon} />
                            <Circle center={[currentPos.lat, currentPos.lng]} radius={1000} pathOptions={{ color: '#000', fillColor: '#000', fillOpacity: 0.02, weight: 1, dashArray: '5, 10' }} />
                        </>
                    )}
                </MapContainer>

                {/* Tactical Overlays */}
                <div className="absolute top-6 left-6 z-10 space-y-4">
                    <div className="backdrop-blur-xl bg-white/80 px-6 py-3 rounded-2xl border border-white shadow-xl flex items-center gap-4 transition-all hover:bg-white">
                        <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]'}`} />
                            {isOnline && <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">Status</span>
                            <span className="text-sm font-black uppercase tracking-widest text-black italic">{workingStatus}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
                    <button className="w-12 h-12 backdrop-blur-xl bg-white/80 hover:bg-white text-slate-900 rounded-2xl border border-slate-100 shadow-xl flex items-center justify-center transition-all active:scale-90">
                        <Navigation size={20} />
                    </button>
                    <button className="w-12 h-12 backdrop-blur-xl bg-white/80 hover:bg-white text-slate-900 rounded-2xl border border-slate-100 shadow-xl flex items-center justify-center transition-all active:scale-90">
                        <MapIcon size={20} />
                    </button>
                </div>

                {!isOnline && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-12 text-center">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="backdrop-blur-3xl bg-white/95 p-12 rounded-[4rem] border border-white shadow-2xl max-w-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-slate-50 opacity-50" />
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-50">
                                    <Power size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none mb-4">Radar Offline</h3>
                                <button onClick={() => toggleOnline(true)} className="w-full py-5 bg-black text-white rounded-3xl font-[1000] text-lg uppercase italic shadow-2xl hover:scale-105 transition-all">Engage Frequency</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Online Toggle (Positioned below Map as requested) */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'} border border-slate-100`}>
                        <Zap size={28} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">System Frequency</h4>
                        <p className="text-xl font-black italic tracking-tighter text-slate-900">{isOnline ? 'SCANNING...' : 'STANDBY'}</p>
                    </div>
                </div>
                <button
                    onClick={() => toggleOnline(!isOnline)}
                    className={`relative w-48 h-14 rounded-full p-2 flex items-center transition-all duration-700 ${isOnline ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-slate-100'}`}
                >
                    <motion.div animate={{ x: isOnline ? 128 : 0 }} className="w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center relative z-10">
                        <Power size={20} className={isOnline ? 'text-emerald-500' : 'text-slate-400'} />
                    </motion.div>
                    <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] ${isOnline ? 'text-white pl-4' : 'text-slate-400 pl-8'}`}>
                        {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
                    </span>
                </button>
            </div>
        </div>

        {/* Right Column: Mission Signal Stack */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-full max-h-[85vh]">
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <h3 className="text-[11px] font-[1000] text-slate-600 uppercase tracking-[0.5em] italic">Mission Stack</h3>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic mt-1">Operational Signals</p>
                </div>
                <span className="bg-black text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg">{newRequests.length} SIGNALS</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-4 pb-10">
                <AnimatePresence mode="popLayout">
                    {newRequests.length > 0 ? (
                        newRequests.map((req) => (
                            <motion.div
                                key={req._id}
                                layout
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -100, opacity: 0 }}
                                className="bg-white p-7 rounded-[2.5rem] border-2 border-slate-100 shadow-xl relative overflow-hidden group hover:border-blue-500/20 transition-all"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700"><Zap size={100} /></div>

                                <div className="flex items-center gap-5 mb-5 border-b border-yellow-100 pb-5">
                                    <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg border-b-4 border-yellow-600">
                                        <Zap size={24} className="text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <span className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.4em] block mb-1 italic">MISSION DETECTED</span>
                                        <h2 className="text-2xl font-[1000] uppercase italic tracking-tighter text-black truncate leading-none">
                                            {req.service || 'URGENT WORK'}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1 italic">Client</span>
                                        <span className="text-md font-black italic tracking-tighter text-black uppercase truncate">{req.customerId?.name || 'Customer'}</span>
                                    </div>
                                    <div className="flex items-start gap-4 p-3 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                                        <MapPin size={14} className="text-yellow-600 mt-1" />
                                        <p className="text-[10px] font-black text-slate-700 uppercase italic leading-tight line-clamp-2">{req.location?.address || 'Location Hidden'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAcceptMission(req._id)}
                                        disabled={workingStatus === 'BUSY'}
                                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${workingStatus === 'BUSY' ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-black text-white hover:scale-105 active:scale-95'}`}
                                    >
                                        {workingStatus === 'BUSY' ? 'MISSION ACTIVE' : <>ENGAGE <ArrowRight size={16} /></>}
                                    </button>
                                    <button
                                        onClick={() => setNewRequests(prev => prev.filter(r => r._id !== req._id))}
                                        className="px-6 py-4 text-slate-300 hover:text-red-500 font-black uppercase tracking-widest text-[8px] transition-all hover:bg-red-50 rounded-2xl italic"
                                    >
                                        Ignore
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] opacity-50">
                            <Loader2 className="animate-spin text-slate-300 mb-4" size={32} />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.6em] italic text-center">Scanning Tactical Radar...</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
);



const MissionControl = ({ activeJob, currentPos, jobTimer, otpInput, setOtpInput, updateJobStatus }) => {
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const currentStep = activeJob?.status || 'OFFLINE';
    const steps = ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];
    const activeIdx = steps.indexOf(currentStep);

    if (!activeJob || (activeIdx === -1 && currentStep !== 'PAID')) return null;

    return (
        <div className="fixed inset-0 lg:pl-[320px] z-[510] flex flex-col items-center justify-center gap-10 p-6 lg:p-8 pointer-events-none">
            {/* Tactical HUD Header (Timer & Signals) */}
            <div className="flex gap-6 pointer-events-auto">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-emerald-500 px-12 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border-b-8 border-emerald-600">
                    <Clock size={24} className="text-white animate-pulse" />
                    <span className="text-lg font-black italic tracking-widest text-white">{activeJob.status === 'IN_PROGRESS' ? formatTime(jobTimer) : 'OPERATIONAL TIME ACTIVE'}</span>
                </motion.div>
                <div className="bg-slate-900 px-12 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border-b-8 border-slate-950">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black text-white uppercase tracking-[0.6em] italic">Secure Uplink</span>
                </div>
            </div>

            {/* Main Action Rectangle (HUD Compacted) */}
            <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                className="w-full max-w-[1100px] bg-white rounded-[3.5rem] border-[3px] border-slate-100 shadow-[0_60px_120px_rgba(0,0,0,0.2)] flex flex-col lg:flex-row items-stretch pointer-events-auto relative overflow-hidden"
            >
                {/* Left: Client Dossier */}
                <div className="flex flex-col justify-center items-center gap-6 p-8 lg:p-10 lg:border-r-2 border-slate-50 min-w-[280px]">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-[2rem] bg-white p-2 border-2 border-slate-100 overflow-hidden shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeJob?.customerId?._id || 'guest'}`} alt="client" className="w-full h-full object-cover rounded-[1.5rem]" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-xl border-4 border-white flex items-center justify-center text-white shadow-2xl">
                            <UserIcon size={16} />
                        </div>
                    </div>
                    <div className="text-center w-full">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic mb-2 block">Dossier Locked</span>
                        <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-6 truncate">{activeJob?.customerId?.name || 'Customer'}</h4>
                        <div className="flex gap-3">
                            <a href={`tel:${activeJob.customerId?.phone}`} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl shadow-xl flex items-center justify-center hover:bg-emerald-600 transition-all hover:scale-110"><Phone size={18} fill="white" /></a>
                            <button className="flex-1 py-3 bg-blue-500 text-white rounded-xl shadow-xl flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-110"><MessageSquare size={18} fill="white" /></button>
                            <button onClick={() => alert('Location shared')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl shadow-xl flex items-center justify-center hover:bg-black transition-all hover:scale-110"><Navigation size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* Center: Phase Synchronization */}
                <div className="flex-1 px-6 lg:px-10 py-8 lg:py-10 flex flex-col justify-center gap-10 w-full relative border-r-2 border-slate-50">
                    <div className="flex justify-between items-center relative h-12 mb-4">
                        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[3px] bg-slate-100 z-0 rounded-full" />
                        <div className="absolute left-8 top-1/2 -translate-y-1/2 h-[3px] bg-emerald-500 z-10 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.8)]" style={{ width: `calc(${(activeIdx / (steps.length - 1)) * 100}% - 4rem)` }} />
 
                        {steps.map((st, i) => (
                            <div key={st} className="relative z-20 flex flex-col items-center gap-3">
                                <div className={`w-12 h-12 rounded-[1.2rem] border-2 flex items-center justify-center transition-all duration-700 shadow-xl ${activeIdx >= i ? 'bg-black border-black text-white scale-110 rotate-[360deg]' : 'bg-slate-50 border-white text-slate-200'}`}>
                                    {activeIdx > i ? <Check size={20} strokeWidth={4} /> : <span className="text-sm font-black">{i + 1}</span>}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest italic whitespace-nowrap ${activeIdx === i ? 'text-black scale-105' : 'text-slate-300'}`}>{st.replace(/_/g, ' ')}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50/80 p-6 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6 shadow-inner mt-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-50"><MapPin size={24} className="text-emerald-500" /></div>
                        <div className="flex-1 overflow-hidden">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Tactical Target Coordinate</span>
                            <p className="text-sm font-black text-slate-800 uppercase italic truncate tracking-tight">{activeJob.location?.address || 'Locating target...'}</p>
                        </div>
                    </div>
                </div>

                {/* Right: Solid Action Center (DARK THEME) scaled */}
                <div className="p-8 lg:p-10 bg-slate-900 min-w-[420px] flex flex-col justify-center gap-8">
                    <div className="text-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-2 block">Mission Authority</span>
                    </div>
 
                    {currentStep === 'ACCEPTED' && (
                        <button onClick={() => updateJobStatus('ON_THE_WAY')} className="w-full py-8 bg-emerald-500 text-white rounded-[2rem] font-black text-xl uppercase italic tracking-tighter shadow-3xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all border-b-8 border-emerald-700">
                            ENGAGE MISSION
                        </button>
                    )}
 
                    {currentStep === 'ON_THE_WAY' && (
                        <div className="flex flex-col gap-6">
                            <div className="flex gap-4 h-20">
                                <input
                                    type="tel"
                                    placeholder="OTP"
                                    maxLength={4}
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-24 h-full bg-white/10 border-4 border-white/10 rounded-[1.5rem] text-center text-xl font-black focus:border-emerald-500 focus:bg-white/20 outline-none transition-all placeholder:text-white/20 text-white tracking-widest shadow-inner overflow-hidden"
                                />
                                <button
                                    onClick={() => updateJobStatus('IN_PROGRESS')}
                                    disabled={otpInput.length < 4}
                                    className="flex-1 bg-emerald-500 text-white rounded-[1.5rem] font-black text-lg uppercase italic tracking-tighter shadow-3xl disabled:opacity-30 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-3 whitespace-nowrap px-6 border-b-8 border-emerald-700"
                                >
                                    <Play fill="white" size={18} /> START WORK
                                </button>
                            </div>
                        </div>
                    )}
 
                    {currentStep === 'IN_PROGRESS' && (
                        <button onClick={() => updateJobStatus('COMPLETED')} className="w-full py-8 bg-white text-black rounded-[2rem] font-black text-2xl uppercase italic tracking-tighter shadow-3xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-8 border-slate-200">
                            FINISH <Zap size={24} className="text-emerald-500" />
                        </button>
                    )}

                    <div className="flex gap-4">
                        <button className="flex-1 py-5 bg-white/5 text-slate-500 text-xs font-black uppercase tracking-widest rounded-3xl hover:bg-white/10 transition-all border-2 border-white/5">Protocol</button>
                        <button
                            onClick={async () => {
                                if (!confirm('ABORT MISSION?')) return;
                                try {
                                    const res = await axios.patch(`http://localhost:5000/api/jobs/${activeJob._id}/status`, { status: 'CANCELLED' });
                                    if (res.data.success) {
                                        socket.emit('job_status_update', {
                                            jobId: activeJob._id,
                                            customerId: activeJob.customerId?._id || activeJob.customerId,
                                            partnerId: activeJob.partnerId?._id || activeJob.partnerId,
                                            status: 'CANCELLED',
                                            job: res.data.job
                                        });
                                        updateJobStatus('CANCELLED');
                                    }
                                } catch (err) { alert('Failed'); }
                            }}
                            className="px-12 py-5 bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest rounded-3xl hover:bg-red-600 hover:text-white transition-all border-2 border-red-500/20 shadow-lg"
                        >
                            Abort
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


const WalletView = ({ stats }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-6">
        <div className="bg-white border border-slate-100 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 -mr-12 -mt-12 group-hover:rotate-12 transition-transform text-slate-900"><TrendingUp size={240} /></div>
            <div className="relative z-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-3 italic">Settled Assets</p>
                <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-2xl font-black text-slate-200 italic">₹</span>
                    <h2 className="text-5xl font-[1000] italic tracking-tighter leading-none text-slate-900">{stats?.walletBalance || '0'}</h2>
                </div>
                <div className="flex gap-4">
                    <button className="flex-1 py-4 bg-black text-white rounded-2xl font-[1000] text-lg uppercase italic shadow-xl hover:scale-105 transition-all">Withdrawal Pipeline</button>
                    <button className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 hover:bg-slate-100 transition-all shadow-sm"><Settings size={22} /></button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg relative overflow-hidden group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Cycle Profit</p>
                <p className="text-4xl font-[1000] italic tracking-tighter text-slate-900">₹8,450.00</p>
                <div className="absolute bottom-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform text-slate-900"><Briefcase size={80} /></div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg relative overflow-hidden group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Operator XP</p>
                <p className="text-4xl font-[1000] italic tracking-tighter text-blue-600">1,240 XP</p>
                <div className="absolute bottom-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform text-slate-900"><Award size={80} /></div>
            </div>
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-lg p-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 italic">Settlement Nodes</h4>
            <div className="space-y-4">
                {[
                    { label: 'Primary Vault', detail: 'HDFC • ****4512', icon: <Briefcase size={20} /> },
                    { label: 'UPI Frequency', detail: 'Active • fixnow@okicici', icon: <Zap size={20} /> }
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-slate-300 group-hover:text-black group-hover:border-black/10 transition-all shadow-sm">{item.icon}</div>
                            <div>
                                <p className="text-xs font-black uppercase italic text-slate-800 mb-1">{item.label}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.detail}</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-200 group-hover:text-black transition-all" />
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
);

const HistoryView = ({ user }) => {
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/partners/ledger/${user._id}`);
                if (res.data.success) setLedger(res.data.jobs);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchLedger();
    }, [user._id]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 flex flex-col h-full bg-[#f8f9fa]">
            <header className="flex items-end justify-between px-2">
                <div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mb-2 italic">Session History</h2>
                    <h1 className="text-4xl font-[1000] text-slate-900 tracking-tighter italic uppercase leading-none">Mission Logs</h1>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Total Entries</p>
                    <p className="text-xl font-black text-black italic">{ledger.length}</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
                        <Loader2 className="animate-spin text-black" size={48} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Decrypting Field Data...</p>
                    </div>
                ) : ledger.length > 0 ? (
                    ledger.map((job, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:border-black/5 transition-all shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:text-white transition-all"><Wrench size={28} /></div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none mb-2">{job.service}</h4>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Settled</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                    <span className="text-sm font-black text-slate-200 italic">₹</span>
                                    <p className="text-3xl font-[1000] italic tracking-tighter text-slate-900">{job.finalPrice || job.basePrice}</p>
                                </div>
                                <div className="inline-flex px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">LOG_ID: {job._id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-24 text-center opacity-10 flex flex-col items-center gap-4 text-slate-900">
                        <History size={80} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.6em]">No Archived Sessions</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const ProfileView = ({ user, stats, logout }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 space-y-8 max-w-4xl mx-auto bg-[#f8f9fa]">
        <div className="bg-white p-12 rounded-[4.5rem] text-center border border-slate-100 relative group overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-slate-50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-1000 opacity-50" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-left">
                <div className="relative">
                    <div className="w-48 h-48 bg-slate-100 rounded-[3rem] p-2 border border-slate-200 relative overflow-hidden flex items-center justify-center shadow-xl group-hover:border-black/20 transition-colors">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="agent_pfp" className="w-full h-full object-cover rounded-[2.5rem]" />
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-black/80 backdrop-blur-md flex items-center justify-center group-hover:h-full transition-all duration-500 cursor-pointer">
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 italic transition-opacity">Calibrate ID</p>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-2xl border-4 border-white">
                        <Award size={32} />
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase italic tracking-widest rounded-lg">Verified Bhaiya</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h2 className="text-6xl font-[1000] tracking-tighter italic uppercase text-slate-900 leading-none mb-4">{user?.name}</h2>
                        <div className="flex flex-wrap gap-4">
                            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                <Shield size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BUREAU VERIFIED</span>
                            </div>
                            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                <UserIcon size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">ELITE CLASS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { icon: <UserIcon size={22} />, label: 'Dossier Details', detail: 'Contact Intelligence' },
                { icon: <Award size={22} />, label: 'Specializations', detail: `${stats?.skills?.length || 0} Modules Integrated` },
                { icon: <FileText size={22} />, label: 'Neural Docs', detail: 'Encrypted Identification' },
                { icon: <Settings size={22} />, label: 'System Params', detail: 'HUD Configuration' },
                { icon: <LogOut size={22} />, label: 'Terminate Link', detail: 'Purge & Logout', danger: true, action: logout }
            ].map((item, i) => (
                <button
                    key={i}
                    onClick={item.action}
                    className={`p-8 rounded-[3rem] border flex items-center justify-between group transition-all duration-300 ${item.danger
                            ? 'bg-red-50 border-red-100 hover:bg-red-100 hover:border-red-200'
                            : 'bg-white border-slate-100 hover:border-black/10 hover:shadow-xl shadow-sm'
                        }`}
                >
                    <div className="flex items-center gap-6 text-left">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-sm ${item.danger
                                ? 'bg-red-500 text-white border-red-400'
                                : 'bg-black text-white border-black/10 group-hover:bg-blue-600'
                            }`}>
                            {React.cloneElement(item.icon, { strokeWidth: 2.5 })}
                        </div>
                        <div>
                            <span className={`text-md font-black uppercase tracking-tight block mb-1 ${item.danger ? 'text-red-500' : 'text-slate-900'}`}>{item.label}</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{item.detail}</span>
                        </div>
                    </div>
                    <ChevronRight size={24} className={`transition-all duration-300 ${item.danger ? 'text-red-500' : 'text-slate-200 group-hover:text-black group-hover:translate-x-2'}`} />
                </button>
            ))}
        </div>
    </motion.div>
);


const JobSummaryModal = ({ summaryJob, setSummaryJob }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 bg-slate-50 opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Success Icon */}
        <motion.div 
            initial={{ scale: 0, rotate: -180 }} 
            animate={{ scale: 1, rotate: 0 }} 
            transition={{ type: 'spring', damping: 15, stiffness: 200 }} 
            className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] relative z-10 border-4 border-white"
        >
            <Check size={50} strokeWidth={8} />
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10">
            <h2 className="text-5xl lg:text-6xl font-[1000] text-slate-900 uppercase italic tracking-tighter leading-tight mb-4">MISSION <br /> ACCOMPLISHED</h2>
            <p className="text-slate-400 font-[1000] text-[10px] uppercase tracking-[0.5em] mb-10 italic">Tactical Objective Secured</p>
        </motion.div>

        {/* Revenue Card */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="w-full max-w-sm lg:max-w-md bg-black text-white p-8 lg:p-12 rounded-[3.5rem] border-b-[12px] border-yellow-400 shadow-3xl relative mb-12"
        >
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-6 opacity-[0.07] rotate-12 pointer-events-none">
                <IndianRupee size={200} />
            </div>
            
            <div className="relative z-10 py-2">
                <p className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-6 italic">Personnel Earnings</p>
                <div className="flex items-center justify-center gap-3 mb-10">
                    <span className="text-4xl font-[1000] italic text-yellow-400/40">₹</span>
                    <h3 className="text-7xl lg:text-8xl font-[1000] italic text-yellow-500 tracking-tighter leading-tight pr-2">
                        {summaryJob?.finalPrice || summaryJob?.basePrice || '0'}
                    </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10 opacity-60">
                    <div className="text-left">
                        <p className="text-[8px] font-black uppercase tracking-widest mb-1">Agency Fee</p>
                        <p className="text-sm font-black italic">₹20.00</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest mb-1">Security</p>
                        <p className="text-sm font-black text-emerald-400 italic">ENCRYPTED</p>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Actions */}
        <motion.button 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.6 }}
            onClick={() => setSummaryJob(null)} 
            className="w-full max-w-xs lg:max-w-sm py-7 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-[1000] text-2xl uppercase italic tracking-tighter shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group"
        >
            BACK TO RADAR
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </motion.button>

        <p className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] italic opacity-50">Auth ID: {summaryJob?._id?.slice(-12).toUpperCase()}</p>
    </motion.div>
);

// ---------------------------------------------------------
// MAIN PARTNER DASHBOARD COMPONENT
// ---------------------------------------------------------

const PartnerDashboard = () => {
    // 1. STATE MANAGEMENT
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });

    const [loginData, setLoginData] = useState({ phone: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState('');

    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [initLoading, setInitLoading] = useState(true);
    const [currentPos, setCurrentPos] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [workingStatus, setWorkingStatus] = useState('OFFLINE');

    const [newRequests, setNewRequests] = useState([]);
    const [activeJob, setActiveJob] = useState(null);
    const [jobTimer, setJobTimer] = useState(0);
    const [otpInput, setOtpInput] = useState('');
    const [summaryJob, setSummaryJob] = useState(null);

    const gpsInterval = useRef(null);
    const mapInitialCentered = useRef(false);
    const activeJobRef = useRef(activeJob);

    useEffect(() => {
        activeJobRef.current = activeJob;
    }, [activeJob]);

    // 2. DATA LAYER (AXIOS)
    const fetchDashboard = useCallback(async () => {
        if (!user?._id) return;
        try {
            // STEP 1: Check Mission Health FIRST (Triggers self-healing if needed)
            const jobRes = await axios.get(`http://localhost:5000/api/jobs/active/${user._id}?role=partner`);
            
            // STEP 2: Fetch Stats (Gets the updated status after potential healing)
            const res = await axios.get(`http://localhost:5000/api/partners/stats/${user._id}`);
            
            if (res.data.success) {
                setStats(res.data);
                setIsOnline(res.data.isOnline);
                setWorkingStatus(res.data.workingStatus);
            }

            if (jobRes.data && jobRes.data.job) {
                const activeJ = jobRes.data.job;
                if (activeJ.status === 'OFFERED') {
                    setNewRequests(prev => {
                        if (prev.find(r => r._id === activeJ._id)) return prev;
                        return [activeJ, ...prev];
                    });
                } else {
                    setActiveJob(activeJ);
                }
            } else if (jobRes.data.success) {
                // FALLBACK: If no job but stats still says busy, we force available (UI safety)
                setActiveJob(null);
                if (res.data.workingStatus === 'BUSY') setWorkingStatus('AVAILABLE');
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setInitLoading(false);
        }
    }, [user?._id]);

    // 3. SOCKET & GPS LIFECYCLE
    useEffect(() => {
        if (!user || user.role !== 'partner') {
            setInitLoading(false);
            return;
        }

        // Periodic Health Check for Active Missions
        const jobPulse = setInterval(() => {
            if (activeJobRef.current || workingStatus === 'BUSY') {
                console.log("💓 Mission Health Pulse Check...");
                fetchDashboard();
            }
        }, 15000);

        socket.emit('join', { role: 'partner', id: user._id });

        const handleReconnect = () => {
            console.log("🔌 Socket reconnected - rejoining rooms");
            socket.emit("join", { role: "partner", id: user._id });
            if (activeJobRef.current?._id) {
                socket.emit("join", { role: "job", id: activeJobRef.current._id });
            }
        };
        socket.on("connect", handleReconnect);

        socket.on('new_job_request', (job) => {
            setNewRequests(prev => {
                if (prev.find(r => r._id === job._id)) return prev;
                return [job, ...prev]; // Newest first
            });
        });

        socket.on('offer_accepted', ({ jobId, price }) => {
            fetchDashboard();
            setNewRequest(null);
        });

        socket.on("status_changed", (payload) => {
            console.log("Partner Status Update:", payload);

            if (!payload || !payload.job) return;
            
            // SECURITY/LOGIC CHECK: Ensure this update is for the job we are currently handling
            // Since a partner might have multiple offers or old room memberships, we MUST filter.
            const incomingJobId = (payload.jobId || payload.job?._id)?.toString();
            const currentJobId = activeJobRef.current?._id?.toString();

            // If we have an active job, and this update is NOT for it, ignore (unless it's the acceptance we just did)
            if (currentJobId && incomingJobId && currentJobId !== incomingJobId) {
                console.log("⏩ Ignoring status update for a different mission:", incomingJobId);
                return;
            }

            if (payload.status === "ACCEPTED") {
                setActiveJob(payload.job);
                socket.emit("join", { role: "job", id: payload.job._id });
            }
            else if (payload.status === "PAID") {
                setSummaryJob(payload.job);
                setActiveJob(null);
                fetchDashboard();
            }
            else if (payload.status === "CANCELLED") {
                setActiveJob(null);
                fetchDashboard();
            }
            else {
                setActiveJob(payload.job);
            }
        });


        socket.on('job_taken', ({ jobId }) => {
            console.log("🚫 Job taken by another Bhaiya:", jobId);
            setNewRequests(prev => prev.filter(r => r._id !== jobId));
        });

        fetchDashboard();

        return () => {
            socket.off("connect", handleReconnect);
            socket.off('new_job_request');
            socket.off('offer_accepted');
            socket.off('status_changed');
            socket.off('job_taken');
            if (gpsInterval.current) clearInterval(gpsInterval.current);
        };
    }, [user, fetchDashboard]);

    // Ensure partner joins the job room to receive job-specific events
    useEffect(() => {
        if (activeJob?._id) {
            socket.emit("join", { role: "job", id: activeJob._id });
        }
    }, [activeJob?._id]);

    useEffect(() => {
        if (isOnline && workingStatus !== 'OFFLINE') {
            const track = () => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const coords = [pos.coords.longitude, pos.coords.latitude];
                        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });

                        if (!mapInitialCentered.current) {
                            mapInitialCentered.current = true;
                        }

                        socket.emit('update_location', {
                            userId: user._id,
                            role: 'partner',
                            coords,
                            jobId: activeJob?._id,
                            customerId: activeJob?.customerId?._id
                        });
                    },
                    (err) => console.warn("GPS Permission Denied"),
                    { enableHighAccuracy: true }
                );
            };

            track();
            gpsInterval.current = setInterval(track, 5000);
        } else {
            if (gpsInterval.current) clearInterval(gpsInterval.current);
            setCurrentPos(null);
            mapInitialCentered.current = false;
        }

        return () => {
            if (gpsInterval.current) clearInterval(gpsInterval.current);
        };
    }, [isOnline, workingStatus, activeJob, user?._id]);

    useEffect(() => {
        let timer;
        if (activeJob?.status === 'IN_PROGRESS') {
            timer = setInterval(() => setJobTimer(prev => prev + 1), 1000);
        } else {
            setJobTimer(0);
        }
        return () => clearInterval(timer);
    }, [activeJob?.status]);

    // 4. ACTION HANDLERS
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setError('');
        try {
            // Using a dedicated partner login route for PRO dashboard
            const res = await axios.post('http://localhost:5000/api/partners/login', loginData);
            if (res.data.success) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setUser(res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Authentication Failed");
        } finally {
            setAuthLoading(false);
        }
    };

    const toggleOnline = async (newState) => {
        const prevOnline = isOnline;
        const prevStatus = workingStatus;

        // Optimistic Update
        setIsOnline(newState);
        setWorkingStatus(newState ? 'AVAILABLE' : 'OFFLINE');

        try {
            const res = await axios.post('http://localhost:5000/api/partners/toggle-status', {
                userId: user._id,
                isOnline: newState
            });
            if (res.data.success) {
                setIsOnline(res.data.isOnline);
                setWorkingStatus(res.data.workingStatus);
                fetchDashboard();
            } else {
                setIsOnline(prevOnline);
                setWorkingStatus(prevStatus);
            }
        } catch (err) {
            setIsOnline(prevOnline);
            setWorkingStatus(prevStatus);
            console.error(err);
        }
    };

    const handleAcceptMission = async (jobId) => {
        try {
            const jobToAccept = newRequests.find(r => r._id === jobId);
            if (!jobToAccept) return;

            // Optimistic Update
            setNewRequests(prev => prev.filter(r => r._id !== jobId));
            setActiveJob({ ...jobToAccept, status: 'ACCEPTED' });

            const res = await axios.post(`http://localhost:5000/api/jobs/${jobId}/accept`, {
                partnerId: user._id
            });
            if (res.data.success && res.data.job) {
                setActiveJob(res.data.job);
                fetchDashboard();
            } else {
                setActiveJob(null);
                fetchDashboard();
                alert(res.data.message || "Failed to accept mission");
            }
        } catch (err) {
            console.error("Accept Error:", err);
            setActiveJob(null);
            fetchDashboard();
            alert(err.response?.data?.message || "Failed to accept mission");
        }
    };

    const updateJobStatus = async (status) => {
        const prevJob = activeJob;
        // Optimistic Update
        setActiveJob(prev => ({ ...prev, status }));

        try {
            const res = await axios.patch(`http://localhost:5000/api/jobs/${activeJob._id}/status`, {
                status,
                otp: status === 'IN_PROGRESS' ? otpInput : undefined
            });
            if (res.data.success) {
                setActiveJob(res.data.job);
                if (status === 'PAID') {
                    setSummaryJob(res.data.job);
                    setActiveJob(null);
                    fetchDashboard();
                }
            } else {
                setActiveJob(prevJob);
            }
        } catch (err) {
            setActiveJob(prevJob);
            alert(err.response?.data?.message || "Status update failed");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    // 6. MAIN RENDER
    if (!user || user.role !== 'partner') {
        return <AuthScreen handleLogin={handleLogin} loginData={loginData} setLoginData={setLoginData} showPass={showPass} setShowPass={setShowPass} authLoading={authLoading} error={error} />;
    }

    if (stats && stats.status !== 'APPROVED') {
        return (
            <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center p-12 text-center font-sans overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50" />
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-48 h-48 bg-white/5 rounded-[4rem] border border-white/10 flex items-center justify-center mb-12 relative overflow-hidden backdrop-blur-3xl shadow-3xl">
                    <Clock size={80} className="text-yellow-400 animate-[spin_10s_linear_infinite]" />
                </motion.div>
                <h2 className="text-5xl font-[1000] text-white uppercase italic tracking-tighter leading-none mb-6">Credential Analysis <br /> In Progress</h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed max-w-xs mx-auto italic">Intelligence team is verifying your operational identity. ETA: <span className="text-yellow-400">2-4 Hours</span></p>
                <button onClick={handleLogout} className="mt-16 text-red-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-4 bg-white/5 px-12 py-5 rounded-2xl border border-white/10 active:scale-95 transition-all shadow-2xl backdrop-blur-xl">Terminate Session</button>
            </div>
        );
    }

    if (initLoading) return (
        <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center font-sans overflow-hidden">
            <div className="relative">
                <div className="w-20 h-20 bg-black rounded-3xl shadow-xl flex items-center justify-center mb-8 animate-bounce">
                    <Zap size={40} className="fill-yellow-400 text-yellow-400" />
                </div>
            </div>
            <p className="text-[10px] font-[1000] text-slate-900 uppercase tracking-[0.6em] italic animate-pulse">Initializing PRO HUD v4.0</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafaf5] text-slate-900 font-sans selection:bg-yellow-100 overflow-hidden flex">
            {/* Sidebar Navigation */}
            <aside className="w-24 lg:w-80 border-r border-[#ecece0] flex flex-col bg-[#fffef5]/90 backdrop-blur-3xl z-[200] relative shadow-2xl">
                <div className="p-8 pb-12 flex items-center gap-4 group cursor-pointer overflow-hidden border-b border-[#f5f5e6]">
                    <div className="w-14 h-14 bg-black rounded-2xl flex-shrink-0 flex items-center justify-center text-yellow-500 text-3xl font-[1000] italic group-hover:rotate-12 transition-transform shadow-2xl">F</div>
                    <div className="hidden lg:flex flex-col">
                        <h1 className="text-3xl font-[1000] uppercase italic tracking-tighter leading-none text-black">FixNow <span className="text-yellow-500">PRO</span></h1>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Operational Base</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-4">
                    {[
                        { id: 'home', icon: <MapIcon />, label: 'Tactical Radar' },
                        { id: 'wallet', icon: <Wallet />, label: 'Financial Intel' },
                        { id: 'history', icon: <History />, label: 'Mission Ledger' },
                        { id: 'profile', icon: <UserIcon />, label: 'Operator Hub' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-6 p-5 rounded-2xl transition-all duration-300 relative group ${activeTab === tab.id ? 'bg-black text-white shadow-[0_20px_40px_rgba(0,0,0,0.15)]' : 'text-slate-600 hover:bg-yellow-100/50 hover:text-black'}`}
                        >
                            <div className={`${activeTab === tab.id ? 'scale-110 text-yellow-400' : 'group-hover:translate-x-1 text-slate-400 group-hover:text-black'} transition-all`}>{React.cloneElement(tab.icon, { size: 26, strokeWidth: activeTab === tab.id ? 3 : 2 })}</div>
                            <span className="hidden lg:block text-sm font-black uppercase tracking-widest italic">{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div layoutId="nav_glow" className="absolute left-0 w-1.5 h-12 bg-yellow-400 rounded-r-full shadow-[0_0_20px_#facc15]" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-8 mt-auto space-y-6">
                    {activeJob && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="hidden lg:flex flex-col gap-5 p-6 bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] shadow-2xl mb-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700 text-blue-900"><Wrench size={80} /></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl animate-pulse">
                                    <Zap size={22} fill="white" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-tight truncate leading-none mb-1">{activeJob.service}</h4>
                                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-blue-400 italic">STEP: {activeJob.status.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                            <button onClick={() => { setActiveTab('home'); fetchDashboard(); }} className="w-full py-4 bg-black text-white rounded-2xl font-black text-[9px] uppercase italic tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10">
                                RESUME HUD
                            </button>
                        </motion.div>
                    )}

                    <button onClick={handleLogout} className="hidden lg:flex w-full items-center gap-5 p-5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl transition-all group">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                            <LogOut size={20} />
                        </div>
                        <div className="text-left flex flex-col">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Session</span>
                            <span className="text-xs font-black uppercase tracking-widest text-red-500 italic">LOGOUT</span>
                        </div>
                    </button>
                    <div className="text-center">
                        <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.6em] italic">OPERATIONAL OS V4.2</p>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 h-screen overflow-y-auto relative bg-[#fcfcfd]">
                {/* Header Section */}
                <header className={`sticky top-0 z-[100] px-12 py-6 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between transition-all duration-700 ${activeJob ? 'bg-black text-white shadow-2xl border-black' : 'bg-white/50'}`}>
                    <div>
                        {activeJob ? (
                            <>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    <h2 className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.5em] italic">ACTIVE OPERATION: {activeJob._id.slice(-6)}</h2>
                                </div>
                                <h1 className="text-4xl font-[1000] italic tracking-tighter uppercase leading-none">MISSION_IN_PROGRESS</h1>
                            </>
                        ) : (
                            <>
                                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2 italic px-1 opacity-70">Welcome back, Оператор</h2>
                                <h1 className="text-4xl font-[1000] italic tracking-tighter uppercase text-slate-900 leading-none">{user.name}</h1>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-8">
                        <div className={`flex items-center gap-5 px-8 py-4 rounded-2xl border transition-all ${activeJob ? 'bg-white/10 border-white/10' : 'bg-white border-slate-100 shadow-xl'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg uppercase italic shadow-2xl ${activeJob ? 'bg-emerald-500 text-white' : 'bg-black text-yellow-400'}`}>{user.name?.[0]}</div>
                            <div className="hidden xl:flex flex-col">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${activeJob ? 'text-white/40' : 'text-slate-500'}`}>Rank Status</span>
                                <span className={`text-sm font-black uppercase tracking-widest italic ${activeJob ? 'text-emerald-400' : 'text-blue-600'}`}>ELITE BHAIYA</span>
                            </div>
                        </div>
                        <button className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center transition-all group shadow-sm ${activeJob ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                            <Bell size={28} className={`group-hover:rotate-12 transition-transform ${activeJob ? 'text-white' : 'text-slate-400'}`} />
                            <div className="absolute top-5 right-5 w-3 h-3 bg-red-500 rounded-full border-4 border-white shadow-2xl" />
                        </button>
                    </div>
                </header>

                <div className="max-w-[1600px] mx-auto min-h-screen relative">
                    {/* Active Mission Map Backdrop */}
                    <AnimatePresence>
                        {activeJob && ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-y-0 right-0 left-80 z-0">
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 pointer-events-none" />
                                <MapContainer center={[activeJob.location?.coordinates?.[1] || 23.68, activeJob.location?.coordinates?.[0] || 86.95]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} className="grayscale">
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                    <Marker position={[activeJob.location?.coordinates?.[1] || 23.68, activeJob.location?.coordinates?.[0] || 86.95]} icon={UserPulseIcon} />
                                    {currentPos?.lat && currentPos?.lng && <Marker position={[currentPos.lat, currentPos.lng]} icon={BhaiyaIcon} />}
                                    {currentPos?.lat && activeJob.location?.coordinates?.[1] && (
                                        <Polyline
                                            positions={[
                                                [currentPos.lat, currentPos.lng],
                                                [activeJob.location.coordinates[1], activeJob.location.coordinates[0]]
                                            ]}
                                            color="#000" weight={4} dashArray="1, 15" lineCap="round"
                                        />
                                    )}
                                    <MapHelper center={[activeJob.location?.coordinates?.[1] || 23.68, activeJob.location?.coordinates?.[0] || 86.95]} zoom={16} />
                                </MapContainer>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {activeTab === 'home' && (!activeJob || activeJob.status === 'OFFERED') && workingStatus !== 'BUSY' && (
                            <DashboardHome
                                key="home"
                                stats={stats}
                                currentPos={currentPos}
                                isOnline={isOnline}
                                workingStatus={workingStatus}
                                toggleOnline={toggleOnline}
                                newRequests={newRequests}
                                setNewRequests={setNewRequests}
                                handleAcceptMission={handleAcceptMission}
                            />
                        )}

                        {activeTab === 'home' && workingStatus === 'BUSY' && !activeJob && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12">
                                <div className="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center mb-10 shadow-3xl animate-pulse">
                                    <Zap size={60} className="text-yellow-400" />
                                </div>
                                <h3 className="text-4xl font-[1000] uppercase italic tracking-tighter text-slate-900 mb-4">Recalibrating HUD...</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic max-w-xs mx-auto">Connecting to active mission frequency. Please hold position.</p>
                                <button onClick={fetchDashboard} className="mt-12 px-10 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl hover:scale-105 transition-all">Manual Resync</button>
                            </div>
                        )}

                        {activeTab === 'wallet' && <WalletView key="wallet" stats={stats} />}
                        {activeTab === 'history' && <HistoryView key="history" user={user} />}
                        {activeTab === 'profile' && <ProfileView key="profile" user={user} stats={stats} logout={handleLogout} />}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {activeJob && activeJob.status !== 'OFFERED' && <MissionControl key="mission" activeJob={activeJob} currentPos={currentPos} jobTimer={jobTimer} otpInput={otpInput} setOtpInput={setOtpInput} updateJobStatus={updateJobStatus} />}
                    {summaryJob && <JobSummaryModal key="summary" summaryJob={summaryJob} setSummaryJob={setSummaryJob} />}
                </AnimatePresence>
            </main>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .custom-div-icon { background: none; border: none; }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            `}</style>
        </div>
    );
};

export default PartnerDashboard;

