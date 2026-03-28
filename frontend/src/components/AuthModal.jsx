import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight, ShieldCheck, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthModal = ({ isOpen, onClose, role = 'customer' }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async () => {
        if (phone.length !== 10) return alert("Valid 10-digit phone number dalo!");
        if (isSignup && !name) return alert("Apna naam toh batao!");
        if (!password) return alert("Password toh dalo!");

        setLoading(true);
        try {
            const url = isSignup ? 'http://localhost:5000/api/users/register' : 'http://localhost:5000/api/users/login';
            const payload = isSignup ? { name, phone, password, role } : { phone, password };

            const res = await axios.post(url, payload);
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                onClose();

                const userRole = res.data.user.role;

                // If the modal was opened for 'customer' flow, just stay on landing page
                if (role === 'customer' && userRole !== 'admin') {
                    // Stay here, landing page will handle the search state
                } else if (userRole === 'partner') {
                    navigate('/partner');
                } else if (userRole === 'admin') {
                    navigate('/admin');
                } else {
                    // Default to stay
                }
            }
        } catch (err) {
            alert(err.response?.data?.message || "Auth Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[3rem] p-10 border-[6px] border-black shadow-[15px_15px_0_0_#FACC15]"
                >
                    <button onClick={onClose} className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={24} />
                    </button>

                    <div className="mb-10">
                        <div className="flex gap-8 mb-8">
                            <button
                                onClick={() => setIsSignup(false)}
                                className={`text-md font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${!isSignup ? 'border-yellow-400 text-black' : 'border-transparent text-slate-300'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setIsSignup(true)}
                                className={`text-md font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${isSignup ? 'border-yellow-400 text-black' : 'border-transparent text-slate-300'}`}
                            >
                                Signup
                            </button>
                        </div>

                        <h2 className="text-4xl font-[950] uppercase italic tracking-tighter mb-2 leading-none">
                            {isSignup ? 'Naye Ho?' : 'Welcome Back!'}
                        </h2>
                        <p className="text-slate-400 font-bold text-sm italic">
                            {isSignup ? 'Start your journey with FixNow.' : 'Bhaiya is waiting for you!'}
                        </p>
                    </div>

                    <div className="space-y-5">
                        {isSignup && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pura Naam</label>
                                <div className="flex items-center gap-4 p-5 rounded-[1.5rem] border-4 border-black bg-slate-50 transition-all focus-within:bg-white focus-within:shadow-[6px_6px_0_0_#000]">
                                    <User size={20} className="text-black" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-transparent outline-none font-bold w-full text-lg"
                                        placeholder="Harsh Sahu"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number</label>
                            <div className="flex items-center gap-4 p-5 rounded-[1.5rem] border-4 border-black bg-slate-50 transition-all focus-within:bg-white focus-within:shadow-[6px_6px_0_0_#000]">
                                <Phone size={20} className="text-black" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="bg-transparent outline-none font-bold w-full text-lg"
                                    placeholder="98765 43210"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Password</label>
                            <div className="flex items-center gap-4 p-5 rounded-[1.5rem] border-4 border-black bg-slate-50 transition-all focus-within:bg-white focus-within:shadow-[6px_6px_0_0_#000]">
                                <Lock size={20} className="text-black" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-transparent outline-none font-bold w-full text-lg"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAuth}
                            disabled={loading}
                            className={`w-full bg-black text-yellow-400 py-6 mt-6 rounded-[2rem] font-[950] uppercase italic text-2xl border-4 border-black transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-50' : 'hover:shadow-[8px_8px_0_0_#FACC15] active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0_0_#000]'}`}
                        >
                            {loading ? 'Wait...' : (isSignup ? 'Create Account' : 'Login Now')} <ArrowRight size={28} strokeWidth={4} />
                        </button>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                        <ShieldCheck size={14} className="text-emerald-500" /> Secure Local Auth Engine
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuthModal;
