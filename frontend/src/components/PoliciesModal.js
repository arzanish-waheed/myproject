import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export function PolicyModal({ isOpen, onClose }) {
    const { isDark } = useTheme();

    React.useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen, onClose]);

    const policies = [
        {
            icon: '🔁',
            badge: 'One-Time Plan',
            color: '#0D9488',
            title: 'One-Time Purchase Refund (1-Hour Window)',
            items: [
                { icon: '✅', text: 'Full 100% refund within <strong>1 hour</strong> of purchase — even if you have already used the service.' },
                { icon: '📧', text: 'Simply email <a href="mailto:deepsense.ai@gmail.com" style="color:#14B8A6; font-weight:600; text-decoration:none;">deepsense.ai@gmail.com</a> with your Order ID or transaction code within that 1-hour window.' },
                { icon: '❌', text: 'After 1 hour has elapsed, <strong>no refund</strong> can be issued for one-time plans regardless of usage.' },
                { icon: '⏱️', text: 'Approved refunds are processed back to your original payment method within 5–7 business days.' },
            ],
        },
        {
            icon: '📅',
            badge: 'Monthly Plan',
            color: '#0891B2',
            title: 'Monthly Subscription Refund (48-Hour Window)',
            items: [
                { icon: '✅', text: 'Monthly subscribers can request a full 100% refund within <strong>48 hours</strong> of their billing date.' },
                { icon: '📧', text: 'Email <a href="mailto:deepsense.ai@gmail.com" style="color:#14B8A6; font-weight:600; text-decoration:none;">deepsense.ai@gmail.com</a> from your registered account email with your billing date.' },
                { icon: '🔄', text: 'Your subscription will be cancelled immediately upon approved refund with zero further charges.' },
                { icon: '❌', text: 'After 48 hours from your renewal/billing date, refunds are <strong>not available</strong> for that cycle.' },
            ],
        },
    ];

    const cardBg = isDark ? '#0F1928' : '#FFFFFF';
    const textColor = isDark ? '#E2E8F0' : '#0F172A';
    const headingColor = isDark ? '#fff' : '#0F172A';
    const mutedColor = isDark ? '#94A3B8' : '#475569';
    const innerCardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    const borderColor = isDark ? 'rgba(13,148,136,0.2)' : 'rgba(13,148,136,0.25)';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                <motion.div
                    style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 24,
                        width: '100%',
                        maxWidth: 620,
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '32px 28px',
                        boxShadow: isDark
                            ? '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)'
                            : '0 25px 70px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
                        color: textColor,
                        position: 'relative',
                        fontFamily: "'Inter', sans-serif",
                    }}
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,0.12)', color: '#0D9488', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                                🛡️ DeepSense AI
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: headingColor, margin: 0 }}>
                                Refund & Usage Policies
                            </h2>
                            <p style={{ color: mutedColor, fontSize: 13, margin: '4px 0 0' }}>
                                100% fair, transparent terms for all our plans
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                border: 'none',
                                color: mutedColor,
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => (e.target.style.color = '#EF4444')}
                            onMouseLeave={(e) => (e.target.style.color = mutedColor)}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Policy Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                        {policies.map((p, i) => (
                            <div
                                key={i}
                                style={{
                                    background: innerCardBg,
                                    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
                                    borderLeft: `4px solid ${p.color}`,
                                    borderRadius: 14,
                                    padding: '18px 20px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <span style={{ fontSize: 20 }}>{p.icon}</span>
                                    <span style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}35`, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                        {p.badge}
                                    </span>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: headingColor }}>
                                        {p.title}
                                    </span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {p.items.map((item, j) => (
                                        <li key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: textColor, lineHeight: 1.5 }}>
                                            <span style={{ flexShrink: 0 }}>{item.icon}</span>
                                            <span dangerouslySetInnerHTML={{ __html: item.text }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Notice Box */}
                    <div
                        style={{
                            background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.07)',
                            border: '1px solid rgba(239,68,68,0.22)',
                            borderRadius: 12,
                            padding: '12px 16px',
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                            marginBottom: 20,
                        }}
                    >
                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                        <div style={{ fontSize: 12, color: mutedColor, lineHeight: 1.6 }}>
                            <strong style={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>Refund Request Procedure: </strong>
                            Send an email from your registered account email to <a href="mailto:deepsense.ai@gmail.com" style={{ color: '#14B8A6', fontWeight: 600, textDecoration: 'none' }}>deepsense.ai@gmail.com</a> with your Order ID. Timestamps in server logs determine the exact 1-hour or 48-hour cutoff.
                        </div>
                    </div>

                    {/* Footer Badges & Close Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 14, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: mutedColor }}>
                            <span>🔒 256-bit AES</span>
                            <span>⚕️ HIPAA Protected</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="ds-btn"
                            style={{ padding: '8px 22px', fontSize: 13 }}
                        >
                            Got It ✓
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);
}

export function PolicyButton({ onClick, label = '📜 View Refund & Usage Policies', style = {} }) {
    const { isDark } = useTheme();

    return (
        <motion.button
            onClick={onClick}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: isDark ? 'rgba(13,148,136,0.1)' : 'rgba(13,148,136,0.08)',
                border: isDark ? '1px solid rgba(13,148,136,0.25)' : '1px solid rgba(13,148,136,0.3)',
                color: '#0D9488',
                borderRadius: 20,
                padding: '8px 18px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                ...style,
            }}
            whileHover={{ scale: 1.03, background: isDark ? 'rgba(13,148,136,0.18)' : 'rgba(13,148,136,0.14)' }}
            whileTap={{ scale: 0.97 }}
        >
            {label}
        </motion.button>
    );
}
