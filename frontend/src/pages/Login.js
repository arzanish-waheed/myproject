import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { PolicyModal, PolicyButton } from '../components/PoliciesModal';

const GOOGLE_CLIENT_ID = "666475827485-d1ae76rj2sclgc02aj84gmc7rmlsba1v.apps.googleusercontent.com";

export default function Login() {
    const [policyOpen, setPolicyOpen] = useState(false);
    const [tab, setTab]               = useState('login');
    const [role, setRole]             = useState('dentist');
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [fullName, setFullName]     = useState('');
    const [licenseNumber, setLicense] = useState('');
    const [phone, setPhone]           = useState('');
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [loading, setLoading]       = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted]       = useState(false);
    const navigate = useNavigate();
    const { isDark, toggleTheme }     = useTheme();
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // OTP state
    const [otpStep, setOtpStep]       = useState(false);
    const [otp, setOtp]               = useState('');
    const [otpEmail, setOtpEmail]     = useState('');

    // Forgot Password state
    const [forgotStep, setForgotStep]     = useState(false); // 'email' | 'otp' | 'newpass' | false
    const [forgotEmail, setForgotEmail]   = useState('');
    const [forgotOtp, setForgotOtp]       = useState('');
    const [newPassword, setNewPassword]   = useState('');
    const [confirmPass, setConfirmPass]   = useState('');

    // Google Sign-In state
    const [googleStep, setGoogleStep]             = useState(false); // 'role' | 'pmc' | false
    const [googleCredential, setGoogleCredential]  = useState('');
    const [googleEmail, setGoogleEmail]            = useState('');
    const [googleName, setGoogleName]              = useState('');
    const [googlePmc, setGooglePmc]                = useState('');
    const googleBtnRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('token');
        if (token) navigate('/', { replace: true });
    }, []);

    // ── Google Sign-In Init ──
    useEffect(() => {
        if (!window.google || googleStep || otpStep || forgotStep) return;

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        });

        if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'filled_black',
                size: 'large',
                width: 364,
                text: tab === 'login' ? 'signin_with' : 'signup_with',
                shape: 'pill',
            });
        }
    }, [mounted, tab, googleStep, otpStep, forgotStep]);

    const handleGoogleResponse = async (response) => {
        setLoading(true); setError(''); setSuccess('');
        try {
            const res = await API.post('/google-auth', { credential: response.credential });

            if (res.data.is_new_user && res.data.needs_role) {
                setGoogleCredential(response.credential);
                setGoogleEmail(res.data.google_email);
                setGoogleName(res.data.google_name);
                setGoogleStep('role');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.detail || 'Google sign-in failed. Try again.');
            setLoading(false);
        }
    };

    const handleGoogleRoleSelect = async (selectedRole) => {
        if (selectedRole === 'patient') {
            await finishGoogleSignup('patient', null);
        } else {
            setGoogleStep('pmc');
        }
    };

    const finishGoogleSignup = async (selectedRole, pmc) => {
        setLoading(true); setError(''); setSuccess('');
        try {
            const res = await API.post('/google-auth', {
                credential: googleCredential,
                role: selectedRole,
                license_number: pmc,
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Try again.');
            setLoading(false);
        }
    };

    const handleGooglePmcSubmit = () => {
        if (!googlePmc.trim()) { setError('PMC License number is required'); return; }
        finishGoogleSignup('admin', googlePmc.trim());
    };

    const resetGoogle = () => {
        setGoogleStep(false); setGoogleCredential(''); setGoogleEmail('');
        setGoogleName(''); setGooglePmc('');
        setError(''); setSuccess('');
    };

    const initParticles = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    const handleLogin = async () => {
        setLoading(true); setError(''); setSuccess('');
        try {
            const res = await API.post('/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/', { replace: true });
        } catch {
            setError('Invalid email or password');
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        setLoading(true); setError(''); setSuccess('');
        if (role === 'dentist' && !licenseNumber) {
            setError('PMC License number is required for Dentists');
            setLoading(false); return;
        }
        if (!fullName || !email || !password) {
            setError('Please fill all fields');
            setLoading(false); return;
        }
        try {
            const backendRole = role === 'dentist' ? 'admin' : 'patient';
            await API.post('/send-otp', {
                full_name:       fullName,
                email,
                password,
                role:            backendRole,
                license_number:  role === 'dentist' ? licenseNumber : null,
                phone:           role === 'dentist' ? phone : null,
            });
            setOtpEmail(email);
            setOtpStep(true);
            setSuccess(`✅ OTP sent to ${email}! Check your inbox.`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send OTP. Try again.');
        }
        setLoading(false);
    };

    const handleVerifyOTP = async () => {
        setLoading(true); setError(''); setSuccess('');
        try {
            await API.post('/verify-otp', { email: otpEmail, otp });
            setSuccess('✅ Account created! Please sign in.');
            setOtpStep(false);
            setTab('login');
            setEmail(''); setPassword('');
            setFullName(''); setLicense(''); setPhone(''); setOtp('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid OTP. Try again.');
        }
        setLoading(false);
    };

    const handleResendOTP = async () => {
        setOtp('');
        setOtpStep(false);
        await handleSendOTP();
    };

    // ── FORGOT PASSWORD HANDLERS ──────────────────────────────

    // Step 1 — Email daalo, OTP bhejo
    const handleForgotSendOTP = async () => {
        if (!forgotEmail) { setError('Please enter your email'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            await API.post('/forgot-password', { email: forgotEmail });
            setSuccess(`✅ Reset code sent to ${forgotEmail}`);
            setForgotStep('otp');
        } catch (err) {
            setError(err.response?.data?.detail || 'Email not found');
        }
        setLoading(false);
    };

    // Step 2 — OTP verify karo
    const handleForgotVerifyOTP = async () => {
        if (forgotOtp.length !== 6) { setError('Enter 6-digit code'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            await API.post('/verify-forgot-otp', { email: forgotEmail, otp: forgotOtp });
            setSuccess('✅ Code verified! Set your new password.');
            setForgotStep('newpass');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid code. Try again.');
        }
        setLoading(false);
    };

    // Step 3 — Naya password set karo
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters'); return;
        }
        if (newPassword !== confirmPass) {
            setError('Passwords do not match'); return;
        }
        setLoading(true); setError(''); setSuccess('');
        try {
            await API.post('/reset-password', {
                email:       forgotEmail,
                otp:         forgotOtp,
                new_password: newPassword
            });
            setSuccess('✅ Password reset! Please sign in.');
            setForgotStep(false);
            setForgotEmail(''); setForgotOtp('');
            setNewPassword(''); setConfirmPass('');
            setTab('login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Reset failed. Try again.');
        }
        setLoading(false);
    };

    const resetForgot = () => {
        setForgotStep(false);
        setForgotEmail(''); setForgotOtp('');
        setNewPassword(''); setConfirmPass('');
        setError(''); setSuccess('');
    };

    return (
        <div className="ds-page-root" style={{
            minHeight: '100vh',
            background: isDark
                ? 'radial-gradient(ellipse at 20% 50%, #0a1628 0%, #060b14 50%, #0a0f1e 100%)'
                : 'radial-gradient(ellipse at 20% 50%, #E2EAF4 0%, #F0F4F8 50%, #E2E8F0 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            position: 'relative', overflowX: 'hidden', overflowY: 'auto', fontFamily: "'Inter', sans-serif",
            padding: '24px 20px 60px', transition: 'background 0.3s ease, color 0.3s ease',
            color: isDark ? '#E2E8F0' : '#0F172A',
        }}>
            <Particles
                key={isDark ? 'login-dark' : 'login-light'}
                id="login-particles" init={initParticles}
                style={{ position: 'fixed', inset: 0, zIndex: 0 }}
                options={{
                    background: { color: { value: 'transparent' } },
                    fpsLimit: 50,
                    particles: {
                        number: { value: 65 },
                        color: { value: isDark ? ['#0D9488', '#0891B2', '#6366f1'] : ['#0D9488', '#0284C7', '#6366f1'] },
                        links: { enable: true, color: isDark ? '#0D9488' : '#0284C7', opacity: isDark ? 0.08 : 0.28, distance: 150 },
                        move: { enable: true, speed: 0.4, random: true },
                        opacity: { value: isDark ? { min: 0.05, max: 0.4 } : { min: 0.35, max: 0.75 }, animation: { enable: true, speed: 0.8 } },
                        size: { value: { min: 1, max: 3 } },
                    },
                    interactivity: {
                        events: { onHover: { enable: true, mode: 'grab' }, onClick: { enable: true, mode: 'push' } },
                        modes: { grab: { distance: 180, links: { opacity: isDark ? 0.25 : 0.5 } }, push: { quantity: 2 } }
                    }
                }}
            />

            <motion.div style={{ position: 'fixed', top: '10%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div style={{ position: 'fixed', bottom: '10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(8,145,178,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }}
                animate={{ scale: [1.2, 1, 1.2], opacity: [1, 0.5, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {mounted && ['🦷', '🔬', '⚕️', '💊', '🧬'].map((icon, i) => (
                <motion.div key={i} style={{ position: 'fixed', fontSize: 22, zIndex: 2, opacity: isDark ? 0.12 : 0.2, left: `${10 + i * 20}%`, top: `${20 + (i % 3) * 25}%`, pointerEvents: 'none' }}
                    animate={{ y: [-15, 15, -15], rotate: [-5, 5, -5], opacity: isDark ? [0.08, 0.18, 0.08] : [0.15, 0.28, 0.15] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
                >{icon}</motion.div>
            ))}

            <motion.div style={{ position: 'fixed', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(13,148,136,0.4), transparent)', zIndex: 2, pointerEvents: 'none' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Top Navigation Bar with Home and Theme Switcher */}
            <div style={{ width: '100%', maxWidth: 780, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, zIndex: 20 }}>
                <motion.button
                    onClick={() => navigate('/home')}
                    style={{
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                        color: isDark ? '#E2E8F0' : '#0F172A',
                        padding: '8px 16px', borderRadius: 12,
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'inherit',
                    }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                    ← Back to Home
                </motion.button>

                {/* Theme Toggle Button */}
                <motion.button
                    onClick={toggleTheme}
                    style={{
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 22, cursor: 'pointer',
                        width: 50, height: 28, padding: 0,
                        display: 'flex', alignItems: 'center',
                        position: 'relative', flexShrink: 0,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <motion.div style={{
                        position: 'absolute', inset: 0, borderRadius: 22,
                        background: isDark
                            ? 'linear-gradient(135deg, #1e3a5f, #0a1628)'
                            : 'linear-gradient(135deg, #87CEEB, #FDB813)',
                    }} />
                    <motion.div
                        animate={{ x: isDark ? 4 : 26 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11, zIndex: 1,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                    >
                        {isDark ? '🌙' : '☀️'}
                    </motion.div>
                </motion.button>
            </div>

            {/* Card */}
            <motion.div style={{
                background: isDark ? 'rgba(10,18,35,0.92)' : 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(40px)',
                border: isDark ? '1px solid rgba(13,148,136,0.15)' : '1px solid rgba(13,148,136,0.25)',
                borderRadius: 28, padding: '52px 48px',
                width: '100%', maxWidth: 460, position: 'relative', zIndex: 10,
                boxShadow: isDark
                    ? '0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 24px 60px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                transition: 'background 0.3s ease, border-color 0.3s ease',
            }}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, #0D9488, transparent)', borderRadius: 1 }} />

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <motion.div style={{ display: 'inline-block' }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(13,148,136,0.2), rgba(8,145,178,0.2))', border: '1px solid rgba(13,148,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 16px', boxShadow: '0 0 30px rgba(13,148,136,0.15)' }}>🦷</div>
                    </motion.div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: isDark ? '#fff' : '#0F172A', letterSpacing: 0.5, marginBottom: 4 }}>
                        Deep<span style={{ color: '#0D9488' }}>Sense</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', letterSpacing: 2, textTransform: 'uppercase' }}>AI-Powered Dental Intelligence</div>
                    <motion.div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 20, padding: '4px 12px', marginTop: 12, fontSize: 11, color: '#0D9488' }}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0D9488' }} />
                        Neural Network Active
                    </motion.div>
                </div>

                {/* ══ GOOGLE: ROLE SELECT STEP ══ */}
                {googleStep === 'role' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                                Welcome, {googleName?.split(' ')[0]}!
                            </div>
                            <div style={{ color: '#64748B', fontSize: 13 }}>
                                One more step — tell us who you are
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && <motion.div style={errorStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.div>}
                        </AnimatePresence>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                            <motion.button
                                onClick={() => handleGoogleRoleSelect('dentist')}
                                style={{ padding: '18px 16px', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 14, background: 'rgba(13,148,136,0.08)', color: '#14B8A6', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                                whileHover={{ scale: 1.02, background: 'rgba(13,148,136,0.15)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span style={{ fontSize: 26 }}>👨‍⚕️</span>
                                <div>
                                    <div>I'm a Dentist</div>
                                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400, marginTop: 2 }}>Requires PMC License Number</div>
                                </div>
                            </motion.button>
                            <motion.button
                                onClick={() => handleGoogleRoleSelect('patient')}
                                style={{ padding: '18px 16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, background: 'rgba(255,255,255,0.02)', color: '#E2E8F0', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                                whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.06)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span style={{ fontSize: 26 }}>🙋</span>
                                <div>
                                    <div>I'm a Patient</div>
                                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400, marginTop: 2 }}>Book appointments & view reports</div>
                                </div>
                            </motion.button>
                        </div>

                        <button onClick={resetGoogle} style={backBtnStyle}>← Cancel</button>
                    </motion.div>
                )}

                {/* ══ GOOGLE: PMC DECLARATION STEP ══ */}
                {googleStep === 'pmc' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>🦷</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Dentist Verification</div>
                            <div style={{ color: '#64748B', fontSize: 13 }}>Enter your PMC License Number to continue</div>
                        </div>

                        <AnimatePresence>
                            {error && <motion.div style={errorStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.div>}
                        </AnimatePresence>

                        <input style={iStyle} placeholder="PMC License Number (e.g. PMC-12345)"
                            value={googlePmc} onChange={e => setGooglePmc(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleGooglePmcSubmit()}
                        />

                        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 18, marginTop: 4 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ fontSize: 16 }}>⚠️</span>
                                <div style={{ fontSize: 12, color: '#FCA5A5', lineHeight: 1.6 }}>
                                    DeepSense does not independently verify PMC license numbers at signup. By continuing, you declare that this number is valid and was issued to you by the Pakistan Medical Commission. Practicing dentistry without a valid license is illegal. Your account will show as <strong>unverified</strong> until manually reviewed.
                                </div>
                            </div>
                        </div>

                        <motion.button style={{ ...btnStyle(loading) }}
                            onClick={handleGooglePmcSubmit} disabled={loading}
                            whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 40px rgba(13,148,136,0.5)' } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                        >
                            {loading
                                ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>⚡ Creating Account...</motion.span>
                                : '✅ I Declare This Is Valid — Continue'
                            }
                        </motion.button>

                        <button onClick={() => setGoogleStep('role')} style={backBtnStyle}>← Go Back</button>
                    </motion.div>
                )}

                {/* ══ FORGOT PASSWORD — EMAIL STEP ══ */}
                {forgotStep === 'email' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Forgot Password?</div>
                            <div style={{ color: '#64748B', fontSize: 13 }}>Enter your email — we'll send a reset code</div>
                        </div>

                        <AnimatePresence>
                            {success && <motion.div style={successStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{success}</motion.div>}
                            {error && <motion.div style={errorStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.div>}
                        </AnimatePresence>

                        <input style={iStyle} type="email" placeholder="Your registered email"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleForgotSendOTP()}
                        />

                        <motion.button style={{ ...btnStyle(loading) }}
                            onClick={handleForgotSendOTP} disabled={loading}
                            whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 40px rgba(13,148,136,0.5)' } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                        >
                            {loading
                                ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>⚡ Sending...</motion.span>
                                : '📧 Send Reset Code'
                            }
                        </motion.button>

                        <button onClick={resetForgot} style={backBtnStyle}>← Back to Sign In</button>
                    </motion.div>
                )}

                {/* ══ FORGOT PASSWORD — OTP STEP ══ */}
                {forgotStep === 'otp' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>📧</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Enter Reset Code</div>
                            <div style={{ color: '#64748B', fontSize: 13 }}>
                                Code sent to <span style={{ color: '#14B8A6', fontWeight: 600 }}>{forgotEmail}</span>
                            </div>
                        </div>

                        <AnimatePresence>
                            {success && <motion.div style={successStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{success}</motion.div>}
                            {error && <motion.div style={errorStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.div>}
                        </AnimatePresence>

                        <input
                            style={{ ...iStyle, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                            placeholder="• • • • • •"
                            value={forgotOtp}
                            maxLength={6}
                            onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                            onKeyPress={e => e.key === 'Enter' && handleForgotVerifyOTP()}
                        />

                        <motion.button style={{ ...btnStyle(loading || forgotOtp.length !== 6) }}
                            onClick={handleForgotVerifyOTP}
                            disabled={loading || forgotOtp.length !== 6}
                            whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 40px rgba(13,148,136,0.5)' } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                        >
                            {loading
                                ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>⚡ Verifying...</motion.span>
                                : '✅ Verify Code'
                            }
                        </motion.button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                            <button onClick={() => { setForgotStep('email'); setError(''); setSuccess(''); }} style={backBtnStyle}>← Back</button>
                            <button onClick={() => { setForgotOtp(''); handleForgotSendOTP(); }} style={{ background: 'none', border: 'none', color: '#0D9488', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>Resend Code</button>
                        </div>
                    </motion.div>
                )}

                {/* ══ FORGOT PASSWORD — NEW PASSWORD STEP ══ */}
                {forgotStep === 'newpass' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Set New Password</div>
                            <div style={{ color: '#64748B', fontSize: 13 }}>Choose a strong new password</div>
                        </div>

                        <AnimatePresence>
                            {success && <motion.div style={successStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{success}</motion.div>}
                            {error && <motion.div style={errorStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.div>}
                        </AnimatePresence>

                        <input style={iStyle} type="password" placeholder="New Password (min 6 chars)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        /><div style={{ position: 'relative' }}>
    <input style={{ ...iStyle, paddingRight: 44 }} 
        type={showPass ? 'text' : 'password'} 
        placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleSendOTP())}
    />
    <button onClick={() => setShowPass(p => !p)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 16 }}
    >{showPass ? '🙈' : '👁️'}</button>
</div>
                        <input style={iStyle} type="password" placeholder="Confirm New Password"
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleResetPassword()}
                        />

                        <motion.button style={{ ...btnStyle(loading) }}
                            onClick={handleResetPassword} disabled={loading}
                            whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 40px rgba(13,148,136,0.5)' } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                        >
                            {loading
                                ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>⚡ Resetting...</motion.span>
                                : '🔐 Reset Password'
                            }
                        </motion.button>

                        <button onClick={resetForgot} style={backBtnStyle}>← Back to Sign In</button>
                    </motion.div>
                )}

                {/* ── OTP STEP (Register) ── */}
                {otpStep && !forgotStep && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>📧</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Check Your Email</div>
                            <div style={{ color: '#64748B', fontSize: 13 }}>
                                We sent a 6-digit code to<br/>
                                <span style={{ color: '#14B8A6', fontWeight: 600 }}>{otpEmail}</span>
                            </div>
                        </div>

                        <AnimatePresence>
                            {success && <motion.div style={successStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{success}</motion.div>}
                            {error && <motion.div style={errorStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.div>}
                        </AnimatePresence>

                        <input
                            style={{ ...iStyle, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                            placeholder="• • • • • •"
                            value={otp}
                            maxLength={6}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            onKeyPress={e => e.key === 'Enter' && handleVerifyOTP()}
                        />

                        <motion.button style={{ ...btnStyle(loading || otp.length !== 6) }}
                            onClick={handleVerifyOTP}
                            disabled={loading || otp.length !== 6}
                            whileHover={!loading ? { scale: 1.02 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                        >
                            {loading
                                ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>⚡ Verifying...</motion.span>
                                : '✅ Verify & Create Account'
                            }
                        </motion.button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                            <button onClick={() => { setOtpStep(false); setError(''); setSuccess(''); }} style={backBtnStyle}>← Go Back</button>
                            <button onClick={handleResendOTP} style={{ background: 'none', border: 'none', color: '#0D9488', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>Resend OTP</button>
                        </div>
                    </motion.div>
                )}

                {/* ── MAIN LOGIN / REGISTER ── */}
                {!otpStep && !forgotStep && !googleStep && (
                    <>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, marginBottom: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                            {['login', 'register'].map(t => (
                                <motion.button key={t} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, background: tab === t ? 'rgba(13,148,136,0.2)' : 'transparent', color: tab === t ? '#14B8A6' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
                                    onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {t === 'login' ? '🔐 Sign In' : '✨ Sign Up'}
                                </motion.button>
                            ))}
                        </div>

                        {/* Google Sign-In Button */}
                        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
                            <div ref={googleBtnRef} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                            <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>or continue with email</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            {['dentist', 'patient'].map(r => (
                                <motion.button key={r} style={{ flex: 1, padding: '11px 0', border: `1px solid ${role === r ? '#0D9488' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, background: role === r ? 'rgba(13,148,136,0.12)' : 'rgba(255,255,255,0.02)', color: role === r ? '#14B8A6' : '#475569', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}
                                    onClick={() => setRole(r)}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {r === 'dentist' ? '👨‍⚕️ Dentist' : '🙋 Patient'}
                                </motion.button>
                            ))}
                        </div>

                        <AnimatePresence>
                            {success && <motion.div style={successStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{success}</motion.div>}
                            {error && <motion.div style={errorStyle} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>⚠️ {error}</motion.div>}
                        </AnimatePresence>

                        <AnimatePresence>
                            {tab === 'register' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <input style={iStyle} placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {tab === 'register' && role === 'dentist' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <input style={{ ...iStyle, borderColor: licenseNumber ? 'rgba(13,148,136,0.5)' : 'rgba(255,255,255,0.07)' }}
                                        placeholder="PMC License Number"
                                        value={licenseNumber}
                                        onChange={e => setLicense(e.target.value)}
                                    />
                                    <input style={iStyle}
                                        placeholder="WhatsApp / Phone Number (e.g. 03001234567)"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <input style={iStyle} type="email" placeholder="Email address"
                            value={email} onChange={e => setEmail(e.target.value)} />
                        <div style={{ position: 'relative' }}>
    <input style={{ ...iStyle, paddingRight: 44 }} 
        type={showPass ? 'text' : 'password'} 
        placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleSendOTP())}
    />
    <button onClick={() => setShowPass(p => !p)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 16 }}
    >{showPass ? '🙈' : '👁️'}</button>
</div>

                        {/* Forgot Password Link — sirf login tab mein */}
                        {tab === 'login' && (
                            <div style={{ textAlign: 'right', marginBottom: 8, marginTop: -4 }}>
                                <button
                                    onClick={() => { setForgotStep('email'); setError(''); setSuccess(''); setForgotEmail(email); }}
                                    style={{ background: 'none', border: 'none', color: '#0D9488', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <motion.button style={{ ...btnStyle(loading) }}
                            onClick={tab === 'login' ? handleLogin : handleSendOTP}
                            disabled={loading}
                            whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 40px rgba(13,148,136,0.5)' } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                        >
                            {loading
                                ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>⚡ Processing...</motion.span>
                                : tab === 'login' ? '🔐 Sign In to DeepSense' : '📧 Send Verification Code'
                            }
                        </motion.button>

                        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: isDark ? '#334155' : '#64748B' }}>
                            Protected by AI Security • HIPAA Compliant
                        </div>
                    </>
                )}
            </motion.div>

            {/* Policies Trigger Button */}
            <div style={{ marginTop: 28, textAlign: 'center', zIndex: 10 }}>
                <PolicyButton onClick={() => setPolicyOpen(true)} />
            </div>

            <PolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
        </div>
    );
}

const iStyle = {
    width: '100%', padding: '13px 16px', marginBottom: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, fontSize: 14, color: '#E2E8F0',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
};

const btnStyle = (disabled) => ({
    width: '100%', padding: '15px 0', marginTop: 8,
    background: disabled ? 'rgba(13,148,136,0.3)' : 'linear-gradient(135deg, #0D9488 0%, #0891B2 100%)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    boxShadow: disabled ? 'none' : '0 8px 32px rgba(13,148,136,0.35)',
});

const backBtnStyle = {
    background: 'none', border: 'none', color: '#64748B',
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
    marginTop: 16, display: 'block',
};

const successStyle = {
    background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)',
    color: '#14B8A6', padding: '10px 14px', borderRadius: 10,
    fontSize: 13, marginBottom: 16,
};

const errorStyle = {
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
    color: '#FCA5A5', padding: '10px 14px', borderRadius: 10,
    fontSize: 13, marginBottom: 16,
};