import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Zap,
    Shield,
    Clock,
    Wrench,
    Lightbulb,
    Droplets,
    Settings,
    Star,
    Menu,
    X,
    MapPin,
    Search,
    Hammer,
    Wind,
    MousePointer2,
    TrendingUp,
    Award,
    Users,
    CheckCircle2,
    Filter,
    IndianRupee,
    AlertTriangle,
    ArrowLeft,
    ChevronDown
} from 'lucide-react';
import { socket } from '../../socket';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE } from '../../config';

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

import { motion, AnimatePresence } from 'framer-motion';
import ProfileSection from '../../components/ProfileSection';

// Standalone preview ke liye mock Link
const Link = ({ to, children, className }) => (
    <a href={to} onClick={(e) => e.preventDefault()} className={className}>{children}</a>
);

// High-performance Intersection Observer Hook
const useIntersectionObserver = (options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const targetRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                if (options.triggerOnce) observer.unobserve(entry.target);
            }
        }, options);

        if (targetRef.current) observer.observe(targetRef.current);
        return () => {
            if (targetRef.current) observer.unobserve(targetRef.current);
        };
    }, [options]);

    return [targetRef, isIntersecting];
};

// Live Operations Feed Component - Curved Garland "Mala" Style
const LiveOpsFeed = ({ mode = 'normal' }) => {
    // Combine messages into a long ticker string
    const messages = [
        "🚀 BHAIYA ON THE WAY!",
        "⚡ 30 MIN ARRIVAL GUARANTEED",
        "🔥 ZERO CHIK-CHIK, TOTAL FIX!",
        "💎 INDIA'S FASTEST SERVICE NETWORK",
        "🏠 GHAR KE SAARE FIXES, EK CLICK MEIN",
        "🦄 NO SURGE PRICING - EVER!",
        "🛠️ EXPERT BHAIYAS READY 24/7"
    ];

    // Repeat the sequence to ensure it covers the long curve during scroll
    const tickerContent = [...messages, ...messages, ...messages].join("  •  ");

    return (
        <div className="absolute top-[50px] left-0 w-full z-20 pointer-events-none overflow-visible mix-blend-multiply">
            {/* The "Mala" Curve SVG */}
            <svg viewBox="0 0 1440 220" className="w-full h-auto min-w-[1000px] drop-shadow-xl" preserveAspectRatio="none">
                <defs>
                    {/* A gentle hanging curve (Garland/Mala shape) */}
                    <path id="malaPath" d="M -50,40 Q 720,100 1490,40" />
                    <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FACC15" />
                        <stop offset="50%" stopColor="#EAB308" />
                        <stop offset="100%" stopColor="#FACC15" />
                    </linearGradient>
                </defs>

                {/* The Yellow Ribbon Background (Foreground) */}
                <path
                    d="M -50,40 Q 720,100 1490,40"
                    fill="none"
                    stroke="url(#ribbonGradient)"
                    strokeWidth="50"
                    strokeLinecap="round"
                    className="opacity-100"
                />

                {/* Scrolling Text on Path */}
                <text dy="10" filter="url(#glow)">
                    <textPath href="#malaPath" startOffset="0%" className="font-[950] uppercase italic tracking-widest text-lg fill-black">
                        {/* Endless Loop Animation */}
                        <animate
                            attributeName="startOffset"
                            from="100%"
                            to="-100%"
                            dur="25s"
                            repeatCount="indefinite"
                        />
                        {tickerContent}
                    </textPath>
                </text>
            </svg>
        </div>
    );
};


