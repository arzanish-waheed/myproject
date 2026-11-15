import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function BrightnessWidget() {
    const { isDark, brightness, setBrightness, resetBrightness } = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <div style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 9990 }}>
            {/* Toggle Handle / Tab */}
            <motion.button
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.08, x: -3 }}
                whileTap={{ scale: 0.95 }}
                title="Adjust Screen Brightness"
                style={{
                    background: isDark ? 'rgba(15, 25, 45, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(13, 148, 136, 0.3)',
                    borderRight: 'none',
                    borderTopLeftRadius: 14,
                    borderBottomLeftRadius: 14,
                    padding: '10px 8px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <span style={{ fontSize: 18 }}>🔆</span>
                <span style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: isDark ? '#94A3B8' : '#475569',
                    textTransform: 'uppercase',
                }}>
                    {brightness !== 100 ? `${brightness}%` : 'Light'}
                </span>
            </motion.button>

            {/* Sliding Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        style={{
                            position: 'absolute',
                            right: 48,
                            top: -90,
                            width: 240,
                            background: isDark ? 'rgba(10, 18, 35, 0.97)' : 'rgba(255, 255, 255, 0.98)',
                            border: '1px solid rgba(13, 148, 136, 0.28)',
                            borderRadius: 16,
                            padding: '18px 20px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 18 }}>🔆</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#fff' : '#0F172A' }}>
                                    Brightness
                                </span>
                            </div>
                            <span style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: '#14B8A6',
                                background: 'rgba(13, 148, 136, 0.12)',
                                padding: '2px 8px',
                                borderRadius: 12,
                            }}>
                                {brightness}%
                            </span>
                        </div>

                        {/* Slider Bar */}
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginBottom: 6 }}>
                                <span>60% (Dim)</span>
                                <span>100%</span>
                                <span>140% (Max)</span>
                            </div>
                            <input
                                type="range"
                                min="60"
                                max="140"
                                step="2"
                                value={brightness}
                                onChange={e => setBrightness(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    accentColor: '#0D9488',
                                    cursor: 'pointer',
                                    height: 6,
                                    borderRadius: 3,
                                }}
                            />
                        </div>

                        {/* Presets */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                            {[
                                { label: '🌙 Dim', val: 75 },
                                { label: '⚖️ Normal', val: 100 },
                                { label: '☀️ Bright', val: 125 },
                            ].map(p => (
                                <button
                                    key={p.val}
                                    onClick={() => setBrightness(p.val)}
                                    style={{
                                        padding: '6px 4px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        borderRadius: 8,
                                        border: brightness === p.val ? '1px solid #0D9488' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                                        background: brightness === p.val ? 'rgba(13,148,136,0.18)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                        color: brightness === p.val ? '#14B8A6' : (isDark ? '#E2E8F0' : '#334155'),
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Reset / Close Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
                            <button
                                onClick={resetBrightness}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    padding: '4px 6px',
                                }}
                                onMouseEnter={e => e.target.style.color = '#0D9488'}
                                onMouseLeave={e => e.target.style.color = '#64748B'}
                            >
                                ↺ Reset (100%)
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    padding: '4px 6px',
                                }}
                            >
                                Done ✕
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

