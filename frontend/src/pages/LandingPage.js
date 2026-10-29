import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { PolicyModal } from '../components/PoliciesModal';

/* ─── Framer variants ─── */
const fadeUp = {
    hidden:  { opacity: 0, y: 28 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 },
    }),
};

const stagger = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Hook: viewport entry (IntersectionObserver — zero cost off-screen) ─── */
function useInView(threshold = 0.15) {
    const ref  = useRef(null);
    const [vis, setVis] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVis(true); obs.disconnect(); }
        }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, vis];
}

/* ─── Smooth counter ─── */
function AnimCounter({ end, suffix = '' }) {
    const [val, setVal] = useState(0);
    const [ref, vis]    = useInView(0.5);
    useEffect(() => {
        if (!vis) return;
        let start = 0;
        const isNum = !isNaN(parseInt(end));
        if (!isNum) { setVal(end); return; }
        const target = parseInt(end);
        const step   = Math.max(1, Math.floor(target / 40));
        const timer  = setInterval(() => {
            start += step;
            if (start >= target) { setVal(target); clearInterval(timer); }
            else setVal(start);
        }, 30);
        return () => clearInterval(timer);
    }, [vis, end]);
    return <span ref={ref}>{typeof val === 'number' ? val + suffix : val}</span>;
}

