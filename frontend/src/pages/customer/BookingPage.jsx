import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Wrench, Clock, ShieldCheck, Map as MapIcon, Star, ArrowRight, X, AlertTriangle, IndianRupee, Utensils, Zap, Filter, ArrowLeft } from 'lucide-react';
import { socket } from '../../socket';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ProfileSection from '../../components/ProfileSection';

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

// Custom Icons for Neo-Brutalism
const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#FACC15; border:3px solid black; padding:10px; border-radius:50%; box-shadow: 4px 4px 0 0 #000; font-size:20px;'>🏠</div>",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const workerIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:black; border:3px solid #FACC15; padding:10px; border-radius:50%; box-shadow: 4px 4px 0 0 #FACC15; font-size:20px;'>🛵</div>",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

// Component to handle map center updates
const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView([coords.lat, coords.lng], 15);
    }, [coords]);
    return null;
};

const BookingPage = () => {
    const navigate = useNavigate();
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
    const [aiResult, setAiResult] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [loading, setLoading] = useState(() => !!new URLSearchParams(window.location.search).get('q'));
    const [location, setLocation] = useState(null);
    const [activeJob, setActiveJob] = useState(null);
    const [bhaiyaLocation, setBhaiyaLocation] = useState(null);
    const [viewState, setViewState] = useState('idle'); // idle, results, tracking
    const [isAutoSearch, setIsAutoSearch] = useState(() => !!new URLSearchParams(window.location.search).get('q'));
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Use ref to track activeJob for reconnect handler (avoids stale closures)
    const activeJobRef = useRef(activeJob);

    const [_user, setUser] = useState(user);

    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    useEffect(() => {
        activeJobRef.current = activeJob;
    }, [activeJob]);

    // Initialize socket connection and join rooms
    useEffect(() => {
        if (!user) return;

        console.log("👤 Joining as customer:", user._id);
        socket.emit('join', { role: 'customer', id: user._id });

        // CRITICAL: Re-join rooms on socket reconnection
        // Socket.IO drops ALL rooms when reconnecting (network, tab sleep, HMR, etc.)
        const handleReconnect = () => {
            console.log("🔌 Socket reconnected - rejoining rooms");

            // Always re-join customer room
            socket.emit("join", { role: "customer", id: user._id });

            // Re-join job room if we have an active job
            // Access via ref to get CURRENT value without re-running effect
            if (activeJobRef.current?._id) {
                console.log("🔗 Rejoining job room:", activeJobRef.current._id);
                socket.emit("join", { role: "job", id: activeJobRef.current._id });
            }
        };

        socket.on("connect", handleReconnect);

        // Fetch active job on mount
        fetchActiveJob();

        // Setup geolocation
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const success = (position) => {
            const { latitude, longitude } = position.coords;
            console.log("📍 Precise Location found:", latitude, longitude);
            setLocation({
                lat: latitude,
                lng: longitude,
                address: "Precise Location Detected"
            });
        };

        const error = (err) => {
            console.warn(`⚠️ GPS Error (${err.code}): ${err.message}`);
            if (err.code === 1) alert("Please allow Location Access for better accuracy! 📍");
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(success, error, geoOptions);
            const watchId = navigator.geolocation.watchPosition(success, error, geoOptions);
            return () => navigator.geolocation.clearWatch(watchId);
        }

        // Initial config from URL is now handled in state initialization

        // Socket event listeners - these stay stable, don't re-attach on job changes
        const handleStatusChanged = (payload) => {
            console.log("📡 Status Changed:", payload);
            
            // SECURITY/LOGIC CHECK: Only update if this message is for our current active job
            // This prevents "cross-talk" if a partner accepts a DIFFERENT job while this customer is waiting
            const incomingJobId = (payload.jobId || payload.job?._id)?.toString();
            const currentJobId = activeJobRef.current?._id?.toString();

            if (!currentJobId || (incomingJobId && currentJobId !== incomingJobId)) {
                console.warn("⚠️ Ignoring status update for a different mission:", incomingJobId);
                return;
            }

            if (payload.job) {
                setActiveJob(payload.job);
            } else if (payload.status) {
                setActiveJob(prev => ({ ...prev, status: payload.status }));
            }
        };


        // Redundant safely: fetch if we get a generic update too
        const handleJobAccepted = (data) => {
            console.log("🎉 Job Accepted Event:", data);
            fetchActiveJob();
        };

        const handleBhaiyaLocation = (coords) => {
            console.log("📍 Bhaiya Location Update:", coords);
            setBhaiyaLocation(coords);
        };

        socket.on('status_changed', handleStatusChanged);
        socket.on('job_accepted', handleJobAccepted);
        socket.on('bhaiya_location', handleBhaiyaLocation);

        return () => {
            console.log("🧹 Cleaning up socket listeners");
            socket.off("connect", handleReconnect);
            socket.off('status_changed', handleStatusChanged);
            socket.off('job_accepted', handleJobAccepted);
            socket.off('bhaiya_location', handleBhaiyaLocation);
        };
    }, [user]); // ONLY depend on user - socket listeners are stable

    // CRITICAL: Keep customer in job room whenever activeJob changes
    // This prevents losing room membership on re-renders
    useEffect(() => {
        if (!activeJob?._id) return;

        console.log("🔗 Joining job room:", activeJob._id);
        socket.emit("join", { role: "job", id: activeJob._id });

        return () => {
            console.log("🔓 Leaving job room:", activeJob._id);
        };
    }, [activeJob?._id]);

    // Auto-search if query exists and location is ready
    useEffect(() => {
        if (location && query && viewState === 'idle') {
            handleAiSearch(query);
        }
    }, [location, query, viewState]);

    // FALLBACK: Poll every 3s to ensure UI doesn't get stuck if socket fails
    useEffect(() => {
        if (!activeJob || ['COMPLETED', 'CANCELLED', 'PAID'].includes(activeJob.status)) return;

        const interval = setInterval(() => {
            fetchActiveJob();
        }, 3000);

        return () => clearInterval(interval);
    }, [activeJob?.status]);

    const fetchActiveJob = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/jobs/active/${user._id}?role=customer`);
            if (res.data.job) {
                setActiveJob(res.data.job);
                setViewState('tracking');
                // Job room join is now handled by useEffect
            }
        } catch (err) {
            console.error("Fetch job error:", err);
        }
    };

    const handleAiSearch = async (forcedQuery) => {
        const searchText = typeof forcedQuery === 'string' ? forcedQuery : query;
        if (!searchText) return;

        // If clicking a category button, update the text box to show it
        if (typeof forcedQuery === 'string') {
            setQuery(forcedQuery);
        }

        if (!location) {
            alert("Pehle Location allow kijiye, tabhi Bhaiya milenge!");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/ai/interpret', {
                text: searchText,
                lat: location.lat,
                lng: location.lng
            });

            setAiResult({
                serviceType: res.data.service,
                confidence: res.data.confidence,
                workers: res.data.workers,
                estimatedPrice: res.data.estimatedPrice
            });
            setViewState('results');
            setSelectedWorker(null);

            // Scroll to results
            setTimeout(() => {
                const element = document.getElementById('search-results');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            alert(`AI Issue: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedWorker) return alert("Pehle ek Bhaiya select karo!");
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/jobs/create', {
                customerId: user._id,
                serviceType: aiResult.serviceType,
                description: query,
                location: location,
                price: aiResult.estimatedPrice,
                preferredWorkerId: selectedWorker._id
            });

            if (res.data.success) {
                console.log("✅ Booking Created:", res.data.job);
                console.log("📡 Broadcasting to partners:", res.data.partnerIds);

                setActiveJob(res.data.job);
                setViewState('tracking');

                // Job room join is now handled by useEffect (triggered by setActiveJob above)

                // Broadcast to ALL nearby partners
                socket.emit('request_bhaiya', {
                    job: res.data.job,
                    partners: res.data.partnerIds
                });

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Booking failed!";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelMission = async () => {
        if (!window.confirm("Sure you want to abort mission?")) return;
        setLoading(true);
        try {
            const res = await axios.patch(`http://localhost:5000/api/jobs/${activeJob._id}/status`, { status: 'CANCELLED' });

            // Backend emits status update via global.io

            setActiveJob(null);
            setViewState('idle');
            setAiResult(null);
            setSelectedWorker(null);
            alert("Mission aborted successfully! ⛔");
        } catch (err) {
            console.error("Cancellation Error:", err);
            alert("Cancellation failed! Check connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePayment = async () => {
        setLoading(true);
        try {
            const res = await axios.patch(`http://localhost:5000/api/jobs/${activeJob._id}/status`, {
                status: 'PAID'
            });
            if (res.data.success) {
                setActiveJob(null);
                setViewState('idle');
                setAiResult(null);
                setSelectedWorker(null);
                // Backend emits status update
                alert("Payment Successful! Bhaiya is happy. 😊");
            }
        } catch (err) {
            alert("Payment failed: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-black font-sans pb-20 overflow-x-hidden">
            {/* Nav */}
            <nav className="p-4 border-b-4 border-black flex justify-between items-center sticky top-0 bg-white z-[100] shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="bg-yellow-400 p-2 border-2 border-black rotate-3 shadow-[2px_2px_0_0_#000]">
                        <Zap size={20} className="fill-black" />
                    </div>
                    <span className="text-xl font-[1000] uppercase italic tracking-tighter">FixNow</span>
                </div>
                {_user && (
                    <div 
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center gap-2 border-2 border-black px-3 py-1 rounded-full bg-white shadow-[2px_2px_0_0_#000] cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        <span className="text-xs font-black uppercase italic">{_user.name}</span>
                        <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-yellow-400">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${_user.name}`} alt="avatar" />
                        </div>
                    </div>
                )}
            </nav>

            <div className="max-w-6xl mx-auto px-4 pt-8">

                {/* 1. Unified Search Section */}
                {viewState === 'idle' && !isAutoSearch && (
                    <section className="relative mb-8">
                        <div className="bg-yellow-400 p-8 md:p-14 rounded-[3.5rem] border-4 border-black shadow-[15px_15px_0_0_#000] overflow-hidden relative transition-all duration-500">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
                            <Wrench size={180} />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={viewState === 'idle' ? 'idle' : 'active'}>
                                <h1 className="text-5xl md:text-8xl font-[1000] uppercase italic tracking-tighter leading-[0.85] mb-8">
                                    {viewState === 'idle' ? (
                                        <>KUCH <span className="text-white drop-shadow-[5px_5px_0_0_#000]">KABADA</span> <br /> HUA HAI?</>
                                    ) : (
                                        <>FINDING A <br /> <span className="text-white drop-shadow-[5px_5px_0_0_#000]">{aiResult?.serviceType}</span></>
                                    )}
                                </h1>
                            </motion.div>
                        </AnimatePresence>

                        <div className="relative group max-w-4xl">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
                                placeholder="Describe problem (e.g. AC thanda nahi kar raha...)"
                                className="w-full p-6 md:p-10 rounded-[2.5rem] border-4 border-black text-xl md:text-3xl font-black italic shadow-[8px_8px_0_0_#FFF] outline-none group-focus-within:translate-y-[-4px] group-focus-within:shadow-[12px_12px_0_0_#FFF] transition-all"
                            />
                            <button onClick={() => handleAiSearch()} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-5 md:p-8 rounded-3xl hover:scale-105 transition-transform shadow-[4px_4px_0_0_#FACC15] active:translate-y-1">
                                <Search size={32} strokeWidth={4} />
                            </button>
                        </div>

                        {/* Fast Access Buttons */}
                        <div className="mt-8 flex flex-wrap gap-3">
                            {['Electrician', 'Plumber', 'AC Repair', 'Cleaning', 'Cook'].map(s => (
                                <button key={s} onClick={() => handleAiSearch(s)} className="px-6 py-3 bg-white border-2 border-black rounded-2xl font-black uppercase italic text-xs hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-y-0">
                                    {s}
                                </button>
                            ))}
                        </div>

                        {viewState !== 'idle' && (
                            <button
                                onClick={() => { setViewState('idle'); setIsAutoSearch(false); setAiResult(null); setSelectedWorker(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="absolute top-6 right-10 flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase italic hover:scale-105 transition-transform shadow-[4px_4px_0_0_#FFF]"
                            >
                                <ArrowLeft size={14} /> Wapas Jao / Change
                            </button>
                        )}
                    </div>
                </section>
                )}

                {/* Compact Search for Non-Idle States OR Auto-Search Loading */}
                {(viewState !== 'idle' || (isAutoSearch && loading)) && viewState !== 'tracking' && (
                    <div className="bg-white border-4 border-black p-4 rounded-3xl shadow-[8px_8px_0_0_#000] mb-8 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex items-center gap-2 bg-yellow-400 px-4 py-2 border-2 border-black rounded-xl rotate-[-1deg]">
                            <Zap size={16} fill="black" />
                            <span className="font-black uppercase italic text-sm">{aiResult?.serviceType || 'Searching...'}</span>
                        </div>
                        <div className="flex-1 relative w-full">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
                                className="w-full p-3 border-2 border-black rounded-xl font-bold italic outline-none"
                                placeholder="Refine your problem..."
                            />
                            <button onClick={() => handleAiSearch()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-lg">
                                <Search size={16} />
                            </button>
                        </div>
                        <button onClick={() => { setViewState('idle'); setIsAutoSearch(false); setAiResult(null); }} className="px-4 py-2 border-2 border-black rounded-xl font-black uppercase italic text-[10px] hover:bg-slate-100">
                            Change Problem
                        </button>
                    </div>
                )}

                {/* 2. Content Section */}
                <div id="search-results" className="space-y-16 py-8">
                    {viewState === 'results' && aiResult && (
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => { setViewState('idle'); setIsAutoSearch(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 font-black uppercase italic text-xs text-slate-400 hover:text-black transition-colors">
                                <ArrowLeft size={14} /> Dusra Service Khao
                            </button>
                        </div>
                    )}
                    {viewState === 'results' && aiResult && (
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                            {/* Verdict Card */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-white p-8 rounded-[3.5rem] border-4 border-black shadow-[15px_15px_0_0_#22c55e] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 bg-black text-white text-[10px] font-black uppercase italic rotate-12 -mr-4 -mt-2">AI VERDICT</div>
                                    <h3 className="text-5xl font-[1000] uppercase italic leading-[0.85] mb-6">
                                        YES! <br /> <span className="text-yellow-400 drop-shadow-[2px_2px_0_#000]">NEED A {aiResult.serviceType}</span>
                                    </h3>
                                    <div className="flex items-center gap-2 mb-8 font-black text-xs uppercase opacity-40 italic">
                                        Confidence: {Math.round(aiResult.confidence * 100)}% Match
                                    </div>
                                    <div className="p-6 bg-slate-50 border-4 border-black rounded-3xl mb-8 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase opacity-40">Fixed Price</p>
                                            <p className="text-4xl font-[1000] italic">₹{aiResult.estimatedPrice}</p>
                                        </div>
                                        <div className="bg-green-500 p-2 rounded-xl border-2 border-black">
                                            <ShieldCheck size={32} className="text-white" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleConfirmBooking}
                                        disabled={!selectedWorker || loading}
                                        className="w-full py-6 bg-black text-white rounded-[2.5rem] border-4 border-black font-black text-2xl uppercase italic shadow-[6px_6px_0_0_#FACC15] hover:shadow-none hover:translate-x-1 hover:translate-y-1 disabled:opacity-30 transition-all"
                                    >
                                        {loading ? 'Wait...' : 'Book Bhaiya'}
                                    </button>
                                    {!selectedWorker && <p className="text-[10px] font-black uppercase text-center mt-4 text-red-500 animate-pulse">Select a Bhaiya on the map below</p>}
                                </div>

                                {selectedWorker && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0_0_#000] flex items-center gap-4 border-dashed">
                                        <div className="w-16 h-16 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center text-4xl shadow-[3px_3px_0_0_#000]">👷</div>
                                        <div>
                                            <h4 className="font-black uppercase italic text-xl">{selectedWorker.name}</h4>
                                            <div className="flex items-center gap-1 font-black text-xs uppercase text-green-600">
                                                <Star size={14} fill="currentColor" /> Ready to reach in 15m
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Map & List */}
                            <div className="lg:col-span-8 space-y-10">
                                <div className="h-[550px] w-full bg-slate-200 rounded-[5rem] border-4 border-black relative overflow-hidden shadow-[20px_20px_0_0_#000] z-10 transition-transform">
                                    <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <RecenterMap coords={location} />

                                        <Marker position={[location.lat, location.lng]} icon={userIcon}>
                                            <Popup><span className="font-black">You are here!</span></Popup>
                                        </Marker>

                                        {aiResult.workers.map(worker => (
                                            <Marker
                                                key={worker._id}
                                                position={[worker.location.coordinates[1], worker.location.coordinates[0]]}
                                                icon={workerIcon}
                                                eventHandlers={{
                                                    click: () => setSelectedWorker(worker)
                                                }}
                                            >
                                                <Popup>
                                                    <div className="text-center p-2">
                                                        <p className="font-black text-sm mb-2">{worker.name}</p>
                                                        <button onClick={() => setSelectedWorker(worker)} className="bg-yellow-400 px-3 py-1 border-2 border-black font-black uppercase text-[10px] italic shadow-[2px_2px_0_0_#000]">I Want This Bhaiya</button>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-4">
                                        <h4 className="text-2xl font-[1000] uppercase italic tracking-tighter">Available Bhaiya's Nearby</h4>
                                        <span className="text-xs font-black uppercase italic opacity-40">{aiResult.workers.length} Found</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {aiResult.workers.map(worker => (
                                            <button
                                                key={worker._id}
                                                onClick={() => { setSelectedWorker(worker); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                                className={`p-6 rounded-[3rem] border-4 transition-all flex items-center gap-5 text-left ${selectedWorker?._id === worker._id ? 'border-yellow-400 bg-yellow-400 rotate-1 scale-105 shadow-[12px_12px_0_0_#000]' : 'border-black bg-white hover:bg-slate-50 shadow-[8px_8px_0_0_#000]'}`}
                                            >
                                                <div className="w-20 h-20 bg-white border-4 border-black rounded-[1.8rem] flex items-center justify-center text-5xl shadow-[4px_4px_0_0_#000]">👷</div>
                                                <div className="flex-1">
                                                    <h5 className="font-black uppercase italic text-xl leading-tight">{worker.name}</h5>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" className="text-black/20" />)}
                                                        <span className="text-[10px] font-black uppercase ml-1 italic">Verified Partner</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        {aiResult.workers.length === 0 && (
                                            <div className="col-span-2 p-16 text-center bg-red-50 border-4 border-black border-dashed rounded-[4rem]">
                                                <AlertTriangle size={64} className="mx-auto text-red-500 mb-6" />
                                                <h4 className="text-3xl font-[1000] uppercase italic text-red-600 tracking-tighter">Oh No!! No Bhaiya Found!</h4>
                                                <p className="text-sm font-black opacity-60 uppercase mt-4">Try checking another service or increase search area.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {viewState === 'tracking' && activeJob && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 max-w-5xl mx-auto">
                            <div className="bg-black text-white p-14 rounded-[5rem] border-8 border-yellow-400 shadow-[25px_25px_0_0_#000] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150 pointer-events-none">
                                    <Clock size={250} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                                    <div className="space-y-6 flex-1">
                                        <div className="px-6 py-2 bg-yellow-400 text-black border-4 border-black rounded-full inline-flex items-center gap-3 font-black text-sm uppercase italic animate-pulse">
                                            <div className="w-3 h-3 bg-red-600 rounded-full" />
                                            {activeJob.status === 'OFFERED' ? 'DISPATCHING' : activeJob.status.replace(/_/g, ' ')}
                                        </div>
                                        <h2 className="text-7xl md:text-9xl font-[1000] uppercase italic tracking-tighter leading-[0.8]">
                                            {
                                                activeJob.status === 'OFFERED' ? 'MISSION \n SENT!' :
                                                    activeJob.status === 'ACCEPTED' ? 'YES! \n OTW!' :
                                                        activeJob.status === 'ON_THE_WAY' ? 'HE IS \n NEAR!' :
                                                            activeJob.status === 'IN_PROGRESS' ? 'WORK \n ONGOING' :
                                                                activeJob.status === 'COMPLETED' ? 'WORK \n DONE!' :
                                                                    activeJob.status === 'CANCELLED' ? 'MISSION \n CANCELLED' : 'SUCCESS!'
                                            }
                                        </h2>
                                        <div className="flex flex-col gap-4 mt-6">
                                            <div className="flex items-center gap-4">
                                                <p className="text-yellow-400 font-extrabold uppercase italic tracking-[0.2em] text-xl">
                                                    {
                                                        activeJob.status === 'OFFERED' ? 'Waiting for Bhaiya to Accept' :
                                                            activeJob.status === 'ACCEPTED' ? 'Bhaiya is on his way' :
                                                                activeJob.status === 'ON_THE_WAY' ? 'Bhaiya is almost there' :
                                                                    activeJob.status === 'IN_PROGRESS' ? 'Bhaiya is fixing it...' :
                                                                        activeJob.status === 'COMPLETED' ? 'Please pay the Bhaiya' :
                                                                            activeJob.status === 'CANCELLED' ? 'Partner cancelled the mission' : 'Mission Accomplished'
                                                    }
                                                </p>
                                                {activeJob.otp && !['IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED'].includes(activeJob.status) && (
                                                    <div className="bg-white text-black px-4 py-1 border-2 border-black rounded-xl font-black text-lg shadow-[3px_3px_0_0_#FACC15]">
                                                        PIN: {activeJob.otp}
                                                    </div>
                                                )}
                                            </div>

                                            {activeJob.status === 'OFFERED' && (
                                                <button
                                                    onClick={handleCancelMission}
                                                    disabled={loading}
                                                    className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl uppercase italic tracking-widest shadow-[8px_8px_0_0_#000] border-4 border-black active:translate-y-2 active:shadow-none transition-all mt-4"
                                                >
                                                    {loading ? 'Aborting...' : 'ABORT MISSION'}
                                                </button>
                                            )}

                                            {activeJob.status === 'CANCELLED' && (
                                                <button
                                                    onClick={() => {
                                                        setActiveJob(null);
                                                        setViewState('idle');
                                                        setAiResult(null);
                                                        setSelectedWorker(null);
                                                    }}
                                                    className="w-full py-6 bg-yellow-400 text-black rounded-[2rem] font-black text-xl uppercase italic tracking-widest shadow-[8px_8px_0_0_#000] border-4 border-black active:translate-y-2 active:shadow-none transition-all mt-4"
                                                >
                                                    START NEW SEARCH
                                                </button>
                                            )}

                                            {activeJob.status === 'COMPLETED' && (
                                                <button
                                                    onClick={handleCompletePayment}
                                                    disabled={loading}
                                                    className="w-full py-8 bg-emerald-500 text-white rounded-[2.5rem] font-black text-4xl uppercase italic tracking-tighter shadow-[10px_10px_0_0_#000] border-4 border-black active:translate-y-2 active:shadow-none transition-all"
                                                >
                                                    {loading ? 'Processing...' : 'CONFIRM & PAY'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {activeJob.partnerId && (
                                        <div className="bg-white text-black p-10 rounded-[4rem] border-4 border-black w-full md:w-96 shadow-[12px_12px_0_0_#FACC15]">
                                            <div className="flex items-center gap-6 mb-8">
                                                <div className="w-24 h-24 rounded-[2.5rem] bg-yellow-400 border-4 border-black flex items-center justify-center text-6xl shadow-[4px_4px_0_0_#000]">👷</div>
                                                <div>
                                                    <h4 className="font-[1000] uppercase italic text-3xl leading-none mb-1">{activeJob.partnerId.name}</h4>
                                                    <p className="text-[10px] font-black uppercase opacity-40">Super Expert</p>
                                                </div>
                                            </div>
                                            <a href={`tel:${activeJob.partnerId.phone}`} className="block w-full py-6 bg-green-500 text-white rounded-[2.5rem] font-[1000] text-2xl uppercase italic text-center border-4 border-black shadow-[8px_8px_0_0_#000] hover:translate-y-1 hover:shadow-none transition-all">CALL BHAIYA</a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-[650px] w-full bg-slate-200 rounded-[6rem] border-8 border-black shadow-[30px_30px_0_0_#000] overflow-hidden group">
                                <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <RecenterMap coords={location} />
                                    <Marker position={[location.lat, location.lng]} icon={userIcon} />
                                    {bhaiyaLocation && <Marker position={[bhaiyaLocation.lat, bhaiyaLocation.lng]} icon={workerIcon} />}
                                </MapContainer>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Global Loader Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-3xl flex flex-col items-center justify-center space-y-10">
                        <div className="relative">
                            <div className="w-48 h-48 border-[25px] border-yellow-400 border-t-black rounded-full animate-spin"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-bounce">
                                {viewState === 'tracking' ? '🛑' : '🤖'}
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-6xl font-[1000] uppercase italic tracking-tighter text-black">
                                {viewState === 'tracking'
                                    ? (activeJob?.status === 'COMPLETED' ? 'PAYING BHAIYA...' : 'ABORTING...')
                                    : (!location ? 'GETTING LOCATION...' : 'AI IS SEARCHING...')}
                            </h2>
                            <p className="font-black text-slate-400 uppercase tracking-[0.6em] text-xs mt-6 px-10">
                                {viewState === 'tracking'
                                    ? (activeJob?.status === 'COMPLETED' ? 'Transferring funds to partner' : 'Cleaning up mission records')
                                    : (!location ? 'Waiting for GPS precision 📍' : 'Finding specialized professionals near your location')}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Drawer */}
            <AnimatePresence>
                {isProfileOpen && (
                    <ProfileSection 
                        user={_user} 
                        onClose={() => setIsProfileOpen(false)} 
                        onUpdate={handleProfileUpdate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookingPage;
