/**
 * PageWrapper — use this as the root wrapper for every authenticated page.
 * It automatically applies the correct background from ThemeContext,
 * renders ambient background blobs, and makes particles theme-aware.
 */
import React, { useCallback } from 'react';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function PageWrapper({ children, style = {} }) {
    const { isDark } = useTheme();

    const init = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    return (
        <div
            className="ds-page-root"
            style={{
                minHeight: '100vh',
                background: isDark ? '#060B14' : 'var(--bg-primary, #F0F4F8)',
                color: isDark ? '#E2E8F0' : 'var(--text-primary, #0F172A)',
                position: 'relative',
                transition: 'background 0.3s ease, color 0.3s ease',
                ...style,
            }}
        >
            {/* Particles — theme-aware, vibrant in both modes */}
            <Particles
                key={isDark ? 'particles-dark' : 'particles-light'}
                id="tsparticles"
                init={init}
                style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
                options={{
                    background: { color: { value: 'transparent' } },
                    fpsLimit: 45,
                    particles: {
                        number: { value: 45, density: { enable: true, area: 900 } },
                        color: { value: isDark ? ['#0D9488', '#14B8A6', '#0891B2'] : ['#0D9488', '#0284C7', '#0F766E'] },
                        links: {
                            enable: true,
                            color: isDark ? '#0D9488' : '#0284C7',
                            distance: 140,
                            opacity: isDark ? 0.15 : 0.32,
                            width: 1.2,
                        },
                        move: {
                            enable: true,
                            speed: 0.5,
                            direction: 'none',
                            random: true,
                            outModes: { default: 'bounce' },
                        },
                        opacity: { value: isDark ? { min: 0.08, max: 0.35 } : { min: 0.35, max: 0.75 } },
                        shape: { type: 'circle' },
                        size: { value: isDark ? { min: 1, max: 2.5 } : { min: 1.8, max: 3.5 } },
                    },
                    interactivity: {
                        events: {
                            onHover: { enable: true, mode: 'grab' },
                            onClick:  { enable: true, mode: 'push' },
                        },
                        modes: {
                            grab: { distance: 130, links: { opacity: isDark ? 0.35 : 0.55 } },
                            push: { quantity: 2 },
                        },
                    },
                    detectRetina: false,
                }}
            />

            {/* Ambient glow blobs — clearly visible in light mode */}
            <motion.div
                style={{
                    position: 'fixed', top: '8%', left: '3%',
                    width: 560, height: 560, borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, rgba(14,165,233,0.12) 40%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0,
                }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={{
                    position: 'fixed', bottom: '8%', right: '3%',
                    width: 460, height: 460, borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(8,145,178,0.07) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(6,182,212,0.20) 0%, rgba(13,148,136,0.10) 40%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0,
                }}
                animate={{ scale: [1.12, 1, 1.12] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Page content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}
