import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Wrench, Clock, ShieldCheck, Map as MapIcon, Star, ArrowRight, X, AlertTriangle, IndianRupee, Utensils, Zap, Filter, ArrowLeft } from 'lucide-react';
import { socket } from '../../socket';
import axios from 'axios';
import { API_BASE } from '../../config';
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
    const [user] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            if (!stored) return null;
            const parsed = JSON.parse(stored);
            return (parsed.role === 'customer' || parsed.role === 'admin') ? parsed : null;
        } catch (e) { return null; }
    });
    const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
    const [aiResult, setAiResult] = useState(null);
    const [loading, setLoading] = useState(() => !!new URLSearchParams(window.location.search).get('q'));
    const [location, setLocation] = useState(null);
    const [activeJob, setActiveJob] = useState(null);
    const [bhaiyaLocation, setBhaiyaLocation] = useState(null);
    const [viewState, setViewState] = useState('idle'); // idle, results, tracking
    const [isAutoSearch, setIsAutoSearch] = useState(() => !!new URLSearchParams(window.location.search).get('q'));
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [awaitingPaymentConfirm, setAwaitingPaymentConfirm] = useState(false);
    const [missionAbortedByBhaiya, setMissionAbortedByBhaiya] = useState(false);

    // Use ref to track activeJob for reconnect handler (avoids stale closures)
    const activeJobRef = useRef(activeJob);

    const [_user, setUser] = useState(user);

    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageFile(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        activeJobRef.current = activeJob;
    }, [activeJob]);

    // Initialize socket connection and join rooms
    useEffect(() => {
        if (!user) return;

        console.log("👤 Joining as customer:", user._id);
        socket.emit('join', { role: 'customer', id: user._id });

        const handleReconnect = () => {
            console.log("🔌 Socket reconnected - rejoining rooms");
            socket.emit("join", { role: "customer", id: user._id });
            if (activeJobRef.current?._id) {
                console.log("🔗 Rejoining job room:", activeJobRef.current._id);
                socket.emit("join", { role: "job", id: activeJobRef.current._id });
            }
        };

        socket.on("connect", handleReconnect);

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

        const handleStatusChanged = (payload) => {
            console.log("📡 STATUS_CHANGED EVENT RECEIVED:", payload);
            if (!payload) return;

            const incomingJobId = (payload.jobId || payload.job?._id || payload._id)?.toString();
            const currentJobId = activeJobRef.current?._id?.toString();

            console.log(`🔍 ID Check: Incoming[${incomingJobId}] Target[${currentJobId}] Status[${payload.status}]`);

            // If a PAID status comes, we want to clear the overlay even if ID check is fuzzy
            if (payload.status === 'PAID') {
                setAwaitingPaymentConfirm(false);
                setActiveJob(null);
                setViewState('idle');
                navigate('/');
                alert("Mission Complete! 🤝");
                return;
            }

            if (payload.deleted === true || payload.status === 'CANCELLED') {
                setAwaitingPaymentConfirm(false);
                setMissionAbortedByBhaiya(true);
                setActiveJob(null);
                setViewState('tracking');
                return;
            }

            if (!currentJobId || (incomingJobId && currentJobId !== incomingJobId)) {
                console.warn("⚠️ Ignoring status update: ID mismatch.");
                return;
            }

            if (payload.job) {
                setActiveJob(payload.job);
            } else if (payload.status) {
                setActiveJob(prev => ({ ...prev, status: payload.status }));
            }
        };

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
    }, [user]);

    useEffect(() => {
        if (!activeJob?._id) return;
        socket.emit("join", { role: "job", id: activeJob._id });
        return () => { };
    }, [activeJob?._id]);

    useEffect(() => {
        if (location && query && viewState === 'idle') {
            handleAiSearch(query);
        }
    }, [location, query, viewState]);

    useEffect(() => {
        if (!activeJob || (['CANCELLED', 'PAID'].includes(activeJob.status) && !awaitingPaymentConfirm)) return;
        const interval = setInterval(() => {
            fetchActiveJob();
        }, 3000);
        return () => clearInterval(interval);
    }, [activeJob?.status, awaitingPaymentConfirm]);

    const fetchActiveJob = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/jobs/active/${user._id}?role=customer`);
            if (res.data.job) {
                setActiveJob(res.data.job);
                setViewState('tracking');

                if (res.data.job.status === 'PAID') {
                    setAwaitingPaymentConfirm(false);
                    setActiveJob(null);
                    setViewState('idle');
                    navigate('/');
                }
            } else if (awaitingPaymentConfirm) {
                // If the job becomes PAID or CANCELLED, it disappears from the 'active' list.
                // So if we find it gone, we assume it's completed.
                setAwaitingPaymentConfirm(false);
                alert("Mission Synchronized: Payment Confirmed! 🤝");
                setActiveJob(null);
                setViewState('idle');
                navigate('/');
            }
        } catch (err) {
            console.error("Fetch job error:", err);
        }
    };

    const handleAiSearch = async (forcedQuery) => {
        const searchText = typeof forcedQuery === 'string' ? forcedQuery : query;
        if (!searchText) return;

        if (typeof forcedQuery === 'string') setQuery(forcedQuery);

        if (!location) {
            alert("Pehle Location allow kijiye, tabhi Bhaiya milenge!");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/ai/interpret`, {
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
            setJobDescription(searchText);
            setViewState('results');

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
        if (!aiResult?.workers || aiResult.workers.length === 0) return alert("Pehle koi Bhaiya milne dijiye!");
        setIsDetailsModalOpen(false);
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/jobs/create`, {
                customerId: user._id,
                serviceType: aiResult.serviceType,
                description: jobDescription,
                imageUrl: imageFile,
                location: location,
                price: aiResult.estimatedPrice
            });

            if (res.data.success) {
                setActiveJob(res.data.job);
                setViewState('tracking');
                socket.emit('request_bhaiya', {
                    job: res.data.job,
                    partners: res.data.partnerIds
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Booking failed!");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelMission = async () => {
        if (!window.confirm("Sure you want to abort mission?")) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/api/jobs/${activeJob._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveJob(null);
            setViewState('idle');
            setAiResult(null);
            alert("Mission aborted successfully! ⛔");
        } catch (err) {
            console.error("Cancellation Error:", err);
            alert("Cancellation failed! Check connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePayment = async (method) => {
        // Emit a request to Bhaiya to confirm he received the money (UPI or Cash)
        socket.emit('payment_confirmation_request', {
            jobId: activeJob._id,
            partnerId: activeJob.partnerId._id || activeJob.partnerId,
            customerId: user._id,
            amount: activeJob.finalPrice || activeJob.basePrice,
            method: method || 'UPI'
        });

        setAwaitingPaymentConfirm(true);
        // We will reset this state when we receive 'status_changed' with 'PAID' via socket
    };

    return (
        <div className="min-h-screen bg-slate-50 text-black font-sans pb-20 overflow-x-hidden">
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
                {viewState === 'idle' && !isAutoSearch && (
                    <section className="relative mb-8">
                        <div className="bg-yellow-400 p-8 md:p-14 rounded-[3.5rem] border-4 border-black shadow-[15px_15px_0_0_#000] overflow-hidden relative transition-all duration-500">
                            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
                                <Wrench size={180} />
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key='idle'>
                                    <h1 className="text-5xl md:text-8xl font-[1000] uppercase italic tracking-tighter leading-[0.85] mb-8">
                                        KUCH <span className="text-white drop-shadow-[5px_5px_0_0_#000]">KABADA</span> <br /> HUA HAI?
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
                            <div className="mt-8 flex flex-wrap gap-3">
                                {['Electrician', 'Plumber', 'AC Repair', 'Cleaning', 'Cook'].map(s => (
                                    <button key={s} onClick={() => handleAiSearch(s)} className="px-6 py-3 bg-white border-2 border-black rounded-2xl font-black uppercase italic text-xs hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-y-0">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

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

                <div id="search-results" className="space-y-16 py-8">
                    {viewState === 'results' && aiResult && (
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => { setViewState('idle'); setIsAutoSearch(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-2 border-2 border-black rounded-xl font-black uppercase italic text-[10px] hover:bg-slate-100">
                                <ArrowLeft size={14} className="inline mr-2" /> Wapas Jao
                            </button>
                        </div>
                    )}
                    {viewState === 'results' && aiResult && (
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
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
                                        <div className="bg-green-500 p-2 rounded-xl border-2 border-black text-white">
                                            <ShieldCheck size={32} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsDetailsModalOpen(true)}
                                        disabled={loading || aiResult.workers.length === 0}
                                        className="w-full py-6 bg-black text-white rounded-[2.5rem] border-4 border-black font-black text-2xl uppercase italic shadow-[6px_6px_0_0_#FACC15] hover:shadow-none hover:translate-x-1 hover:translate-y-1 disabled:opacity-30 transition-all"
                                    >
                                        {loading ? 'Wait...' : 'Find Bhaiya!'}
                                    </button>
                                    <p className="text-[10px] font-black uppercase text-center mt-4 text-green-600">The first one to accept gets the job!</p>
                                </div>
                            </div>

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
                                            >
                                                <Popup><span className="font-black">{worker.name} is nearby!</span></Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-4">
                                        <h4 className="text-2xl font-[1000] uppercase italic tracking-tighter">Experts Receiving Your Request</h4>
                                        <span className="text-xs font-black uppercase italic opacity-40">{aiResult.workers.length} Available</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {aiResult.workers.map(worker => (
                                            <div
                                                key={worker._id}
                                                className="p-6 rounded-[3rem] border-4 border-black bg-white shadow-[8px_8px_0_0_#000] flex items-center gap-5 text-left"
                                            >
                                                <div className="w-20 h-20 bg-yellow-400 border-4 border-black rounded-[1.8rem] flex items-center justify-center text-5xl shadow-[4px_4px_0_0_#000]">👷</div>
                                                <div className="flex-1">
                                                    <h5 className="font-black uppercase italic text-xl leading-tight">{worker.name}</h5>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="text-[10px] font-black uppercase ml-1 italic text-green-600">Verified Professional</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
                                            {activeJob.status === 'OFFERED' ? 'WAITING FOR ACCEPTANCE' : activeJob.status.replace(/_/g, ' ')}
                                        </div>
                                        <h2 className="text-7xl md:text-9xl font-[1000] uppercase italic tracking-tighter leading-[0.8] whitespace-pre-line">
                                            {
                                                missionAbortedByBhaiya ? 'ERROR:\nMISSION\nABORTED!' :
                                                activeJob.status === 'OFFERED' ? 'MISSION\nSENT!' :
                                                activeJob.status === 'ACCEPTED' ? 'YES!\nOTW!' :
                                                activeJob.status === 'ON_THE_WAY' ? 'HE IS\nNEAR!' :
                                                activeJob.status === 'IN_PROGRESS' ? 'WORK\nONGOING' :
                                                activeJob.status === 'COMPLETED' ? 'WORK\nDONE!' :
                                                activeJob.status === 'CANCELLED' ? 'MISSION\nCANCELLED' : 'SUCCESS!'
                                            }
                                        </h2>
                                        <div className="flex flex-col gap-4 mt-6">
                                            <p className="text-yellow-400 font-extrabold uppercase italic tracking-[0.2em] text-xl">
                                                {
                                                    missionAbortedByBhaiya ? 'Bhaiya has aborted this mission due to technical or on-field issues.' :
                                                    activeJob.status === 'OFFERED' ? 'The job has been sent to all nearby bhiyas. Waiting for someone to accept...' :
                                                    activeJob.status === 'ACCEPTED' ? 'Bhaiya is on his way' :
                                                    activeJob.status === 'ON_THE_WAY' ? 'Bhaiya is almost there' :
                                                    activeJob.status === 'IN_PROGRESS' ? 'Bhaiya is fixing it...' :
                                                    activeJob.status === 'COMPLETED' ? 'Please pay the Bhaiya' :
                                                    activeJob.status === 'CANCELLED' ? 'Mission was aborted' : 'Mission Accomplished'
                                                }
                                            </p>

                                            {activeJob.otp && !['IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED'].includes(activeJob.status) && (
                                                <div className="bg-white text-black px-6 py-2 border-4 border-black rounded-2xl font-black text-2xl shadow-[5px_5px_0_0_#FACC15] w-fit">
                                                    PIN: {activeJob.otp}
                                                </div>
                                            )}

                                            {activeJob.status === 'OFFERED' && (
                                                <button
                                                    onClick={handleCancelMission}
                                                    disabled={loading}
                                                    className="w-fit px-12 py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl uppercase italic tracking-widest shadow-[8px_8px_0_0_#000] border-4 border-black active:translate-y-2 active:shadow-none transition-all mt-4"
                                                >
                                                    {loading ? 'Aborting...' : 'ABORT MISSION'}
                                                </button>
                                            )}

                                            {(activeJob.status === 'CANCELLED' || activeJob.status === 'PAID' || missionAbortedByBhaiya) && (
                                                <button
                                                    onClick={() => { 
                                                        setActiveJob(null); 
                                                        setViewState('idle'); 
                                                        setAiResult(null); 
                                                        setMissionAbortedByBhaiya(false);
                                                        navigate('/'); 
                                                    }}
                                                    className="w-fit px-12 py-6 bg-yellow-400 text-black rounded-[2rem] font-black text-xl uppercase italic tracking-widest shadow-[8px_8px_0_0_#000] border-4 border-black active:translate-y-2 active:shadow-none transition-all mt-4"
                                                >
                                                    BACK TO HOME PAGE
                                                </button>
                                            )}

                                            {activeJob.status === 'COMPLETED' && (
                                                <div className="space-y-8 w-full mt-4">
                                                    <div className="bg-white text-black p-8 rounded-[3.5rem] border-4 border-black shadow-[10px_10px_0_0_#FACC15]">
                                                        <h3 className="text-3xl font-[1000] uppercase italic mb-6">Pay Directly to Bhaiya</h3>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                            {/* UPI Option */}
                                                            {activeJob.partnerId?.upiId && (
                                                                <div className="p-6 bg-slate-50 border-4 border-black rounded-3xl">
                                                                    <p className="text-[10px] font-black uppercase opacity-40 mb-2">Pay via UPI</p>
                                                                    <p className="font-black text-xl mb-4 italic truncate">{activeJob.partnerId.upiId}</p>
                                                                    <a
                                                                        href={`upi://pay?pa=${activeJob.partnerId.upiId}&pn=${encodeURIComponent(activeJob.partnerId.name)}&am=${activeJob.finalPrice || activeJob.basePrice}&cu=INR`}
                                                                        className="inline-flex w-full py-4 bg-blue-500 text-white border-2 border-black rounded-2xl font-black text-xs uppercase italic items-center justify-center gap-2 shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
                                                                    >
                                                                        Open UPI App <ArrowRight size={14} />
                                                                    </a>
                                                                </div>
                                                            )}

                                                            {/* QR Option */}
                                                            {activeJob.partnerId?.qrCodeImage && (
                                                                <div className="p-6 bg-slate-50 border-4 border-black rounded-3xl flex flex-col items-center">
                                                                    <p className="text-[10px] font-black uppercase opacity-40 mb-4 text-left w-full">Scan QR Code</p>
                                                                    <img src={activeJob.partnerId.qrCodeImage} alt="QR Code" className="w-32 h-32 border-4 border-black rounded-2xl shadow-[4px_4px_0_0_#000]" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {activeJob.partnerId?.acceptsCash && (
                                                            <div className="mb-8 p-6 bg-emerald-50 border-4 border-black border-dashed rounded-3xl flex items-center gap-4">
                                                                <div className="text-3xl">💵</div>
                                                                <div>
                                                                    <p className="font-black uppercase italic text-sm">Cash Accepted</p>
                                                                    <p className="text-[9px] font-black opacity-60">You can pay hard cash directly after work.</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col gap-4">
                                                            <p className="text-xs font-black uppercase italic opacity-40 text-center">Select Payment Method to Finish</p>
                                                            <div className="flex flex-wrap gap-4">
                                                                <button onClick={() => handleCompletePayment('UPI')} className="flex-1 py-5 bg-black text-white rounded-2xl border-2 border-black font-black uppercase italic text-xs shadow-[5px_5px_0_0_#FACC15] active:translate-y-1 active:shadow-none transition-all">I Paid via UPI</button>
                                                                {activeJob.partnerId?.acceptsCash && (
                                                                    <button onClick={() => handleCompletePayment('CASH')} className="flex-1 py-5 bg-white text-black rounded-2xl border-2 border-black font-black uppercase italic text-xs shadow-[5px_5px_0_0_#000] active:translate-y-1 active:shadow-none transition-all">I Paid Cash</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {activeJob.partnerId ? (
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
                                    ) : (
                                        <div className="bg-white/10 p-10 rounded-[4rem] border-4 border-white/20 w-full md:w-96 backdrop-blur-md">
                                            <div className="animate-pulse flex flex-col items-center gap-6 text-center">
                                                <div className="w-24 h-24 rounded-full bg-yellow-400/20 flex items-center justify-center text-6xl">🤖</div>
                                                <p className="font-black uppercase italic text-yellow-400">Searching for partner...</p>
                                            </div>
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

            <AnimatePresence>
                {isDetailsModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-[2.5rem] border-4 border-black p-8 max-w-lg w-full shadow-[10px_10px_0_0_#000] relative">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-4 right-4 bg-yellow-400 border-2 border-black p-2 rounded-xl hover:translate-x-1 hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">
                                <X size={20} />
                            </button>
                            <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter mb-6">Mission Details</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-black uppercase italic mb-2">Describe the Problem (Optional)</label>
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        placeholder="Add more details about your issue..."
                                        rows={3}
                                        className="w-full p-4 rounded-2xl border-2 border-black font-bold outline-none focus:translate-y-[-2px] focus:shadow-[4px_4px_0_0_#000] transition-all resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black uppercase italic mb-2">Upload an Image (Optional)</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm font-bold border-2 border-black rounded-xl p-2 bg-slate-50 mb-2 fill-black" />
                                    {imageFile && (
                                        <div className="relative w-full h-40 border-2 border-black rounded-xl overflow-hidden mt-2">
                                            <img src={imageFile} alt="Preview" className="w-full h-full object-cover" />
                                            <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 border-2 border-black rounded-lg"><X size={14} /></button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleConfirmBooking}
                                    className="w-full py-4 bg-emerald-400 text-black border-4 border-black rounded-2xl font-[1000] text-xl uppercase italic shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mt-4"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                {viewState === 'tracking' ? 'UPDATING...' : 'AI IS SEARCHING...'}
                            </h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {awaitingPaymentConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 border-4 border-black shadow-[15px_15px_0_0_#FACC15] text-center">
                            <div className="w-24 h-24 bg-yellow-400 border-4 border-black rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-5xl shadow-[4px_4px_0_0_#000] animate-bounce">⏳</div>
                            <h3 className="text-3xl font-[1000] uppercase italic tracking-tighter mb-4 leading-none">Awaiting Bhaiya's Confirmation</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10">Bhaiya is currently checking his bank account/cash. Once he confirms, your mission will be officially closed.</p>
                            <div className="flex flex-col gap-4">
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ x: [-200, 200] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="w-full h-full bg-black"
                                    />
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-[0.2em] mb-4">Live Synchronization Active</p>
                                <button
                                    onClick={() => fetchActiveJob()}
                                    className="w-full py-4 bg-slate-100 text-black border-2 border-black rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
                                >
                                    Check Status Manually ↻
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isProfileOpen && (
                    <ProfileSection user={_user} onClose={() => setIsProfileOpen(false)} onUpdate={handleProfileUpdate} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookingPage;
