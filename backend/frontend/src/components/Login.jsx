import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { login, verifyEmail, logout } = useAuth();

    const emailRef = useRef();
    const passwordRef = useRef();

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [resendMsg, setResendMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError('');
            setResendMsg('');
            setNeedsVerification(false);
            setLoading(true);

            const userCredential = await login(emailRef.current.value, passwordRef.current.value);

            // Check if they verified their email link
            if (!userCredential.user.emailVerified) {
                // Instantly log them out since they aren't verified
                await logout();
                setError('Please verify your email before logging in.');
                setNeedsVerification(true);
            } else {
                // If verified, issue a dummy token for the existing App.jsx `RequireAuth` guard 
                // Alternatively, App.jsx uses context, but this keeps backwards compatibility.
                localStorage.setItem('agri_auth_token', userCredential.user.uid);
                navigate('/language');
            }

        } catch (e) {
            console.error(e);
            switch (e.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Invalid email or password.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many failed attempts. Try again later.');
                    break;
                default:
                    setError('Failed to log in. Please check your credentials.');
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setResendMsg('');
            setError('');
            // We must temporarily log them back in to send the verification link
            const userCredential = await login(emailRef.current.value, passwordRef.current.value);
            await verifyEmail();
            await logout(); // log them back out
            setResendMsg('Verification email sent! Please check your inbox.');
        } catch (e) {
            setError('Failed to resend verification email.');
        }
    };

    return (
        <div className="w-full h-full bg-[#050B08] flex flex-col items-center justify-between relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-80px] left-[-80px] w-[280px] h-[280px] bg-[#7CFF00] rounded-full blur-[130px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-[-60px] right-[-60px] w-[220px] h-[220px] bg-[#00FF88] rounded-full blur-[120px] opacity-8 pointer-events-none" />

            {/* Top section: logo + title */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-center pt-14 px-6 z-10"
            >
                {/* Logo Icon */}
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7CFF00]/20 to-[#00FF88]/10 border border-[#7CFF00]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#7CFF00]/10">
                    <span className="text-4xl">🌱</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight text-center">{t('welcome_to_agri')}</h1>
                <p className="text-sm text-white/50 mt-2 text-center">{t('smart_farming')}</p>
            </motion.div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                className="w-full px-5 pb-10 z-10"
            >
                <div className="bg-[#0c1a10]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 shadow-2xl shadow-black/80">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm text-center"
                                >
                                    ⚠️ {error}
                                </motion.div>
                            )}

                            {resendMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-[#7CFF00]/10 border border-[#7CFF00]/30 text-[#7CFF00] p-3 rounded-xl text-sm text-center"
                                >
                                    📧 {resendMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1 mb-1 block">Email</label>
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
                                placeholder="••••••••"
                                className="w-full bg-[#050B08] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/20 outline-none focus:border-[#7CFF00]/50 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-4 rounded-2xl bg-[#7CFF00] text-black font-black text-sm tracking-wide shadow-[0_0_20px_rgba(124,255,0,0.2)] hover:shadow-[0_0_30px_rgba(124,255,0,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Authenticating...
                                </>
                            ) : (
                                <>Login →</>
                            )}
                        </button>
                    </form>

                    {needsVerification && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleResend}
                                className="text-white/60 hover:text-[#7CFF00] text-sm font-semibold transition-colors border-b border-transparent hover:border-[#7CFF00]"
                            >
                                Resend Verification Email
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/signup" className="text-white/40 hover:text-white text-sm font-medium transition-colors">
                            Don't have an account? <span className="text-[#7CFF00]">Sign Up</span>
                        </Link>
                    </div>
                </div>

                <p className="text-center text-white/20 text-xs mt-6">
                    By continuing you agree to our Terms & Privacy Policy
                </p>
            </motion.div>
        </div>
    );
}
