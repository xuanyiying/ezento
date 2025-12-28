import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the theme settings interface
export interface ThemeSettings {
    darkMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reducedMotion: boolean;
    // User preferences
    preferredSection?: string;
    quickActions: string[];
}

// Define the theme context interface
interface ThemeContextType {
    settings: ThemeSettings;
    toggleDarkMode: () => void;
    setFontSize: (size: 'small' | 'medium' | 'large') => void;
    toggleHighContrast: () => void;
    toggleReducedMotion: () => void;
    setPreferredSection: (section: string) => void;
    addQuickAction: (action: string) => void;
    removeQuickAction: (action: string) => void;
}

// Create the theme context with default values
const ThemeContext = createContext<ThemeContextType>({
    settings: {
        darkMode: false,
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
        quickActions: [],
    },
    toggleDarkMode: () => {},
    setFontSize: () => {},
    toggleHighContrast: () => {},
    toggleReducedMotion: () => {},
    setPreferredSection: () => {},
    addQuickAction: () => {},
    removeQuickAction: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize state from localStorage or default values
    const [settings, setSettings] = useState<ThemeSettings>(() => {
        const savedSettings = localStorage.getItem('themeSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }

        // Check if user prefers dark mode
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        return {
            darkMode: prefersDarkMode,
            fontSize: 'medium',
            highContrast: false,
            reducedMotion: prefersReducedMotion,
            quickActions: [],
        };
    });

    // Update localStorage when settings change
    useEffect(() => {
        localStorage.setItem('themeSettings', JSON.stringify(settings));

        // Apply theme settings to the DOM
        document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
        document.documentElement.setAttribute('data-font-size', settings.fontSize);
        document.documentElement.setAttribute(
            'data-high-contrast',
            settings.highContrast.toString()
        );
        document.documentElement.setAttribute(
            'data-reduced-motion',
            settings.reducedMotion.toString()
        );

        // Add class for CSS styling
        if (settings.darkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }

        if (settings.highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }, [settings]);

    // Toggle dark mode
    const toggleDarkMode = () => {
        setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
    };

    // Set font size
    const setFontSize = (size: 'small' | 'medium' | 'large') => {
        setSettings(prev => ({ ...prev, fontSize: size }));
    };

    // Toggle high contrast
    const toggleHighContrast = () => {
        setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
    };

    // Toggle reduced motion
    const toggleReducedMotion = () => {
        setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
    };

    // Set preferred section
    const setPreferredSection = (section: string) => {
        setSettings(prev => ({ ...prev, preferredSection: section }));
    };

    // Add quick action
    const addQuickAction = (action: string) => {
        setSettings(prev => {
            if (prev.quickActions.includes(action)) return prev;
            return { ...prev, quickActions: [...prev.quickActions, action] };
        });
    };

    // Remove quick action
    const removeQuickAction = (action: string) => {
        setSettings(prev => ({
            ...prev,
            quickActions: prev.quickActions.filter(a => a !== action),
        }));
    };

    return (
        <ThemeContext.Provider
            value={{
                settings,
                toggleDarkMode,
                setFontSize,
                toggleHighContrast,
                toggleReducedMotion,
                setPreferredSection,
                addQuickAction,
                removeQuickAction,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
