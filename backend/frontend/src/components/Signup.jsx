import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup, verifyEmail } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError("Passwords do not match");
        }

        try {
            setError('');
            setLoading(true);

            // Create the Firebase user
            await signup(emailRef.current.value, passwordRef.current.value);

            // Send the verification email to that user
            await verifyEmail();

            // Hide the form and show the success message
            setEmailSent(true);

        } catch (e) {
            console.error(e);
            switch (e.code) {
                case 'auth/email-already-in-use':
                    setError("This email address is already in use.");
                    break;
                case 'auth/invalid-email':
                    setError("Invalid email address.");
                    break;
                case 'auth/weak-password':
                    setError("Password should be at least 6 characters.");
                    break;
                default:
                    setError("Failed to create an account.");
                    break;
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full h-full bg-[#050B08] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-80px] left-[-80px] w-[280px] h-[280px] bg-[#7CFF00] rounded-full blur-[130px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-[-60px] right-[-60px] w-[220px] h-[220px] bg-[#00FF88] rounded-full blur-[120px] opacity-8 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full px-5 z-10"
            >
                <div className="bg-[#0c1a10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/80">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#7CFF00]/20 to-[#00FF88]/10 border border-[#7CFF00]/30 flex items-center justify-center mb-4">
                            <span className="text-3xl">🌱</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
                        <p className="text-white/40 text-sm mt-1">Join Agri AI Smart Farming</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {emailSent ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-6"
                            >
                                <div className="text-5xl mb-4">📧</div>
                                <h3 className="text-lg font-bold text-[#7CFF00] mb-2">Verification Email Sent!</h3>
                                <p className="text-white/60 text-sm mb-6">
                                    We sent a verification link to <span className="text-white font-semibold">{emailRef.current?.value}</span>.<br />
                                    Please check your inbox and click the link to activate your account.
                                </p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                                >
                                    Return to Login
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-4"
                            >
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm text-center">
                                        ⚠️ {error}
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1 mb-1 block">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        ref={emailRef}
                                        placeholder="you@example.com"
                                        className="w-full bg-[#050B08] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/20 outline-none focus:border-[#7CFF00]/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1 mb-1 block">Password</label>
                                    <input
                                        type="password"
                                        required
                                        ref={passwordRef}
                                        placeholder="Min 6 characters"
                                        className="w-full bg-[#050B08] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/20 outline-none focus:border-[#7CFF00]/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1 mb-1 block">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        ref={passwordConfirmRef}
                                        placeholder="Confirm your password"
                                        className="w-full bg-[#050B08] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/20 outline-none focus:border-[#7CFF00]/50 transition-all"
                                    />
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full mt-2 py-4 rounded-2xl bg-[#7CFF00] text-black font-black text-sm tracking-wide shadow-[0_0_20px_rgba(124,255,0,0.2)] hover:shadow-[0_0_30px_rgba(124,255,0,0.4)] disabled:opacity-50 transition-all flex items-center justify-center"
                                >
                                    {loading ? 'Creating Account...' : 'Sign Up 🌱'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {!emailSent && (
                    <div className="text-center mt-6">
                        <Link to="/login" className="text-white/40 hover:text-white text-sm font-medium transition-colors">
                            Already have an account? <span className="text-[#7CFF00]">Login here</span>
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
