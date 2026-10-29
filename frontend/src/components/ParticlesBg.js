import React, { useCallback } from 'react';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '../context/ThemeContext';

export default function ParticlesBg() {
    const { isDark } = useTheme();

    const init = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    return (
        <Particles
            key={isDark ? 'particlesbg-dark' : 'particlesbg-light'}
            id="tsparticles"
            init={init}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0, pointerEvents: 'none'
            }}
            options={{
                background: { color: { value: 'transparent' } },
                fpsLimit: 50,
                particles: {
                    number: { value: 50, density: { enable: true, area: 800 } },
                    color: { value: isDark ? ['#0D9488', '#14B8A6', '#0891B2'] : ['#0D9488', '#0284C7', '#0F766E'] },
                    links: {
                        enable: true,
                        color: isDark ? '#0D9488' : '#0284C7',
                        distance: 140,
                        opacity: isDark ? 0.15 : 0.30,
                        width: 1.2
                    },
                    move: {
                        enable: true,
                        speed: 0.6,
                        direction: 'none',
                        random: true,
                        outModes: { default: 'bounce' }
                    },
                    opacity: { value: isDark ? { min: 0.1, max: 0.4 } : { min: 0.35, max: 0.75 } },
                    shape: { type: 'circle' },
                    size: { value: isDark ? { min: 1, max: 3 } : { min: 1.8, max: 3.5 } },
                },
                interactivity: {
                    events: {
                        onHover: { enable: true, mode: 'grab' },
                        onClick: { enable: true, mode: 'push' }
                    },
                    modes: {
                        grab: { distance: 140, links: { opacity: isDark ? 0.4 : 0.6 } },
                        push: { quantity: 2 }
                    }
                },
                detectRetina: false,
            }}
        />
    );
}