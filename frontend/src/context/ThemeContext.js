import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext();

// Default custom colors
const DEFAULT_CUSTOM_COLORS = {
  primaryColor: '#4f46e5',
  bgColor: '#f0f4ff',
  cardBg: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  sidebarBg: '#1e293b',
  accentColor: '#7c3aed',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [customColors, setCustomColors] = useState(() => {
    const saved = localStorage.getItem('customColors');
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_COLORS;
  });

  // Apply custom CSS variables when custom theme is active
  const applyCustomColors = useCallback((colors) => {
    const root = document.documentElement;
    // Helper to lighten/darken hex color
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const adjustBrightness = (hex, amount) => {
      const { r, g, b } = hexToRgb(hex);
      const clamp = (v) => Math.max(0, Math.min(255, v));
      return `#${clamp(r + amount).toString(16).padStart(2, '0')}${clamp(g + amount).toString(16).padStart(2, '0')}${clamp(b + amount).toString(16).padStart(2, '0')}`;
    };

    root.style.setProperty('--primary-color', colors.primaryColor);
    root.style.setProperty('--secondary-color', colors.accentColor);
    root.style.setProperty('--light-bg', colors.bgColor);
    root.style.setProperty('--card-bg', colors.cardBg);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);

    // Derived colors
    const { r, g, b } = hexToRgb(colors.bgColor);
    const isDarkBg = (r * 0.299 + g * 0.587 + b * 0.114) < 128;
    root.style.setProperty('--border-color', isDarkBg ? adjustBrightness(colors.bgColor, 40) : adjustBrightness(colors.bgColor, -30));
    root.style.setProperty('--hover-bg', isDarkBg ? adjustBrightness(colors.bgColor, 30) : adjustBrightness(colors.bgColor, -20));
    root.style.setProperty('--input-bg', colors.cardBg);
    root.style.setProperty('--dark-bg', colors.sidebarBg);

    if (isDarkBg) {
      root.style.setProperty('--shadow', '0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px 0 rgba(0,0,0,0.2)');
      root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.2)');
      root.style.setProperty('--modal-overlay', 'rgba(0,0,0,0.7)');
    } else {
      root.style.setProperty('--shadow', '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)');
      root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)');
      root.style.setProperty('--modal-overlay', 'rgba(0,0,0,0.5)');
    }
  }, []);

  const clearCustomStyles = useCallback(() => {
    const root = document.documentElement;
    const props = ['--primary-color','--secondary-color','--light-bg','--card-bg','--text-primary','--text-secondary','--border-color','--hover-bg','--input-bg','--dark-bg','--shadow','--shadow-lg','--modal-overlay'];
    props.forEach(p => root.style.removeProperty(p));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (theme === 'custom') {
      applyCustomColors(customColors);
    } else {
      clearCustomStyles();
    }
  }, [theme, customColors, applyCustomColors, clearCustomStyles]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'custom';
      return 'light';
    });
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  const setCustomTheme = () => setTheme('custom');

  const updateCustomColor = (key, value) => {
    setCustomColors(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('customColors', JSON.stringify(updated));
      if (theme === 'custom') {
        applyCustomColors(updated);
      }
      return updated;
    });
  };

  const resetCustomColors = () => {
    setCustomColors(DEFAULT_CUSTOM_COLORS);
    localStorage.setItem('customColors', JSON.stringify(DEFAULT_CUSTOM_COLORS));
    if (theme === 'custom') {
      applyCustomColors(DEFAULT_CUSTOM_COLORS);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme, setLightTheme, setDarkTheme, setCustomTheme,
      customColors, updateCustomColor, resetCustomColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
