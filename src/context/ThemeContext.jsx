import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = {
  light: {
    name: 'light',
    // Backgrounds
    bgPrimary: '#F8FAF8',
    bgSecondary: '#FFFFFF',
    bgCard: '#FFFFFF',
    bgInput: '#F5F9F5',
    bgHover: '#F0FBF0',
    // Text
    textPrimary: '#1A1A1A',
    textSecondary: '#555555',
    textMuted: '#888888',
    textHint: '#AAAAAA',
    // Brand
    primary: '#4CAF50',
    primaryDark: '#2E7D32',
    primaryLight: '#E8F5E9',
    primaryBorder: '#C8E6C9',
    // Borders
    border: '#E8F5E9',
    borderSubtle: '#F0F0F0',
    borderInput: '#C8E6C9',
    // Status
    success: '#2E7D32',
    successBg: '#E8F5E9',
    successBorder: '#C8E6C9',
    danger: '#C62828',
    dangerBg: '#FFEBEE',
    dangerBorder: '#FFCDD2',
    warning: '#E65100',
    warningBg: '#FFF8E1',
    warningBorder: '#FFE082',
    // Nav
    navBg: '#FFFFFF',
    navBorder: '#EBF5EB',
    // Header
    headerBg: '#FFFFFF',
    headerBorder: '#EBF5EB',
  },
  dark: {
    name: 'dark',
    // Backgrounds
    bgPrimary: '#050B18',
    bgSecondary: '#0D1428',
    bgCard: '#111827',
    bgInput: '#1A2540',
    bgHover: '#1E2A45',
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#5A7A9E',
    textHint: '#3A5A7E',
    // Brand
    primary: '#4CAF50',
    primaryDark: '#4ADE80',
    primaryLight: 'rgba(74,222,128,0.12)',
    primaryBorder: 'rgba(74,222,128,0.25)',
    // Borders
    border: '#1E2A45',
    borderSubtle: '#151E33',
    borderInput: '#2A3B6A',
    // Status
    success: '#4ADE80',
    successBg: 'rgba(74,222,128,0.12)',
    successBorder: 'rgba(74,222,128,0.25)',
    danger: '#FF4757',
    dangerBg: 'rgba(255,71,87,0.12)',
    dangerBorder: 'rgba(255,71,87,0.25)',
    warning: '#FFB800',
    warningBg: 'rgba(255,184,0,0.12)',
    warningBorder: 'rgba(255,184,0,0.25)',
    // Nav
    navBg: '#0D1428',
    navBorder: 'rgba(255,255,255,0.06)',
    // Header
    headerBg: 'rgba(5,11,24,0.95)',
    headerBorder: 'rgba(255,255,255,0.06)',
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('tb_theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  const t = THEMES[theme]

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('tb_theme', newTheme)
  }

  useEffect(() => {
    document.body.style.background = t.bgPrimary
    document.body.style.color = t.textPrimary
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, t, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