// Main Landing Page Component
const Landingpage = ({ onLoginClick }) => {
    // ----------------- BOOKING LOGIC STATES -----------------
    const getStoredUser = () => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error("User Parse Error", e);
            return null;
        }
    };

    const [user, setUser] = useState(getStoredUser());
    const [searchQuery, setSearchQuery] = useState('');
    const [aiResult, setAiResult] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [cityName, setCityName] = useState('New Delhi'); // Default
    const [activeJob, setActiveJob] = useState(null);
    const [bhaiyaLocation, setBhaiyaLocation] = useState(null);
    const [viewState, setViewState] = useState('idle'); // idle, results, tracking
    const [liveExpertCount, setLiveExpertCount] = useState(0);
    const footerRef = useRef(null);

    // Ref to track activeJob for socket
    const activeJobRef = useRef(activeJob);
    useEffect(() => { activeJobRef.current = activeJob; }, [activeJob]);

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);
    const [feedMode, setFeedMode] = useState('normal');
    const navigate = useNavigate();

    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    // ----------------- SOCKET & GEO EFFECTS -----------------
    useEffect(() => {
        // Sync user state with localStorage frequently if needed
        const interval = setInterval(() => {
            const storedUser = getStoredUser();
            if (JSON.stringify(storedUser) !== JSON.stringify(user)) {
                setUser(storedUser);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (!user) return;

        console.log("👤 Joining as customer:", user._id);
        socket.emit('join', { role: 'customer', id: user._id });

        const handleReconnect = () => {
            socket.emit("join", { role: "customer", id: user._id });
            if (activeJobRef.current?._id) {
                socket.emit("join", { role: "job", id: activeJobRef.current._id });
            }
        };

        socket.on("connect", handleReconnect);
        fetchActiveJob();

        const geoOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
        const success = (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude, address: "Precise Location Detected" });
        };
        const error = (err) => console.warn(`⚠️ GPS Error (${err.code}): ${err.message}`);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(success, error, geoOptions);
            const watchId = navigator.geolocation.watchPosition(success, error, geoOptions);

            const handleStatusChanged = (payload) => {
                if (payload.job) setActiveJob(payload.job);
                else setActiveJob(prev => ({ ...prev, status: payload.status }));
            };
            const handleJobAccepted = () => fetchActiveJob();
            const handleBhaiyaLocation = (coords) => setBhaiyaLocation(coords);

            socket.on('status_changed', handleStatusChanged);
            socket.on('job_accepted', handleJobAccepted);
            socket.on('bhaiya_location', handleBhaiyaLocation);

            return () => {
                navigator.geolocation.clearWatch(watchId);
                socket.off("connect", handleReconnect);
                socket.off('status_changed', handleStatusChanged);
                socket.off('job_accepted', handleJobAccepted);
                socket.off('bhaiya_location', handleBhaiyaLocation);
            };
        }

        return () => {
            socket.off("connect", handleReconnect);
        };
    }, [user]);
    // Reverse Geocode City Name
    useEffect(() => {
        if (location?.lat && location?.lng) {
            const fetchCityName = async () => {
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}`);
                    const city = res.data.address.city || res.data.address.town || res.data.address.village || res.data.address.state_district || 'India';
                    setCityName(city);
                } catch (err) {
                    console.error("Geocode Error:", err);
                }
            };
            fetchCityName();
        }
    }, [location]);
    useEffect(() => {
        const fetchExpertCount = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/partners/available-count`);
                if (res.data.success) {
                    setLiveExpertCount(res.data.count);
                }
            } catch (err) { console.error("Expert Count Error:", err); }
        };
        fetchExpertCount();
        const interval = setInterval(fetchExpertCount, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!activeJob?._id) return;
        socket.emit("join", { role: "job", id: activeJob._id });
    }, [activeJob?._id]);

    useEffect(() => {
        if (!activeJob || ['COMPLETED', 'CANCELLED', 'PAID'].includes(activeJob.status)) return;
        const interval = setInterval(() => { fetchActiveJob(); }, 3000);
        return () => clearInterval(interval);
    }, [activeJob?.status]);

    const fetchActiveJob = async () => {
        if (!user) return;
        try {
            const res = await axios.get(`${API_BASE}/api/jobs/active/${user._id}?role=customer`);
            if (res.data.job) {
                setActiveJob(res.data.job);
                setViewState('tracking');
            }
        } catch (err) { console.error("Fetch job error:", err); }
    };

    // ----------------- HANDLERS -----------------
    const handleAiSearch = async (forcedQuery) => {
        const searchText = typeof forcedQuery === 'string' ? forcedQuery : searchQuery;
        if (!searchText) return;
        if (typeof forcedQuery === 'string') setSearchQuery(searchText);

        const loggedInUser = getStoredUser();
        if (!loggedInUser) {
            onLoginClick();
            return;
        }

        // Navigate in same window
        navigate(`/booking?q=${encodeURIComponent(searchText)}`);
    };

    const handleConfirmBooking = async () => {
        if (!selectedWorker) return alert("Pehle ek Bhaiya select karo!");
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/jobs/create`, {
                customerId: user._id,
                serviceType: aiResult.serviceType,
                description: searchQuery,
                location: location,
                price: aiResult.estimatedPrice,
                preferredWorkerId: selectedWorker._id
            });
            if (res.data.success) {
                setActiveJob(res.data.job);
                setViewState('tracking');
                socket.emit('request_bhaiya', { job: res.data.job, partners: res.data.partnerIds });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) { alert(err.response?.data?.message || "Booking failed!"); }
        finally { setLoading(false); }
    };

    const handleCancelMission = async () => {
        if (!window.confirm("Sure you want to abort mission?")) return;
        setLoading(true);
        try {
            await axios.patch(`${API_BASE}/api/jobs/${activeJob._id}/status`, { status: 'CANCELLED' });
            setActiveJob(null);
            setViewState('idle');
            setAiResult(null);
            setSelectedWorker(null);
            alert("Mission aborted successfully! ⛔");
        } catch (err) { alert("Cancellation failed!"); }
        finally { setLoading(false); }
    };

    const handleCompletePayment = async () => {
        setLoading(true);
        try {
            const res = await axios.patch(`${API_BASE}/api/jobs/${activeJob._id}/status`, { status: 'PAID' });
            if (res.data.success) {
                setActiveJob(null);
                setViewState('idle');
                setAiResult(null);
                setSelectedWorker(null);
                alert("Payment Successful! Bhaiya is happy. 😊");
            }
        } catch (err) { alert("Payment failed!"); }
        finally { setLoading(false); }
    };

    const [bentoRef, bentoVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
    const [featuresRef, featuresVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        const timer = setTimeout(() => setHeroVisible(true), 100);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-black font-sans selection:bg-yellow-400 overflow-x-hidden">
            {/* Background Animations: Moving Mesh Gradients */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-yellow-200/30 rounded-full blur-[120px] animate-mesh-1"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-100/40 rounded-full blur-[100px] animate-mesh-2"></div>
                <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-yellow-100/30 rounded-full blur-[80px] animate-mesh-3"></div>

                {/* Tech Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            </div>

            {/* Nav - Clean Neobrutalist */}
            <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-md py-3 border-b-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <div className="w-11 h-11 bg-yellow-400 rounded-xl border-2 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
                                <Wrench size={24} strokeWidth={3} className="text-black" />
                            </div>
                            <span className="text-3xl font-black tracking-tighter uppercase italic">Fix<span className="text-yellow-500">Now</span></span>
                        </div>

                        {/* Location pushed more to the right */}
                        <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 ml-10 rounded-xl border-2 border-black font-black text-[10px] uppercase shadow-[3px_3px_0_0_#000] rotate-[-1deg] hover:rotate-0 transition-transform">
                            <MapPin size={14} className="text-red-500" /> {cityName}
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="hidden lg:flex items-center mr-12">
                            <button
                                onClick={() => footerRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-yellow-400 px-6 py-2.5 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-[11px] font-black uppercase italic tracking-widest"
                            >
                                Join as Partner
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <div
                                    onClick={() => setIsProfileOpen(true)}
                                    className="flex items-center gap-2 border-2 border-black px-4 py-2 rounded-xl bg-white shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                                >
                                    <span className="text-xs font-black uppercase italic">{user.name}</span>
                                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-yellow-400">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
                                    </div>
                                </div>
                            ) : (
                                <button onClick={onLoginClick} className="bg-black text-yellow-400 px-7 py-3 rounded-xl font-black text-xs uppercase tracking-tighter border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                                    Login / Signup
                                </button>
                            )}
                        </div>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-black border-2 border-black rounded-lg bg-yellow-400 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </nav>
            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-[150] bg-white p-10 flex flex-col justify-center gap-10 lg:hidden"
                    >
                        <button onClick={() => setIsMenuOpen(false)} className="absolute top-10 right-10 p-4 border-2 border-black rounded-xl bg-yellow-400 shadow-[4px_4px_0_0_#000]">
                            <X size={32} />
                        </button>
                        <div className="flex flex-col gap-8 text-4xl font-[1000] uppercase italic tracking-tighter">
                            <button
                                onClick={() => { setIsMenuOpen(false); footerRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                                className="text-left py-4 border-b-4 border-black hover:text-yellow-500 transition-colors"
                            >
                                Join as Partner
                            </button>
                            <div className="flex items-center gap-4 py-4 text-slate-400">
                                <MapPin size={32} className="text-red-500" />
                                <span>{cityName}</span>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-300 mb-6">Active Bhayiyas</h3>
                            <div className="flex items-center gap-4 p-6 border-4 border-black rounded-3xl bg-yellow-400 shadow-[8px_8px_0_0_#000]">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse border-2 border-black" />
                                <span className="text-xl font-black italic">12,409 BHAIYAS LIVE</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero - Spotlight on Search Bar */}
            <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 px-6 z-10">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative">
                    {viewState !== 'idle' && (
                        <button
                            onClick={() => { setViewState('idle'); setAiResult(null); setSelectedWorker(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="absolute top-0 right-0 flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-black uppercase italic hover:scale-105 transition-transform shadow-[4px_4px_0_0_#FACC15] z-50 border-2 border-black"
                        >
                            <ArrowLeft size={16} strokeWidth={4} /> Wapas Jao / Change
                        </button>
                    )}
                    <div className={`w-full transition-all duration-1000 transform ${heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className="inline-flex items-center gap-2.5 bg-black text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-8 border-2 border-black shadow-[3px_3px_0_0_#FACC15] rotate-[-1deg]">
                            <Zap size={12} className="text-yellow-400" fill="currentColor" /> India's Fastest Service Network
                        </div>

                        <h1 className="text-5xl md:text-8xl font-[950] tracking-tighter leading-[0.9] mb-10 uppercase italic">
                            {viewState === 'idle' ? (
                                <>
                                    BHAIYA AA <br />
                                    <span className="text-black bg-yellow-400 px-5 py-1 rotate-[1.5deg] inline-block shadow-[8px_8px_0_0_#000] border-4 border-black">
                                        RAHE HAIN.
                                    </span>
                                </>
                            ) : (
                                <>
                                    FINDING A <br />
                                    <span className="text-black bg-yellow-400 px-5 py-1 rotate-[1.5deg] inline-block shadow-[8px_8px_0_0_#000] border-4 border-black">
                                        {aiResult?.serviceType || 'EXPERT'}
                                    </span>
                                    <br /> <span className="rotate-[-0.5deg] inline-block">FOR YOU!</span>
                                </>
                            )}
                        </h1>

                        <p className="text-lg md:text-2xl text-black/50 mb-14 max-w-3xl leading-tight font-black italic mx-auto">
                            {viewState === 'idle' ? (
                                <>Ab tension mat lo. <span className="text-white bg-black px-3 py-0.5 rotate-[-1deg] inline-block shadow-md">30-Minute</span> super fast services with <span className="text-black underline decoration-yellow-500 decoration-8 italic">Zero Chik-Chik Rates.</span></>
                            ) : (
                                <>Bhaiya is almost there! <span className="text-white bg-black px-3 py-0.5 rotate-[-1deg] inline-block shadow-md">AI Interpreting</span> your problem for the best price match.</>
                            )}
                        </p>

                        {/* Search Bar - Adjusted proportions */}
                        <div className="relative w-full max-w-4xl mx-auto group">
                            <div className="absolute -inset-4 bg-yellow-400/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative bg-white p-2.5 md:p-3.5 rounded-[2rem] md:rounded-[3rem] border-[5px] border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] md:shadow-[18px_18px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row items-stretch gap-3 transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[25px_25px_0_0_rgba(0,0,0,1)]">
                                <div className="flex-1 flex items-center px-6 py-4 gap-4 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-black/5 group-focus-within:border-yellow-400 transition-all">
                                    <Search size={28} className="text-black" strokeWidth={3} />
                                    <input
                                        type="text"
                                        placeholder="Bhaiya, AC thik karwana hai?"
                                        className="bg-transparent outline-none w-full font-black text-lg md:text-2xl placeholder-slate-300 uppercase italic tracking-tighter"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                                    />
                                </div>
                                <button onClick={() => handleAiSearch()} className="bg-yellow-400 text-black px-10 py-5 rounded-[1.5rem] md:rounded-[2rem] border-3 border-black font-[950] text-xl md:text-3xl transition-all flex items-center justify-center gap-3 uppercase italic tracking-tighter hover:bg-black hover:text-white active:scale-95 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                                    {loading ? 'Wait...' : 'Price Dekho'} <ArrowRight size={32} strokeWidth={4} />
                                </button>
                            </div>

                            {/* Fast Access Buttons */}
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                {['Electrician', 'Plumber', 'AC Repair', 'Cleaning', 'Cook'].map(s => (
                                    <button key={s} onClick={() => handleAiSearch(s)} className="px-6 py-3 bg-white border-2 border-black rounded-2xl font-black uppercase italic text-xs hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-y-0">
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Booking Flow Content Injection */}
                            <div id="search-results" className="mt-16 space-y-16">
                                {viewState === 'results' && aiResult && (
                                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-left">
                                        {/* Verdict Card */}
                                        <div className="lg:col-span-4 space-y-8">
                                            <div className="bg-white p-8 rounded-[3.5rem] border-4 border-black shadow-[15px_15px_0_0_#22c55e] relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 bg-black text-white text-[10px] font-black uppercase italic rotate-12 -mr-4 -mt-2">AI VERDICT</div>
                                                <h3 className="text-4xl font-[1000] uppercase italic leading-[0.85] mb-6">
                                                    YES! <br /> <span className="text-yellow-400 drop-shadow-[2px_2px_0_#000]">NEED A {aiResult?.serviceType || 'EXPERT'}</span>
                                                </h3>
                                                <div className="p-6 bg-slate-50 border-4 border-black rounded-3xl mb-8 flex items-center justify-between text-black">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase opacity-40">Fixed Price</p>
                                                        <p className="text-4xl font-[1000] italic">₹{aiResult?.estimatedPrice || 0}</p>
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
                                                {!selectedWorker && <p className="text-[10px] font-black uppercase text-center mt-4 text-red-500 animate-pulse italic">Select a Bhaiya on the map below</p>}
                                            </div>

                                            {selectedWorker && (
                                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0_0_#000] flex items-center gap-4 border-dashed text-black">
                                                    <div className="w-16 h-16 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center text-4xl shadow-[3px_3px_0_0_#000]">👷</div>
                                                    <div>
                                                        <h4 className="font-black uppercase italic text-xl">{selectedWorker?.name || 'Helper'}</h4>
                                                        <div className="flex items-center gap-1 font-black text-xs uppercase text-green-600">
                                                            <Star size={14} fill="currentColor" /> Ready to reach in 15m
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Map & List */}
                                        <div className="lg:col-span-8 space-y-10">
                                            <div className="h-[450px] w-full bg-slate-200 rounded-[4rem] border-4 border-black relative overflow-hidden shadow-[20px_20px_0_0_#000] z-10 flex items-center justify-center">
                                                {location ? (
                                                    <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                        <RecenterMap coords={location} />
                                                        <Marker position={[location.lat, location.lng]} icon={userIcon} />
                                                        {aiResult?.workers?.map(worker => worker.location?.coordinates && (
                                                            <Marker
                                                                key={worker._id}
                                                                position={[worker.location.coordinates[1], worker.location.coordinates[0]]}
                                                                icon={workerIcon}
                                                                eventHandlers={{ click: () => setSelectedWorker(worker) }}
                                                            />
                                                        ))}
                                                    </MapContainer>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-12 h-12 border-4 border-black border-t-yellow-400 rounded-full animate-spin"></div>
                                                        <p className="font-black uppercase italic text-xs">Getting your location...</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                                                {aiResult?.workers?.map(worker => (
                                                    <button
                                                        key={worker._id}
                                                        onClick={() => setSelectedWorker(worker)}
                                                        className={`p-6 rounded-[3rem] border-4 transition-all flex items-center gap-5 text-left ${selectedWorker?._id === worker._id ? 'border-yellow-400 bg-yellow-400 rotate-1 scale-105 shadow-[12px_12px_0_0_#000]' : 'border-black bg-white hover:bg-slate-50 shadow-[8px_8px_0_0_#000]'}`}
                                                    >
                                                        <div className="w-16 h-16 bg-white border-4 border-black rounded-[1.5rem] flex items-center justify-center text-4xl shadow-[4px_4px_0_0_#000]">👷</div>
                                                        <div className="flex-1">
                                                            <h5 className="font-black uppercase italic text-lg leading-tight">{worker.name}</h5>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Star size={10} fill="currentColor" />
                                                                <span className="text-[8px] font-black uppercase italic">Verified Partner</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                                {(!aiResult?.workers || aiResult.workers.length === 0) && (
                                                    <div className="col-span-2 p-10 bg-slate-100 rounded-[2rem] border-2 border-black border-dashed text-center">
                                                        <p className="font-black uppercase italic opacity-40">No Bhaiya found in this area 🛑</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {viewState === 'tracking' && activeJob && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 w-full text-left">
                                        <div className="bg-black text-white p-10 rounded-[4rem] border-8 border-yellow-400 shadow-[20px_20px_0_0_#000] relative overflow-hidden">
                                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                                                <div className="space-y-6 flex-1">
                                                    <div className="px-6 py-2 bg-yellow-400 text-black border-4 border-black rounded-full inline-flex items-center gap-3 font-black text-xs uppercase italic">
                                                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                                                        {activeJob?.status?.replace(/_/g, ' ') || 'STATUS'}
                                                    </div>
                                                    <h2 className="text-5xl md:text-8xl font-[1000] uppercase italic tracking-tighter leading-[0.8]">
                                                        {
                                                            activeJob?.status === 'OFFERED' ? 'MISSION SENT!' :
                                                                activeJob?.status === 'ACCEPTED' ? 'YES! OTW!' :
                                                                    activeJob?.status === 'ON_THE_WAY' ? 'HE IS NEAR!' :
                                                                        activeJob?.status === 'IN_PROGRESS' ? 'WORK ONGOING' :
                                                                            activeJob?.status === 'COMPLETED' ? 'WORK DONE!' : (activeJob?.status === 'CANCELLED' ? 'CANCELLED' : 'MISSION')
                                                        }
                                                    </h2>
                                                    {activeJob.otp && !['IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED'].includes(activeJob.status) && (
                                                        <div className="bg-white text-black px-4 py-1 border-2 border-black rounded-xl font-black text-lg shadow-[3px_3px_0_0_#FACC15] inline-block">
                                                            PIN: {activeJob.otp}
                                                        </div>
                                                    )}
                                                    <div className="mt-4 flex gap-4">
                                                        {activeJob.status === 'OFFERED' && (
                                                            <button onClick={handleCancelMission} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase italic border-4 border-black shadow-[4px_4px_0_0_#000]">Abort</button>
                                                        )}
                                                        {activeJob.status === 'COMPLETED' && (
                                                            <button onClick={handleCompletePayment} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase italic border-4 border-black shadow-[4px_4px_0_0_#000]">Confirm & Pay</button>
                                                        )}
                                                    </div>
                                                </div>
                                                {activeJob?.partnerId && typeof activeJob.partnerId === 'object' && (
                                                    <div className="bg-white text-black p-8 rounded-[3rem] border-4 border-black w-full md:w-80 shadow-[10px_10px_0_0_#FACC15]">
                                                        <h4 className="font-[1000] uppercase italic text-2xl mb-4">{activeJob.partnerId.name}</h4>
                                                        <a href={`tel:${activeJob.partnerId.phone}`} className="block w-full py-4 bg-green-500 text-white rounded-2xl font-[1000] uppercase italic text-center border-4 border-black shadow-[4px_4px_0_0_#000]">CALL BHAIYA</a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-[400px] w-full bg-slate-200 rounded-[4rem] border-4 border-black shadow-[15px_15px_0_0_#000] overflow-hidden flex items-center justify-center">
                                            {location ? (
                                                <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                    <RecenterMap coords={location} />
                                                    <Marker position={[location.lat, location.lng]} icon={userIcon} />
                                                    {bhaiyaLocation && <Marker position={[bhaiyaLocation.lat, bhaiyaLocation.lng]} icon={workerIcon} />}
                                                </MapContainer>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-black border-t-yellow-400 rounded-full animate-spin"></div>
                                                    <p className="font-black uppercase italic text-xs">Waiting for GPS...</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* ... */}
                            <div className="mt-10 flex flex-wrap justify-center gap-6 md:gap-10 font-black uppercase italic text-xs md:text-lg text-black tracking-tight">
                                <div className="flex items-center gap-2.5 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0_0_#22c55e] rotate-[-1.5deg]">
                                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div> Zero Chik-Chik
                                </div>
                                <div className="flex items-center gap-2.5 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0_0_#facc15] rotate-[1deg]">
                                    <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse delay-75"></div> Paisa Vasool
                                </div>
                                <div className="flex items-center gap-2.5 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0_0_#f97316] rotate-[-0.5deg]">
                                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse delay-150"></div> No Tension
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <LiveOpsFeed mode={feedMode} />

                {/* Floating Elements - Adjusted Scale */}
                <div className={`hidden xl:block absolute top-[40%] left-6 transition-all duration-1000 delay-300 transform ${heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                    <div className="bg-white border-3 border-black p-5 rounded-[2rem] shadow-[8px_8px_0_0_#FACC15] rotate-[-6deg] hover:rotate-0 transition-transform cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center border-2 border-black text-green-600"><Users size={24} /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Live experts</p>
                                <p className="text-xl font-black uppercase italic leading-none mt-1">{Intl.NumberFormat('en-IN').format(liveExpertCount)} READY</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`hidden xl:block absolute top-[48%] right-6 transition-all duration-1000 delay-500 transform ${heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                    <div className="bg-black text-white border-3 border-black p-5 rounded-[2rem] shadow-[8px_8px_0_0_#FF5733] rotate-[6deg] hover:rotate-0 transition-transform cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/20 text-yellow-400"><Clock size={24} /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none">Arrival Time</p>
                                <p className="text-xl font-black uppercase italic leading-none mt-1">30 Mins Max</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section >



            {/* Why FixNow - Visual Polish */}
            <section ref={featuresRef} className="py-32 px-6 bg-black text-white relative overflow-hidden border-y-[10px] border-black z-10" >
                <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-16 relative z-10">
                    <div className={`lg:col-span-1 transition-all duration-700 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <h2 className="text-5xl md:text-7xl font-[950] uppercase italic leading-[0.8] mb-10 text-yellow-400 tracking-tighter rotate-[-2deg]">FixNow <br />KYUN KARO?</h2>
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-24 h-24 rounded-full border-[5px] border-yellow-400 p-2 flex items-center justify-center animate-spin-slow">
                                <Award size={48} className="text-yellow-400" />
                            </div>
                            <p className="font-black text-xl uppercase tracking-tighter text-white leading-none italic">India ka <br />Number 1 <br />Standard</p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
                        {[
                            { icon: Clock, title: "Bhaiya in 30 Min", desc: "Before your tea gets cold, bhaiya reaches your home.", color: "bg-white text-black" },
                            { icon: Shield, title: "Triple Verified", desc: "ID Check + Police Verification. Tension mat lo!", color: "bg-yellow-400 text-black" },
                            { icon: TrendingUp, title: "Zero Surge Bhada", desc: "Fixed rates only. No bargaining, no hidden costs.", color: "bg-orange-500 text-black" },
                            { icon: MousePointer2, title: "Ek Click Booking", desc: "Bina calls ke expert bulao. One tap startup experience.", color: "bg-white text-black" },
                        ].map((feature, idx) => (
                            <div key={idx} className={`p-10 rounded-[3rem] border-[4px] border-black shadow-[8px_8px_0_0_#FFF] transition-all duration-500 hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none ${feature.color} transform ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${idx % 2 === 0 ? 'rotate-[-1deg]' : 'rotate-[1deg]'}`} style={{ transitionDelay: `${idx * 150}ms` }}>
                                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-8 border-3 border-black text-yellow-400">
                                    <feature.icon size={28} strokeWidth={4} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tight leading-none">{feature.title}</h3>
                                <p className="font-black leading-tight opacity-70 text-base italic">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>



            {/* Footer */}
            <footer ref={footerRef} className="py-24 bg-white border-t-[8px] border-black px-6 z-10 relative" >
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-yellow-400 shadow-[4px_4px_0_0_#FACC15] border-2 border-black">
                                    <Wrench size={26} strokeWidth={4} />
                                </div>
                                <span className="text-4xl font-black uppercase tracking-tighter italic">FixNow</span>
                            </div>
                            <p className="text-slate-500 font-black text-lg md:text-2xl mb-10 leading-tight max-w-lg italic">Redefining services for 1.4 Billion Indians. Startup energy, expert bhaiya connection.</p>
                        </div>

                        <div className="space-y-6">
                            <h4 className="font-black uppercase text-lg tracking-tighter italic underline decoration-yellow-400 decoration-4">Services</h4>
                            <ul className="space-y-4 font-black text-slate-500 uppercase text-xs tracking-widest italic">
                                <li><a href="#" className="hover:text-black transition-colors">AC Master Clean</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Electrician Fix</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Plumber Help</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Deep Cleaning</a></li>
                            </ul>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                            <h4 className="font-black uppercase text-lg tracking-tighter mb-4 italic">FixNow Pro</h4>
                            <p className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest leading-none">Paisa kamana hai? Join karo.</p>
                            <button onClick={() => navigate('/partner-signup')} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all border-3 border-black">Join Now</button>
                            <button onClick={() => navigate('/partner')} className="w-full bg-black text-white py-4 mt-4 rounded-xl font-black uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all border-3 border-black">Login</button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t-4 border-black/5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
                        <p>© 2024 FixNow Technologies.</p>
                        <div className="flex gap-10">
                            <a href="#" className="hover:text-black transition-colors underline decoration-2 decoration-yellow-400 underline-offset-4">Privacy</a>
                            <a href="#" className="hover:text-black transition-colors underline decoration-2 decoration-yellow-400 underline-offset-4">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>

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
                                    : 'AI IS SEARCHING...'}
                            </h2>
                            <p className="font-black text-slate-400 uppercase tracking-[0.6em] text-xs mt-6 px-10 italic">
                                {viewState === 'tracking'
                                    ? (activeJob?.status === 'COMPLETED' ? 'Transferring funds to partner' : 'Cleaning up mission records')
                                    : 'Finding specialized professionals near your location'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bouncing Scroll Indicator */}
            <AnimatePresence>
                {!isScrolled && viewState === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-10 right-10 z-[100] hidden md:flex flex-col items-center gap-2"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-black text-white px-3 py-1 rounded-full shadow-lg rotate-3 inline-block">Scroll Karo!</span>
                        <motion.button
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                            className="w-14 h-14 bg-yellow-400 rounded-2xl border-4 border-black flex items-center justify-center shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            <ChevronDown size={32} strokeWidth={4} />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Drawer */}
            <AnimatePresence>
                {isProfileOpen && (
                    <ProfileSection
                        user={user}
                        onClose={() => setIsProfileOpen(false)}
                        onUpdate={handleProfileUpdate}
                    />
                )}
            </AnimatePresence>

            <style>{`
              @keyframes mesh-1 {
                0%, 100% { transform: translate(0, 0); }
                50% { transform: translate(20%, 10%); }
              }
              @keyframes mesh-2 {
                0%, 100% { transform: translate(0, 0); }
                50% { transform: translate(-15%, -15%); }
              }
              @keyframes mesh-3 {
                0%, 100% { transform: translate(0, 0); }
                50% { transform: translate(10%, -20%); }
              }
              @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .animate-mesh-1 { animation: mesh-1 20s infinite ease-in-out; }
              .animate-mesh-2 { animation: mesh-2 25s infinite ease-in-out; }
              .animate-mesh-3 { animation: mesh-3 22s infinite ease-in-out; }
              .animate-spin-slow { animation: spin-slow 40s linear infinite; }
              
              /* Custom Tilted text shadows and effects */
              .font-black {
                text-rendering: optimizeLegibility;
              }
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                animation: marquee 20s linear infinite;
              }
            `}</style>
        </div >
    );
};

export default Landingpage;
