import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { PolicyModal } from './PoliciesModal';

const allLinks = [
    { path: '/',             label: 'Dashboard',    icon: '⬡' },
    { path: '/analysis',     label: 'AI Analysis',  icon: '◈' },
    { path: '/patients',     label: 'Patients',     icon: '◉' },
    { path: '/appointments', label: 'Appointments', icon: '◷' },
    { path: '/reports',      label: 'Reports',      icon: '◧' },
    { path: '/telehealth',   label: 'Tele-Health',  icon: '◎' },
    { path: '/premium',      label: 'Premium',      icon: '👑' },
];

const patientLinks = [
    { path: '/',             label: 'Dashboard',    icon: '⬡' },
    { path: '/appointments', label: 'Appointments', icon: '◷' },
    { path: '/telehealth',   label: 'Tele-Health',  icon: '◎' },
    { path: '/premium',      label: 'Premium',      icon: '👑' },
];

export default function Navbar() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { isDark, toggleTheme } = useTheme();
    const [policyOpen, setPolicyOpen]   = useState(false);
    const [scrolled, setScrolled]       = useState(false);
    const [dropdown, setDropdown]       = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [profilePic, setProfilePic]   = useState(null);
    const [saving, setSaving]           = useState(false);
    const [saveMsg, setSaveMsg]         = useState('');
    const [pendingCount, setPendingCount] = useState(0);
    const dropdownRef = useRef(null);
    const picRef      = useRef(null);

    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const links = user.role === 'admin' ? allLinks : patientLinks;

    // Settings form
    const [form, setForm] = useState({
        full_name: user.full_name || '',
        email:     user.email     || '',
        password:  '',
    });

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (user.role === 'admin') {
            const fetchPendingCount = async () => {
                try {
                    const res = await API.get('/appointments/pending-count');
                    setPendingCount(res.data.count);
                } catch (err) {}
            };
            fetchPendingCount();
            const interval = setInterval(fetchPendingCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user.role]);

    // Dropdown bahar click pe band karo
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Profile pic local storage se load karo
    useEffect(() => {
        const saved = localStorage.getItem('profilePic');
        if (saved) setProfilePic(saved);
    }, []);

    const handlePicChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target.result;
            setProfilePic(base64);
            localStorage.setItem('profilePic', base64);
        };
        reader.readAsDataURL(f);
    };

    const handleSaveSettings = async () => {
        setSaving(true); setSaveMsg('');
        try {
            // Naam update karo locally (backend pe update route banane ki zaroorat ho toh add karo)
            const updatedUser = { ...user, full_name: form.full_name, email: form.email };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setSaveMsg('✅ Settings saved!');
            setTimeout(() => { setSaveMsg(''); setSettingsOpen(false); }, 1500);
        } catch {
            setSaveMsg('⚠️ Failed to save. Try again.');
        }
        setSaving(false);
    };

    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await API.delete('/me');
            localStorage.clear();
            navigate('/login', { replace: true });
        } catch {
            setSaveMsg('⚠️ Failed to delete account. Try again.');
            setDeleting(false);
        }
    };

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/login', { replace: true });
    };

    return (
        <>
        <motion.nav
            style={{
                ...styles.nav,
                background: scrolled
                    ? (isDark ? 'rgba(6,11,20,0.95)' : 'rgba(240,244,248,0.97)')
                    : (isDark ? 'rgba(6,11,20,0.7)' : 'rgba(240,244,248,0.75)'),
                backdropFilter: 'blur(20px)',
                boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.2)' : 'none',
                borderBottom: isDark ? '1px solid rgba(13,148,136,0.15)' : '1px solid rgba(13,148,136,0.2)',
            }}
            initial={{ y: -80 }} animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            {/* Logo */}
            <motion.div style={styles.logo} whileHover={{ scale: 1.05 }} onClick={() => navigate('/')}>
                <motion.span style={styles.logoIcon}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                >🦷</motion.span>
                <span style={{...styles.logoText, color: isDark ? '#fff' : '#0F172A'}}>DeepSense</span>
                <span style={styles.logoBadge}>AI</span>
            </motion.div>

            {/* Links */}
            <div style={styles.links}>
                {links.map((l, i) => {
                    const active = location.pathname === l.path;
                    return (
                        <motion.button key={l.path}
                            style={{ ...styles.link, color: active ? '#14B8A6' : (isDark ? '#94A3B8' : '#475569') }}
                            onClick={() => navigate(l.path)}
                            whileHover={{ color: '#14B8A6', y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                        >
                            <span style={{ marginRight: 6, fontSize: 14 }}>{l.icon}</span>
                            {l.label}
                            {l.path === '/appointments' && pendingCount > 0 && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    style={{
                                        position: 'absolute', top: -4, right: -4,
                                        width: 14, height: 14, borderRadius: '50%',
                                        background: '#EF4444', color: '#fff',
                                        fontSize: 9, fontWeight: 'bold', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                </motion.div>
                            )}
                            {active && (
                                <motion.div style={styles.activeLine}
                                    layoutId="activeLine"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Theme Toggle */}
            <motion.button
                onClick={toggleTheme}
                style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                    borderRadius: 22, cursor: 'pointer',
                    width: 52, height: 28, padding: 0,
                    display: 'flex', alignItems: 'center',
                    position: 'relative', flexShrink: 0,
                    marginRight: 12,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {/* Track */}
                <motion.div style={{
                    position: 'absolute', inset: 0, borderRadius: 22,
                    background: isDark
                        ? 'linear-gradient(135deg, #1e3a5f, #0a1628)'
                        : 'linear-gradient(135deg, #87CEEB, #FDB813)',
                    transition: 'background 0.4s ease',
                }} />
                {/* Thumb */}
                <motion.div
                    animate={{ x: isDark ? 4 : 26 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{
                        position: 'relative', zIndex: 1,
                        width: 20, height: 20, borderRadius: '50%',
                        background: isDark ? '#fff' : '#FFF',
                        boxShadow: isDark
                            ? '0 0 8px rgba(255,255,255,0.5)'
                            : '0 2px 8px rgba(253,184,19,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11,
                    }}
                >
                    {isDark ? '🌙' : '☀️'}
                </motion.div>
            </motion.button>

            {/* User Area */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
                <motion.div
                    style={styles.userArea}
                    onClick={() => setDropdown(d => !d)}
                    whileHover={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                    style={{ ...styles.userArea, cursor: 'pointer', borderRadius: 12, padding: '6px 10px', transition: 'all 0.2s' }}
                >
                    {/* Avatar */}
                    <div style={styles.avatar}>
                        {profilePic
                            ? <img src={profilePic} alt="pic" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            : <span>{user.full_name?.[0]?.toUpperCase() || 'A'}</span>
                        }
                    </div>
                    <div style={styles.userInfo}>
                        <div style={{...styles.userName, color: isDark ? '#E2E8F0' : '#0F172A'}}>{user.full_name}</div>
                        <div style={{ ...styles.userRole, color: isDark ? '#64748B' : '#64748B' }}>{user.role === 'admin' ? 'Dentist' : 'Patient'}</div>
                    </div>
                    {/* Arrow */}
                    <motion.span style={{ color: '#64748B', fontSize: 10, marginLeft: 4 }}
                        animate={{ rotate: dropdown ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >▼</motion.span>
                </motion.div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {dropdown && (
                        <motion.div
                            style={{
                                ...styles.dropdown,
                                background: isDark ? 'rgba(10,18,32,0.98)' : 'rgba(255,255,255,0.99)',
                                border: isDark ? '1px solid rgba(13,148,136,0.2)' : '1px solid rgba(13,148,136,0.25)',
                            }}
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                        >
                            {/* Profile header */}
                            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ ...styles.avatar, width: 42, height: 42, fontSize: 16 }}>
                                        {profilePic
                                            ? <img src={profilePic} alt="pic" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            : <span>{user.full_name?.[0]?.toUpperCase() || 'A'}</span>
                                        }
                                    </div>
                                    <div>
                                        <div style={{ color: isDark ? '#fff' : '#0F172A', fontWeight: 700, fontSize: 13 }}>{user.full_name}</div>
                                        <div style={{ color: '#64748B', fontSize: 11 }}>{user.email}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div style={{ padding: '8px 0' }}>
                                {/* Settings */}
                                <motion.button style={{...styles.menuItem, color: isDark ? '#94A3B8' : '#475569'}}
                                    onClick={() => { setSettingsOpen(true); setDropdown(false); }}
                                    whileHover={{ background: 'rgba(13,148,136,0.1)', color: '#14B8A6' }}
                                >
                                    <span style={{ fontSize: 15 }}>⚙️</span>
                                    <span>Profile Settings</span>
                                </motion.button>

                                {/* Change Photo */}
                                <motion.button style={{...styles.menuItem, color: isDark ? '#94A3B8' : '#475569'}}
                                    onClick={() => { picRef.current?.click(); setDropdown(false); }}
                                    whileHover={{ background: 'rgba(13,148,136,0.1)', color: '#14B8A6' }}
                                >
                                    <span style={{ fontSize: 15 }}>📷</span>
                                    <span>Change Photo</span>
                                </motion.button>

                                {/* Chat — sirf admin */}
                                {user.role === 'admin' && (
                                    <motion.button style={{...styles.menuItem, color: isDark ? '#94A3B8' : '#475569'}}
                                        onClick={() => { navigate('/chat'); setDropdown(false); }}
                                        whileHover={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}
                                    >
                                        <span style={{ fontSize: 15 }}>🤖</span>
                                        <span>AI Assistant</span>
                                    </motion.button>
                                )}

                                {/* Premium */}
                                <motion.button style={{...styles.menuItem, color: '#F59E0B'}}
                                    onClick={() => { navigate('/premium'); setDropdown(false); }}
                                    whileHover={{ background: 'rgba(245,158,11,0.1)', color: '#FBBF24' }}
                                >
                                    <span style={{ fontSize: 15 }}>👑</span>
                                    <span>Premium Membership</span>
                                </motion.button>

                                {/* Policies */}
                                <motion.button style={{...styles.menuItem, color: isDark ? '#94A3B8' : '#475569'}}
                                    onClick={() => { setPolicyOpen(true); setDropdown(false); }}
                                    whileHover={{ background: 'rgba(13,148,136,0.1)', color: '#14B8A6' }}
                                >
                                    <span style={{ fontSize: 15 }}>📜</span>
                                    <span>Refund & Policies</span>
                                </motion.button>

                                {/* Divider */}
                                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                                {/* Sign Out */}
                                <motion.button style={{ ...styles.menuItem, color: '#F87171' }}
                                    onClick={handleSignOut}
                                    whileHover={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                                >
                                    <span style={{ fontSize: 15 }}>🚪</span>
                                    <span>Sign Out</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hidden file input for profile pic */}
            <input ref={picRef} type="file" accept="image/*" onChange={handlePicChange} style={{ display: 'none' }} />
        </motion.nav>

        {/* ── Settings Modal ── */}
        <AnimatePresence>
            {settingsOpen && (
                <motion.div style={styles.overlay}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}
                >
                    <motion.div style={{
                        ...styles.modal,
                        background: isDark ? '#0F1928' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(13,148,136,0.2)' : '1px solid rgba(13,148,136,0.3)',
                    }}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div>
                                <h3 style={{ color: isDark ? '#fff' : '#0F172A', fontSize: 18, fontWeight: 700, margin: 0 }}>⚙️ Profile Settings</h3>
                                <p style={{ color: '#64748B', fontSize: 12, margin: '4px 0 0' }}>Update your account information</p>
                            </div>
                            <button onClick={() => setSettingsOpen(false)}
                                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: 'none', color: '#94A3B8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >✕</button>
                        </div>

                        {/* Profile Pic Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'rgba(13,148,136,0.06)', borderRadius: 12, border: '1px solid rgba(13,148,136,0.15)' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#0D9488,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden', flexShrink: 0 }}>
                                {profilePic
                                    ? <img src={profilePic} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span>{user.full_name?.[0]?.toUpperCase() || 'A'}</span>
                                }
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Profile Photo</div>
                                <motion.button
                                    onClick={() => picRef.current?.click()}
                                    style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#14B8A6', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                >📷 Upload Photo</motion.button>
                                {profilePic && (
                                    <button onClick={() => { setProfilePic(null); localStorage.removeItem('profilePic'); }}
                                        style={{ background: 'none', border: 'none', color: '#F87171', fontSize: 12, cursor: 'pointer', marginLeft: 8, fontFamily: 'inherit' }}
                                    >Remove</button>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Full Name</label>
                            <input
                                style={{...styles.input, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: isDark ? '#E2E8F0' : '#0F172A', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)'}}
                                value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })}
                                placeholder="Dr. Your Name"
                            />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email Address</label>
                            <input
                                style={{ ...styles.input, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: '#475569', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)' }}
                                value={form.email}
                                disabled
                                placeholder="email@example.com"
                            />
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Email cannot be changed</div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11, color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>New Password</label>
                            <input
                                style={{...styles.input, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: isDark ? '#E2E8F0' : '#0F172A', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)'}}
                                type="password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Leave blank to keep current"
                            />
                        </div>

                        {/* Role Badge */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <div style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#14B8A6', fontWeight: 600 }}>
                                {user.role === 'admin' ? '👨‍⚕️ Dentist Account' : '🙋 Patient Account'}
                            </div>
                            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#60A5FA', fontWeight: 600 }}>
                                🔒 HIPAA Protected
                            </div>
                        </div>

                        {/* Save Message */}
                        {saveMsg && (
                            <motion.div style={{ textAlign: 'center', fontSize: 13, color: saveMsg.includes('✅') ? '#10B981' : '#F87171', marginBottom: 12 }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >{saveMsg}</motion.div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <motion.button onClick={handleSaveSettings} disabled={saving}
                                style={{ flex: 1, padding: '12px 0', background: saving ? 'rgba(13,148,136,0.3)' : 'linear-gradient(135deg,#0D9488,#0891B2)', color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}
                                whileHover={!saving ? { scale: 1.01 } : {}} whileTap={!saving ? { scale: 0.99 } : {}}
                            >
                                {saving ? '⏳ Saving...' : '💾 Save Changes'}
                            </motion.button>
                            <motion.button onClick={() => setSettingsOpen(false)}
                                style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
                                whileHover={{ background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.98 }}
                            >Cancel</motion.button>
                        </div>

                        {/* Danger Zone — sirf patient ke liye, dentist ka account super admin manage karta hai */}
                        {user.role === 'patient' && (
                            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                                <div style={{ fontSize: 11, color: '#F87171', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
                                    ⚠️ Danger Zone
                                </div>
                                {!deleteConfirm ? (
                                    <button onClick={() => setDeleteConfirm(true)}
                                        style={{ width: '100%', padding: '10px 0', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}
                                    >🗑️ Delete My Account</button>
                                ) : (
                                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 14 }}>
                                        <p style={{ color: '#FCA5A5', fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                                            This will permanently delete your account, appointments, and X-ray reports. This cannot be undone.
                                        </p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <motion.button onClick={handleDeleteAccount} disabled={deleting}
                                                style={{ flex: 1, padding: '9px 0', background: deleting ? 'rgba(239,68,68,0.3)' : '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                                                whileHover={!deleting ? { scale: 1.02 } : {}} whileTap={!deleting ? { scale: 0.98 } : {}}
                                            >
                                                {deleting ? '⏳ Deleting...' : 'Yes, Delete Permanently'}
                                            </motion.button>
                                            <button onClick={() => setDeleteConfirm(false)}
                                                style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                                            >Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        <PolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
        </>
    );
}

const styles = {
    nav: {
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center',
        padding: '0 32px', height: 64,
        borderBottom: '1px solid rgba(13,148,136,0.15)',
        transition: 'background 0.3s, box-shadow 0.3s',
    },
    logo:      { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginRight: 40 },
    logoIcon:  { fontSize: 22 },
    logoText:  { fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: 0.5 },
    logoBadge: { background: 'rgba(13,148,136,0.2)', color: '#14B8A6', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(13,148,136,0.3)' },
    links:     { display: 'flex', gap: 4, flex: 1 },
    link: {
        background: 'none', border: 'none', padding: '8px 14px',
        borderRadius: 8, cursor: 'pointer', fontSize: 13,
        fontWeight: 500, position: 'relative', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center',
    },
    activeLine: {
        position: 'absolute', bottom: -2, left: 8, right: 8,
        height: 2, background: '#14B8A6', borderRadius: 2,
    },
    userArea: { display: 'flex', alignItems: 'center', gap: 10 },
    avatar: {
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg,#0D9488,#0891B2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', flexShrink: 0,
    },
    userInfo:  { display: 'flex', flexDirection: 'column' },
    userName:  { fontSize: 13, fontWeight: 600, color: '#E2E8F0' },
    userRole:  { fontSize: 10, color: '#64748B' },
    dropdown: {
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 220, background: 'rgba(10,18,32,0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(13,148,136,0.2)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        zIndex: 200,
    },
    menuItem: {
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', background: 'none', border: 'none',
        color: '#94A3B8', cursor: 'pointer', fontSize: 13,
        fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, backdropFilter: 'blur(4px)',
    },
    modal: {
        background: '#0F1928', border: '1px solid rgba(13,148,136,0.2)',
        borderRadius: 20, padding: 32, width: 460,
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        maxHeight: '90vh', overflowY: 'auto',
    },
    input: {
        width: '100%', padding: '11px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, fontSize: 14, color: '#E2E8F0',
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    },
};