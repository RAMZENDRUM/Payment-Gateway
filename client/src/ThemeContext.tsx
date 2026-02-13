import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('zenwallet-theme');
        return (saved as Theme) || 'dark';
    });
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('zenwallet-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setIsTransitioning(true);
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
        setTimeout(() => setIsTransitioning(false), 1000);
    };

    const setTheme = (newTheme: Theme) => {
        if (newTheme === theme) return;
        setIsTransitioning(true);
        setThemeState(newTheme);
        setTimeout(() => setIsTransitioning(false), 1000);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