export default function LandingPage() {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [policyOpen, setPolicyOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const initParticles = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    const features = [
        { icon: '🧠', title: 'AI X-Ray Analysis',      desc: 'Deep learning detects 8 dental conditions — Caries, Bone Loss, Fractures & more — with 90%+ accuracy instantly.' },
        { icon: '📋', title: 'Smart NLP Reports',       desc: 'Auto-generated clinical reports for every scan — detailed, accurate, and ready in seconds.' },
        { icon: '📅', title: 'Appointment Management',  desc: 'Seamlessly book & manage patient appointments with real-time scheduling and reminders.' },
        { icon: '💻', title: 'Tele-Health',             desc: 'Remote dentist–patient consultations via high-quality video — care without borders.' },
        { icon: '🔒', title: 'HIPAA Compliant',         desc: 'Enterprise-grade encryption ensuring patient data privacy and full HIPAA compliance.' },
        { icon: '📊', title: 'Live Dashboard',           desc: 'Real-time stats — monitor patients, reports, and appointments at a single glance.' },
    ];

    const stats = [
        { value: '10',  suffix: 's', label: 'Avg. Analysis Time',  icon: '⚡' },
        { value: '90',  suffix: '%', label: 'Detection Accuracy',  icon: '🎯' },
        { value: '100', suffix: '%', label: 'Cloud Backed',        icon: '☁️' },
        { value: '8',   suffix: '',  label: 'Conditions Detected', icon: '🔬' },
    ];

    const policies = [
        {
            icon:  '🔁',
            badge: 'One-Time Plan',
            color: '#0D9488',
            title: 'One-Time Purchase Refund',
            items: [
                { icon: '✅', text: 'You may request a full refund within <strong>1 hour</strong> of purchase — even if you have used the service.' },
                { icon: '📧', text: 'Simply email us at <a href="mailto:deepsense.ai@gmail.com" style="color:#14B8A6">deepsense.ai@gmail.com</a> with your order ID within that window.' },
                { icon: '❌', text: 'After 1 hour, <strong>no refund</strong> can be issued for one-time plans regardless of usage.' },
                { icon: '⏱️', text: 'Approved refunds are processed within 5–7 business days to the original payment method.' },
            ],
        },
        {
            icon:  '📅',
            badge: 'Monthly Plan',
            color: '#0891B2',
            title: 'Monthly Subscription Refund',
            items: [
                { icon: '✅', text: 'Monthly subscribers can request a full refund within <strong>48 hours</strong> of their billing date.' },
                { icon: '📧', text: 'Contact us at <a href="mailto:deepsense.ai@gmail.com" style="color:#14B8A6">deepsense.ai@gmail.com</a> with your account email and billing date.' },
                { icon: '🔄', text: 'Your subscription will be cancelled immediately upon approved refund — no further charges.' },
                { icon: '❌', text: 'After 48 hours from billing, refunds are <strong>not available</strong> for that billing cycle.' },
            ],
        },
    ];

    const faqs = [
        { q: 'How do I request a refund?', a: 'Email deepsense.ai@gmail.com from your registered email with your Order ID or subscription details. Our support team responds within 2 business hours.' },
        { q: 'Can I switch from one-time to monthly?', a: 'Yes — contact us and we\'ll credit the one-time payment towards your first month\'s subscription if requested within 24 hours.' },
        { q: 'Is my patient data secure?', a: 'Absolutely. DeepSense is HIPAA compliant. All data is encrypted in-transit and at-rest using AES-256. We never share patient data.' },
        { q: 'What if the AI gives an incorrect diagnosis?', a: 'Our AI is a clinical decision-support tool, not a replacement for professional judgement. Always review results with a qualified dentist.' },
    ];

    const textColor = isDark ? '#E2E8F0' : '#0F172A';
    const headingColor = isDark ? '#fff' : '#0F172A';
    const mutedColor = isDark ? '#94A3B8' : '#475569';

    return (
        <div
            className="ds-page-root"
            style={{
                background: isDark ? '#060B14' : 'var(--bg-primary, #F0F4F8)',
                minHeight: '100vh',
                fontFamily: "'Inter', sans-serif",
                color: textColor,
                overflowX: 'hidden',
                transition: 'background 0.3s ease, color 0.3s ease'
            }}
        >
            {/* Particles — theme aware and highly visible in light mode */}
            <Particles
                key={isDark ? 'landing-dark' : 'landing-light'}
                id="landing-particles"
                init={initParticles}
                style={{ position: 'fixed', inset: 0, zIndex: 0 }}
                options={{
                    background: { color: { value: 'transparent' } },
                    fpsLimit: 45,
                    particles: {
                        number:  { value: 45 },
                        color:   { value: isDark ? ['#0D9488', '#0891B2'] : ['#0D9488', '#0284C7', '#0F766E'] },
                        links:   {
                            enable: true,
                            color: isDark ? '#0D9488' : '#0284C7',
                            opacity: isDark ? 0.08 : 0.30,
                            distance: 135,
                            width: 1.2
                        },
                        move:    { enable: true, speed: 0.4 },
                        opacity: { value: isDark ? { min: 0.06, max: 0.3 } : { min: 0.35, max: 0.75 } },
                        size:    { value: isDark ? { min: 1, max: 2.5 } : { min: 1.8, max: 3.5 } },
                    },
                    interactivity: {
                        events:  { onHover: { enable: true, mode: 'grab' } },
                        modes:   { grab: { distance: 130, links: { opacity: isDark ? 0.25 : 0.5 } } },
                    },
                    detectRetina: false,
                }}
            />

            {/* Ambient blobs — clearly visible soft glow */}
            <motion.div
                style={{
                    position: 'fixed', top: '8%', left: '4%', width: 580, height: 580, borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, rgba(14,165,233,0.12) 40%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 1
                }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={{
                    position: 'fixed', bottom: '8%', right: '4%', width: 480, height: 480, borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(8,145,178,0.06) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(6,182,212,0.20) 0%, rgba(13,148,136,0.10) 40%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 1
                }}
                animate={{ scale: [1.15, 1, 1.15] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* ── Navbar ── */}
            <motion.nav
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 60px', height: 70,
                    background: isDark ? 'rgba(6,11,20,0.88)' : 'rgba(240,244,248,0.92)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: isDark ? '1px solid rgba(13,148,136,0.12)' : '1px solid rgba(13,148,136,0.25)',
                    transition: 'background 0.3s ease, border-color 0.3s ease'
                }}
                initial={{ y: -70 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <motion.span style={{ fontSize: 26 }} animate={{ rotate: [0,12,-12,0] }} transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5 }}>🦷</motion.span>
                    <span style={{ fontWeight: 800, fontSize: 20, color: headingColor }}>Deep<span style={{ color: '#0D9488' }}>Sense</span></span>
                    <span style={{ background: 'rgba(13,148,136,0.18)', color: '#14B8A6', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(13,148,136,0.3)' }}>AI</span>
                </div>
                <div style={{ display: 'flex', gap: 32 }}>
                    {['Features', 'Stats', 'Policies', 'Contact'].map((item) => (
                        <motion.a key={item} href={`#${item.toLowerCase()}`}
                            style={{ color: mutedColor, textDecoration: 'none', fontSize: 14, fontWeight: 500, position: 'relative' }}
                            whileHover={{ color: '#14B8A6' }}
                            transition={{ duration: 0.15 }}
                        >
                            {item}
                        </motion.a>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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

                    <motion.button
                        className="ds-btn"
                        style={{ padding: '9px 22px', fontSize: 14 }}
                        onClick={() => navigate('/login')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        Login →
                    </motion.button>
                </div>
            </motion.nav>

            {/* ── Hero ── */}
            <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 40px', position: 'relative', zIndex: 2 }}>
                <div>
                    {/* Live badge */}
                    <motion.div
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)', borderRadius: 20, padding: '6px 16px', marginBottom: 32, fontSize: 13, color: '#0D9488' }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    >
                        <div className="ds-dot-pulse" />
                        AI-Powered Dental Intelligence Platform
                    </motion.div>

                    <motion.h1
                        style={{ fontSize: 'clamp(42px, 7vw, 78px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 24, color: headingColor, letterSpacing: '-0.02em' }}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22,1,0.36,1] }}
                    >
                        The Future of<br />
                        <span className="ds-gradient-text">Dental Diagnosis</span>
                    </motion.h1>

                    <motion.p
                        style={{ fontSize: 18, color: mutedColor, maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.75 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
                    >
                        DeepSense uses cutting-edge AI to analyze dental X-rays, detect conditions with <strong style={{ color: '#14B8A6' }}>90%+ accuracy</strong>, and generate instant clinical reports — empowering dentists to deliver better care.
                    </motion.p>

                    <motion.div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                    >
                        <motion.button
                            className="ds-btn"
                            style={{ padding: '16px 38px', fontSize: 16, boxShadow: '0 8px 32px rgba(13,148,136,0.35)' }}
                            onClick={() => navigate('/login')}
                            whileHover={{ scale: 1.05, boxShadow: '0 14px 44px rgba(13,148,136,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                        >
                            🚀 Get Started
                        </motion.button>
                        <motion.button
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                color: textColor,
                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
                                padding: '16px 38px', borderRadius: 12, cursor: 'pointer',
                                fontSize: 16, fontWeight: 600, fontFamily: 'inherit', backdropFilter: 'blur(8px)'
                            }}
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Learn More ↓
                        </motion.button>
                    </motion.div>

                    {/* Floating decorative icons */}
                    {mounted && ['🦷','🔬','🧬','💊','⚕️'].map((icon, i) => (
                        <motion.div key={i}
                            style={{ position: 'absolute', fontSize: 26, opacity: isDark ? 0.09 : 0.16, left: `${7 + i * 19}%`, top: `${22 + (i % 2) * 32}%`, pointerEvents: 'none' }}
                            animate={{ y: [-16, 16, -16], rotate: [-6, 6, -6] }}
                            transition={{ duration: 5.5 + i * 0.8, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}
                        >{icon}</motion.div>
                    ))}
                </div>
            </section>

            <hr className="ds-divider" />

            {/* ── Stats ── */}
            <section id="stats" style={{ padding: '90px 60px', position: 'relative', zIndex: 2 }}>
                <motion.div style={{ textAlign: 'center', marginBottom: 56 }}
                    variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    <div style={{ fontSize: 12, color: '#0D9488', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>By The Numbers</div>
                    <h2 style={{ fontSize: 38, fontWeight: 800, color: headingColor }}>Proven Performance</h2>
                </motion.div>
                <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}
                    variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    {stats.map((s, i) => (
                        <motion.div key={i} className="ds-glass ds-hover-lift"
                            style={{ padding: '36px 20px', textAlign: 'center' }}
                            variants={fadeUp} custom={i}
                        >
                            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                            <div style={{ fontSize: 40, fontWeight: 900, color: '#14B8A6', marginBottom: 6, lineHeight: 1 }}>
                                <AnimCounter end={s.value} suffix={s.suffix} />
                            </div>
                            <div style={{ fontSize: 13, color: mutedColor, fontWeight: 500 }}>{s.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            <hr className="ds-divider" />

            {/* ── Features ── */}
            <section id="features" style={{ padding: '90px 60px', position: 'relative', zIndex: 2 }}>
                <motion.div style={{ textAlign: 'center', marginBottom: 64 }}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    <div style={{ fontSize: 12, color: '#0D9488', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>What We Offer</div>
                    <h2 style={{ fontSize: 42, fontWeight: 800, color: headingColor, marginBottom: 14 }}>Powerful Features</h2>
                    <p style={{ color: mutedColor, fontSize: 16, maxWidth: 520, margin: '0 auto' }}>Everything a modern dental practice needs, powered by artificial intelligence.</p>
                </motion.div>
                <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}
                    variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    {features.map((f, i) => (
                        <motion.div key={i} className="ds-glass ds-hover-lift" style={{ padding: 30 }} variants={fadeUp} custom={i}>
                            <motion.div style={{ fontSize: 38, marginBottom: 16, display: 'inline-block' }}
                                whileHover={{ scale: 1.2, rotate: 8 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >{f.icon}</motion.div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: headingColor, marginBottom: 10 }}>{f.title}</div>
                            <div style={{ fontSize: 14, color: mutedColor, lineHeight: 1.7 }}>{f.desc}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            <hr className="ds-divider" />

            {/* ── Policies & Refunds ── */}
            <section id="policies" style={{ padding: '90px 60px', position: 'relative', zIndex: 2 }}>
                <motion.div style={{ textAlign: 'center', marginBottom: 64 }}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    <div style={{ fontSize: 12, color: '#0D9488', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Transparency First</div>
                    <h2 style={{ fontSize: 42, fontWeight: 800, color: headingColor, marginBottom: 14 }}>Refund & Usage Policies</h2>
                    <p style={{ color: mutedColor, fontSize: 16, maxWidth: 560, margin: '0 auto' }}>We believe in fair and transparent policies. Here is exactly what you are entitled to.</p>
                </motion.div>

                {/* Policy Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, maxWidth: 980, margin: '0 auto 60px' }}>
                    {policies.map((p, i) => (
                        <motion.div key={i} className="ds-glass ds-hover-lift"
                            style={{ padding: 32, borderTop: `3px solid ${p.color}` }}
                            variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${p.color}18`, border: `1px solid ${p.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                    {p.icon}
                                </div>
                                <div>
                                    <span className="ds-policy-tag" style={{ marginBottom: 6, display: 'inline-flex', color: p.color, borderColor: `${p.color}44`, background: `${p.color}12` }}>{p.badge}</span>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: headingColor, lineHeight: 1.3 }}>{p.title}</div>
                                </div>
                            </div>
                            {/* Items */}
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {p.items.map((item, j) => (
                                    <motion.li key={j}
                                        style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: mutedColor, lineHeight: 1.65 }}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: j * 0.07 + 0.1, ease: [0.22,1,0.36,1] }}
                                        viewport={{ once: true }}
                                    >
                                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.text }} />
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* General policy note */}
                <motion.div
                    style={{
                        background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.22)',
                        borderRadius: 14, padding: '20px 28px', maxWidth: 980, margin: '0 auto 60px',
                        display: 'flex', gap: 14, alignItems: 'flex-start'
                    }}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: 700, color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 14, marginBottom: 5 }}>Important Notice</div>
                        <div style={{ color: mutedColor, fontSize: 13, lineHeight: 1.7 }}>
                            All refund requests must be submitted via email to <a href="mailto:deepsense.ai@gmail.com" style={{ color: '#14B8A6', textDecoration: 'none' }}>deepsense.ai@gmail.com</a> with your registered email address and order/subscription ID. Refund eligibility is determined solely by the timestamps on our server logs. DeepSense reserves the right to deny refunds in cases of policy abuse.
                        </div>
                    </div>
                </motion.div>

                {/* FAQ */}
                <motion.div style={{ maxWidth: 720, margin: '0 auto' }} variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <div style={{ fontSize: 12, color: '#0D9488', letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 32 }}>FAQs</div>
                    {faqs.map((faq, i) => (
                        <FaqItem key={i} faq={faq} i={i} isDark={isDark} />
                    ))}
                </motion.div>
            </section>

            <hr className="ds-divider" />

            {/* ── Contact ── */}
            <section id="contact" style={{ padding: '90px 60px', position: 'relative', zIndex: 2 }}>
                <motion.div
                    className="ds-glass"
                    style={{ padding: '64px 48px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    <div style={{ fontSize: 12, color: '#0D9488', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Contact Us</div>
                    <h2 style={{ fontSize: 38, fontWeight: 800, color: headingColor, marginBottom: 14 }}>Get In Touch</h2>
                    <p style={{ color: mutedColor, marginBottom: 36, fontSize: 15 }}>Questions about DeepSense? We respond within 2 business hours.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 440, margin: '0 auto' }}>
                        <input placeholder="Your Name" style={getInputStyle(isDark)} />
                        <input placeholder="Email Address" type="email" style={getInputStyle(isDark)} />
                        <textarea placeholder="Your Message" rows={4} style={{ ...getInputStyle(isDark), resize: 'none' }} />
                        <motion.button
                            className="ds-btn"
                            style={{ padding: '14px', fontSize: 15, width: '100%' }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Send Message 📩
                        </motion.button>
                    </div>
                    <div style={{ marginTop: 28, fontSize: 13, color: mutedColor, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <span>📧</span>
                        <a href="mailto:deepsense.ai@gmail.com" style={{ color: '#14B8A6', textDecoration: 'none', fontWeight: 500 }}>deepsense.ai@gmail.com</a>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ borderTop: isDark ? '1px solid rgba(13,148,136,0.1)' : '1px solid rgba(13,148,136,0.2)', padding: '36px 60px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>🦷</span>
                        <span style={{ fontWeight: 800, color: headingColor }}>Deep<span style={{ color: '#0D9488' }}>Sense</span></span>
                        <span style={{ background: 'rgba(13,148,136,0.15)', color: '#14B8A6', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>AI</span>
                    </div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        {['Features','Stats','Contact'].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: mutedColor, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#14B8A6'}
                                onMouseLeave={e => e.target.style.color = mutedColor}
                            >{item}</a>
                        ))}
                        <button
                            onClick={() => setPolicyOpen(true)}
                            style={{
                                background: 'none', border: 'none', padding: 0,
                                color: mutedColor, fontSize: 13, cursor: 'pointer',
                                fontFamily: 'inherit', transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.color = '#14B8A6'}
                            onMouseLeave={e => e.target.style.color = mutedColor}
                        >Policies</button>
                    </div>
                    <div style={{ fontSize: 12, color: mutedColor }}>© 2026 DeepSense AI. All rights reserved.</div>
                </div>
            </footer>

            <PolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />

        </div>
    );
}

/* ─── Accordion FAQ Item ─── */
function FaqItem({ faq, i, isDark }) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            style={{
                marginBottom: 12,
                background: isDark ? 'rgba(15,25,45,0.7)' : 'rgba(255,255,255,0.92)',
                border: `1px solid ${open ? 'rgba(13,148,136,0.35)' : (isDark ? 'rgba(13,148,136,0.12)' : 'rgba(13,148,136,0.22)')}`,
                borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.25s, background 0.3s ease',
                boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.04)'
            }}
            variants={fadeUp} custom={i}
        >
            <button onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer',
                    color: isDark ? '#E2E8F0' : '#0F172A', fontSize: 15, fontWeight: 600,
                    fontFamily: 'inherit', textAlign: 'left', gap: 12
                }}
            >
                <span>{faq.q}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }} style={{ color: '#0D9488', fontSize: 18, flexShrink: 0 }}>⌄</motion.span>
            </button>
            <motion.div
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.32, ease: [0.22,1,0.36,1] }}
                style={{ overflow: 'hidden' }}
            >
                <div style={{ padding: '0 22px 20px', fontSize: 14, color: isDark ? '#94A3B8' : '#475569', lineHeight: 1.75 }}>{faq.a}</div>
            </motion.div>
        </motion.div>
    );
}

function getInputStyle(isDark) {
    return {
        width: '100%', padding: '13px 16px',
        background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.12)',
        borderRadius: 10, fontSize: 14, color: isDark ? '#E2E8F0' : '#0F172A',
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'border-color 0.2s, background 0.3s ease',
    };
}