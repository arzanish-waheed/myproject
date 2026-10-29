import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function PoliciesSection({ style = {} }) {
    const { isDark } = useTheme();

    const policies = [
        {
            icon: '🔁',
            badge: 'One-Time Plan',
            color: '#0D9488',
            title: 'One-Time Purchase Refund',
            items: [
                { icon: '✅', text: 'You may request a full refund within <strong>1 hour</strong> of purchase — even if you have used the service.' },
                { icon: '📧', text: 'Simply email us at <a href="mailto:deepsense.ai@gmail.com" style="color:#14B8A6; font-weight:600; text-decoration:none;">deepsense.ai@gmail.com</a> with your order ID within that window.' },
                { icon: '❌', text: 'After 1 hour, <strong>no refund</strong> can be issued for one-time plans regardless of usage.' },
                { icon: '⏱️', text: 'Approved refunds are credited to the original payment method within 5–7 business days.' },
            ],
        },
        {
            icon: '📅',
            badge: 'Monthly Plan',
            color: '#0891B2',
            title: 'Monthly Subscription Refund',
            items: [
                { icon: '✅', text: 'Monthly subscribers can request a full refund within <strong>48 hours</strong> of their billing date.' },
                { icon: '📧', text: 'Contact us at <a href="mailto:deepsense.ai@gmail.com" style="color:#14B8A6; font-weight:600; text-decoration:none;">deepsense.ai@gmail.com</a> with your account email and billing date.' },
                { icon: '🔄', text: 'Your subscription will be cancelled immediately upon approved refund — no further charges.' },
                { icon: '❌', text: 'After 48 hours from billing, refunds are <strong>not available</strong> for that billing cycle.' },
            ],
        },
    ];

    const cardBg = isDark ? 'rgba(15,25,45,0.75)' : 'rgba(255,255,255,0.95)';
    const textColor = isDark ? '#E2E8F0' : '#0F172A';
    const headingColor = isDark ? '#fff' : '#0F172A';
    const mutedColor = isDark ? '#94A3B8' : '#475569';
    const borderColor = isDark ? 'rgba(13,148,136,0.18)' : 'rgba(13,148,136,0.25)';

    return (
        <section
            style={{
                width: '100%',
                maxWidth: 960,
                margin: '50px auto 20px',
                position: 'relative',
                zIndex: 5,
                ...style,
            }}
        >
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.25)', borderRadius: 20, padding: '4px 14px', marginBottom: 12, fontSize: 11, color: '#0D9488', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    🛡️ DeepSense Guarantee & Refund Policies
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: headingColor, marginBottom: 8 }}>
                    Fair & Transparent Refund Policies
                </h3>
                <p style={{ color: mutedColor, fontSize: 14, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
                    Clear, transparent rules. No hidden clauses. We prioritize your satisfaction.
                </p>
            </div>

            {/* Policy Cards Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 20,
                    marginBottom: 20,
                }}
            >
                {policies.map((p, i) => (
                    <motion.div
                        key={i}
                        className="ds-glass"
                        style={{
                            background: cardBg,
                            border: `1px solid ${borderColor}`,
                            borderTop: `4px solid ${p.color}`,
                            borderRadius: 18,
                            padding: '26px 24px',
                            boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.35)' : '0 8px 30px rgba(0,0,0,0.06)',
                            transition: 'all 0.3s ease',
                        }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -3, boxShadow: isDark ? '0 16px 45px rgba(0,0,0,0.45)' : '0 14px 38px rgba(0,0,0,0.09)' }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: `${p.color}18`,
                                    border: `1px solid ${p.color}35`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 22,
                                    flexShrink: 0,
                                }}
                            >
                                {p.icon}
                            </div>
                            <div>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        background: `${p.color}15`,
                                        color: p.color,
                                        border: `1px solid ${p.color}33`,
                                        borderRadius: 14,
                                        padding: '2px 9px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        marginBottom: 4,
                                    }}
                                >
                                    {p.badge}
                                </span>
                                <div style={{ fontSize: 16, fontWeight: 700, color: headingColor }}>
                                    {p.title}
                                </div>
                            </div>
                        </div>

                        {/* List items */}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                            {p.items.map((item, j) => (
                                <li
                                    key={j}
                                    style={{
                                        display: 'flex',
                                        gap: 9,
                                        alignItems: 'flex-start',
                                        fontSize: 13,
                                        color: textColor,
                                        lineHeight: 1.55,
                                    }}
                                >
                                    <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                                    <span dangerouslySetInnerHTML={{ __html: item.text }} />
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>

            {/* Warning / Important Box */}
            <motion.div
                style={{
                    background: isDark ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.09)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 13, marginBottom: 4 }}>
                        How to Request a Refund:
                    </div>
                    <div style={{ color: mutedColor, fontSize: 12.5, lineHeight: 1.65 }}>
                        Send an email to <a href="mailto:deepsense.ai@gmail.com" style={{ color: '#14B8A6', fontWeight: 600, textDecoration: 'none' }}>deepsense.ai@gmail.com</a> from your registered account email with your Order / Transaction ID. Refund eligibility is determined strictly by the server log timestamps (within 1 hour for One-Time plans, or 48 hours for Monthly plans).
                    </div>
                </div>
            </motion.div>

            {/* Trust Footer Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 18, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: mutedColor, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>🔒</span> 256-bit AES Encrypted
                </span>
                <span style={{ fontSize: 12, color: mutedColor, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>⚕️</span> HIPAA Compliant
                </span>
                <span style={{ fontSize: 12, color: mutedColor, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>⚡</span> Instant Response & Support
                </span>
            </div>
        </section>
    );
}
