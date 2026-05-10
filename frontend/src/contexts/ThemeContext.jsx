import React, { createContext, useState, useEffect } from 'react';
import '../styles/theme.css';

// Création du contexte pour le thème
const ThemeContext = createContext();

// Définition des thèmes
export const themes = {
  dark: {
    name: 'dark',
    colors: {
      '--bg': '#1a1a1a',
      '--surface': '#2d2d2d',
      '--surface2': '#404040',
      '--border': '#555555',
      '--text': '#ffffff',
      '--text-muted': '#a0a0a0',
      '--primary': '#6366f1',
      '--accent': '#818cf8',
      '--success': '#22c55e',
      '--warning': '#f59e0b',
      '--danger': '#ef4444',
      '--info': '#3b82f6',
    },
    fontWeight: 'normal'
  },
  light: {
    name: 'light',
    colors: {
      '--bg': '#ffffff',
      '--surface': '#f8f9fa',
      '--surface2': '#e9ecef',
      '--border': '#dee2e6',
      '--text': '#000000',
      '--text-muted': '#6c757d',
      '--primary': '#6366f1',
      '--accent': '#818cf8',
      '--success': '#22c55e',
      '--warning': '#f59e0b',
      '--danger': '#ef4444',
      '--info': '#3b82f6',
    },
    fontWeight: 'bold'
  }
};

// Provider du thème
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');

  // Charger le thème depuis localStorage au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setCurrentTheme(savedTheme);
  }, []);

  // Appliquer le thème quand il change
  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    // Appliquer l'attribut data-theme
    root.setAttribute('data-theme', currentTheme);
    
    // Appliquer les couleurs CSS (fallback)
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Appliquer le poids de police pour le mode clair
    if (currentTheme === 'light') {
      root.style.setProperty('--font-weight-base', 'bold');
      // Mettre tous les textes en gras en mode clair
      document.body.style.fontWeight = 'bold';
    } else {
      root.style.setProperty('--font-weight-base', 'normal');
      document.body.style.fontWeight = 'normal';
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setCurrentTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    toggleTheme,
    isLight: currentTheme === 'light',
    isDark: currentTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook pour utiliser le thème
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
