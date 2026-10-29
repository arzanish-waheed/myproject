import React, { useCallback } from 'react';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '../context/ThemeContext';

export default function AnimatedBG() {
    const { isDark } = useTheme();

    const init = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    return (
        <>
            <Particles
                key={isDark ? 'animatedbg-dark' : 'animatedbg-light'}
                id="bg-particles"
                init={init}
                style={{ position: 'fixed', inset: 0, zIndex: 0 }}
                options={{
                    background: { color: { value: 'transparent' } },
                    fpsLimit: 50,
                    particles: {
                        number: { value: 50 },
                        color: { value: isDark ? ['#0D9488', '#0891B2'] : ['#0D9488', '#0284C7', '#0F766E'] },
                        links: {
                            enable: true,
                            color: isDark ? '#0D9488' : '#0284C7',
                            opacity: isDark ? 0.08 : 0.28,
                            distance: 140,
                            width: 1.2,
                        },
                        move: { enable: true, speed: 0.5 },
                        opacity: { value: isDark ? { min: 0.06, max: 0.3 } : { min: 0.35, max: 0.7 } },
                        size: { value: isDark ? { min: 1, max: 2.5 } : { min: 1.8, max: 3.5 } },
                    },
                    interactivity: {
                        events: { onHover: { enable: true, mode: 'grab' } },
                        modes: { grab: { distance: 140, links: { opacity: isDark ? 0.25 : 0.5 } } }
                    }
                }}
            />
            {/* Glow orbs */}
            <div
                style={{
                    position: 'fixed', top: '12%', left: '8%', width: 520, height: 520, borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, rgba(14,165,233,0.12) 40%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0
                }}
            />
            <div
                style={{
                    position: 'fixed', bottom: '12%', right: '8%', width: 440, height: 440, borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(8,145,178,0.06) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(6,182,212,0.20) 0%, rgba(13,148,136,0.10) 40%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0
                }}
            />
        </>
    );
}