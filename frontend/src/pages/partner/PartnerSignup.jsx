import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, User, Shield, Camera, Wrench, ArrowRight, Mail,
    MapPin, Briefcase, Info, CheckCircle2, UserCheck,
    ChevronRight, ChevronLeft, Building2, UploadCloud, X, Search
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';

const ALL_SERVICES = [
    "AC Installation", "AC Repair", "Aluminium Work", "App Developer", "Babysitter",
    "Bathroom Renovation", "Bed Bug Treatment", "Bike Repair", "Borewell & Water Drilling",
    "Bridal Makeup", "CA & Tax Filing", "Car AC Repair", "Car Wash", "Carpenter",
    "Carpet Cleaning", "CCTV Installation", "Chimney Cleaning", "Cockroach Control",
    "Computer Repair", "Cook", "Courier & Delivery", "Dance Teacher", "Deep Cleaning",
    "Dietitian", "DJ & Sound System", "Doctor Home Visit", "Door & Window Installation",
    "Driver", "DTH & Cable Setup", "Elder Care", "Electrician", "Event Decoration",
    "False Ceiling", "Fitness Trainer", "Flower Decoration", "Furniture Repair",
    "Garden & Landscaping", "Gas Stove Repair", "Geyser Repair", "Glass Fitting",
    "Graphic Designer", "Home Automation", "Home Cleaning", "Home Renovation",
    "Interior Designer", "Inverter & Battery Repair", "Jewellery Repair", "Kitchen Cleaning",
    "Laptop Repair", "Laundry & Dry Cleaning", "Legal Consultant", "Locksmith", "Maid",
    "Mehendi Artist", "Men Salon", "Microwave Repair", "Mobile Repair", "Modular Kitchen Installation",
    "Mosquito Control", "Music Teacher", "Nurse Home Care", "Packers & Movers", "Painter",
    "Party Makeup", "Pest Control", "Photography", "Physiotherapist", "Plumber",
    "Rat Control", "Refrigerator Repair", "RO Water Purifier Service", "Security Guard",
    "Shoe Repair", "Sofa Cleaning", "Solar Panel Installation", "Spa & Massage",
    "Swimming Pool Maintenance", "Tailor & Alteration", "Tent & Catering", "Termite Control",
    "Tile Fitting", "Tree Cutting", "Tutor", "TV Repair", "Type Puncture", "Videography",
    "Washing Machine Repair", "Watch Repair", "Water Pump Repair", "Water Tank Cleaning",
    "Waterproofing", "Waxing & Threading", "Website Developer", "WiFi & Network Setup",
    "Women Salon", "Yoga Instructor"
];

