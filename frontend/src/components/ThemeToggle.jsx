import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { currentTheme, toggleTheme, isLight } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        border: `2px solid ${isLight ? '#dee2e6' : '#555555'}`,
        borderRadius: '8px',
        background: isLight ? '#f8f9fa' : '#2d2d2d',
        color: isLight ? '#000000' : '#ffffff',
        cursor: 'pointer',
        fontWeight: isLight ? 'bold' : 'normal',
        fontSize: '14px',
        transition: 'all 0.3s ease',
        boxShadow: isLight 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : '0 2px 4px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = isLight 
          ? '0 4px 8px rgba(0,0,0,0.15)' 
          : '0 4px 8px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = isLight 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : '0 2px 4px rgba(0,0,0,0.3)';
      }}
      title={`Passer en mode ${isLight ? 'sombre' : 'clair'}`}
    >
      {isLight ? (
        <>
          <Sun size={18} />
          <span>Mode Clair</span>
        </>
      ) : (
        <>
          <Moon size={18} />
          <span>Mode Sombre</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
