import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default: dark mode
    });

    const [brightness, setBrightness] = useState(() => {
        const saved = localStorage.getItem('app_brightness');
        return saved ? Math.min(140, Math.max(60, Number(saved))) : 100;
    });

    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        localStorage.setItem('app_brightness', brightness);
        if (brightness === 100) {
            document.documentElement.style.filter = '';
        } else {
            document.documentElement.style.filter = `brightness(${brightness}%)`;
        }
    }, [brightness]);

    const toggleTheme = () => setIsDark(prev => !prev);
    const resetBrightness = () => setBrightness(100);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, brightness, setBrightness, resetBrightness }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