const PartnerSignup = () => {
    const [step, setStep] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        gender: 'Male',
        alternatePhone: '',
        skills: [],
        customSkill: '',
        experience: '',
        bio: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: ''
        },
        aadhaar: '',
        selfie: '',
        aadhaarPic: ''
    });

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const topSkills = [
        "Electrician", "Plumber", "AC Repair", "Cleaning",
        "Pest Control", "Painter", "Carpenter", "Cook"
    ];

    const toggleSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = res.data.address;

                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        address: {
                            street: data.suburb || data.neighbourhood || data.road || '',
                            city: data.city || data.town || data.village || '',
                            state: (data.state || data.county || '').replace('State of ', ''),
                            pincode: data.postcode || ''
                        }
                    }));
                }
            } catch (err) {
                console.error("Reverse Geocoding Error:", err);
                alert("Location detect karne me error aayi. Please manually enter karein.");
            }
        }, (err) => {
            alert("GPS permission denied or timeout.");
        });
    };

    const handleSignup = async () => {
        setLoading(true);
        let coords = [0, 0];

        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            coords = [pos.coords.longitude, pos.coords.latitude];
        } catch (err) {
            console.warn("GPS not allowed");
        }

        try {
            const res = await axios.post(`${API_BASE}/api/users/register`, {
                ...formData,
                role: 'partner',
                location: {
                    type: 'Point',
                    coordinates: coords
                }
            });
            if (res.data.success) {
                alert("🚀 Application Submitted! Check your email for confirmation.");
                navigate('/');
            }
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const filteredSkills = ALL_SERVICES.filter(s =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 md:p-10 font-sans">

            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-yellow-400/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-4xl grid lg:grid-cols-12 gap-8 relative z-10">

                {/* Sidebar Info */}
                <div className="lg:col-span-4 hidden lg:flex flex-col justify-between py-10">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0_0_#fff]">
                                <Wrench size={24} className="text-black" />
                            </div>
                            <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter">FixNow <span className="text-yellow-400">PRO</span></h2>
                        </div>

                        <div className="space-y-8">
                            {['Personal Info', 'Professional', 'Verification'].map((label, i) => (
                                <div key={i} className={`transition-all duration-300 ${step === i + 1 ? 'opacity-100' : 'opacity-30'}`}>
                                    <p className="text-xs font-black text-yellow-400 mb-1 uppercase tracking-widest">Step 0{i + 1}</p>
                                    <h4 className="text-xl font-bold uppercase italic">{label}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Form Area */}
                <motion.div layout className="lg:col-span-8 bg-[#151515] border-2 border-white/10 p-8 md:p-12 rounded-[3.5rem] shadow-2xl relative">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                                <header><h3 className="text-4xl font-[950] uppercase italic tracking-tighter">Your Profile</h3></header>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Full Name</label>
                                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 focus-within:border-yellow-400 transition-all">
                                            <User size={18} className="text-yellow-400" />
                                            <input type="text" placeholder="Rahul Kumar" className="bg-transparent border-none outline-none w-full font-bold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Email Address</label>
                                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 focus-within:border-yellow-400 transition-all">
                                            <Mail size={18} className="text-yellow-400" />
                                            <input type="email" placeholder="rahul@example.com" className="bg-transparent border-none outline-none w-full font-bold" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Mobile Number</label>
                                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 focus-within:border-yellow-400 transition-all">
                                            <Phone size={18} className="text-yellow-400" />
                                            <input type="tel" placeholder="98765 43210" className="bg-transparent border-none outline-none w-full font-bold" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Password</label>
                                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 focus-within:border-yellow-400 transition-all">
                                            <Shield size={18} className="text-yellow-400" />
                                            <input type="password" placeholder="Password" className="bg-transparent border-none outline-none w-full font-bold" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-400/5 p-4 rounded-2xl border border-yellow-400/10 flex items-start gap-4">
                                    <Info size={20} className="text-yellow-400 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase italic text-yellow-400/60 leading-relaxed">Note: You don't need a password now. After AI verification and Admin approval, your unique 6-digit login code will be sent to your email.</p>
                                </div>

                                <button onClick={nextStep} className="w-full py-5 bg-yellow-400 text-black rounded-2xl font-[950] uppercase italic text-xl border-2 border-black shadow-[6px_6px_0_0_#FFF] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">Continue</button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                                <header><h3 className="text-4xl font-[950] uppercase italic tracking-tighter">Your Skills</h3></header>

                                <div className="flex flex-wrap gap-2">
                                    {topSkills.map(skill => (
                                        <button key={skill} onClick={() => toggleSkill(skill)} className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${formData.skills.includes(skill) ? 'bg-yellow-400 border-yellow-400 text-black shadow-[4px_4px_0_0_#fff]' : 'border-white/5 text-white/20'}`}>{skill}</button>
                                    ))}
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="px-4 py-2 rounded-xl border-2 border-yellow-400 text-yellow-400 font-black text-[10px] uppercase hover:bg-yellow-400 hover:text-black transition-all bg-yellow-400/10"
                                    >
                                        See More +
                                    </button>
                                </div>

                                {formData.skills.length > 0 && (
                                    <div className="bg-white/5 p-4 rounded-2xl border border-dashed border-white/10">
                                        <p className="text-[10px] font-black uppercase text-white/30 mb-2">Selected Skills ({formData.skills.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.skills.map(s => (
                                                <span key={s} className="px-3 py-1 bg-yellow-400 text-black rounded-lg text-[10px] font-bold flex items-center gap-2">
                                                    {s} <X size={12} className="cursor-pointer" onClick={() => toggleSkill(s)} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Other Skill (Write anything, AI will help!)</label>
                                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <Info size={18} className="text-yellow-400" />
                                        <input type="text" placeholder="e.g. Fridge mechanic, CCTV helper..." className="bg-transparent border-none outline-none w-full font-bold" value={formData.customSkill} onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Experience</label>
                                        <input type="number" placeholder="Years" className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 font-bold" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Alt Phone</label>
                                        <input type="tel" placeholder="Alternative Phone" className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 font-bold" value={formData.alternatePhone} onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Permanent Address</label>
                                        <button
                                            onClick={handleDetectLocation}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-yellow-400 hover:text-white transition-all bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20"
                                        >
                                            <MapPin size={12} /> Detect My Location
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Street / Area"
                                            className="p-4 bg-white/5 rounded-2xl border border-white/10 font-bold"
                                            value={formData.address.street}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="City"
                                            className="p-4 bg-white/5 rounded-2xl border border-white/10 font-bold"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="State"
                                            className="p-4 bg-white/5 rounded-2xl border border-white/10 font-bold"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            className="p-4 bg-white/5 rounded-2xl border border-white/10 font-bold"
                                            value={formData.address.pincode}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="w-1/3 py-5 border-2 border-white/10 rounded-2xl font-black uppercase italic text-white/20">Back</button>
                                    <button onClick={nextStep} className="w-2/3 py-5 bg-white text-black rounded-2xl font-[950] uppercase italic text-xl border-2 border-black shadow-[6px_6px_0_0_#FACC15]">Continue</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                                <header><h3 className="text-4xl font-[950] uppercase italic tracking-tighter">Verification</h3></header>

                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Aadhaar Card Number</label>
                                    <input type="text" placeholder="1234 5678 9012" className="bg-transparent border-none outline-none w-full font-bold text-lg" value={formData.aadhaar} onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="bg-yellow-400/5 p-6 rounded-[2rem] border-2 border-dashed border-yellow-400/20 flex flex-col items-center justify-center gap-3 text-center cursor-pointer">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'selfie')} />
                                        {formData.selfie ? <img src={formData.selfie} className="w-12 h-12 rounded-full object-cover" /> : <Camera size={20} className="text-yellow-400" />}
                                        <p className="text-[10px] font-black uppercase text-yellow-400">Selfie</p>
                                    </label>
                                    <label className="bg-white/5 p-6 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'aadhaarPic')} />
                                        {formData.aadhaarPic ? <img src={formData.aadhaarPic} className="w-12 h-12 rounded object-cover" /> : <UploadCloud size={20} className="text-white/20" />}
                                        <p className="text-[10px] font-black uppercase text-white/20">Aadhaar ID</p>
                                    </label>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="w-1/3 py-5 border-2 border-white/10 rounded-2xl font-black uppercase italic text-white/20">Back</button>
                                    <button onClick={handleSignup} disabled={loading} className="w-2/3 py-5 bg-yellow-400 text-black rounded-2xl font-[950] uppercase italic text-xl border-2 border-black shadow-[8px_8px_0_0_#FFF]">
                                        {loading ? 'Processing...' : 'Submit Application'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* All Skills Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#151515] w-full max-w-2xl max-h-[85vh] rounded-[3rem] border-2 border-white/10 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(250,204,21,0.1)]"
                        >
                            <div className="p-8 border-b border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-3xl font-black uppercase italic text-yellow-400">Select All Skills</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search service (e.g. WiFi, CCTV, Cleaning...)"
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-yellow-400 transition-all font-bold"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {filteredSkills.map(skill => (
                                        <button
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            className={`p-3 rounded-xl border font-bold text-[10px] uppercase transition-all text-left flex items-center justify-between ${formData.skills.includes(skill) ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-yellow-400/50'}`}
                                        >
                                            {skill}
                                            {formData.skills.includes(skill) && <CheckCircle2 size={12} />}
                                        </button>
                                    ))}
                                </div>
                                {filteredSkills.length === 0 && (
                                    <div className="text-center py-10 opacity-30">
                                        <Wrench size={40} className="mx-auto mb-4" />
                                        <p className="font-black uppercase italic">Skill Not Found! Write in 'Other Skills' box.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-black/50 border-t border-white/10 flex justify-between items-center">
                                <p className="text-xs font-black uppercase text-white/30 italic">{formData.skills.length} Selected</p>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-3 bg-yellow-400 text-black rounded-xl font-black uppercase italic text-sm border-2 border-black shadow-[4px_4px_0_0_#FFF] active:translate-y-1 active:shadow-none transition-all"
                                >
                                    Done Selecting
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PartnerSignup;
