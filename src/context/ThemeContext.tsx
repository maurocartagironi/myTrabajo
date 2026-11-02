import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

const THEME_KEY = 'mt_theme';
const FONT_SIZE_KEY = 'mt_font_size';

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage no disponible (modo privado, etc.)
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getInitialFontSize(): FontSize {
  try {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved === 'small' || saved === 'medium' || saved === 'large' || saved === 'xlarge') return saved;
  } catch {
    // localStorage no disponible
  }
  return 'small';
}

interface ThemeContextType {
  theme:        Theme;
  setTheme:     (t: Theme) => void;
  toggleTheme:  () => void;
  fontSize:     FontSize;
  setFontSize:  (f: FontSize) => void;
}

const Ctx = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [fontSize, setFontSize] = useState<FontSize>(getInitialFontSize);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f3f4f8' : '#0f1117');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage no disponible, la preferencia no persiste pero no rompe nada
    }
  }, [theme]);

  // El tamaño de letra se aplica como font-size del html: como la mayoría de los tamaños de
  // Tailwind (incluidos los en rem que usa TrabajoApp) son relativos a eso, agranda todo el
  // texto y los espaciados de forma proporcional, sin tocar cada componente por separado.
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    try {
      localStorage.setItem(FONT_SIZE_KEY, fontSize);
    } catch {
      // localStorage no disponible
    }
  }, [fontSize]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <Ctx.Provider value={{ theme, setTheme, toggleTheme, fontSize, setFontSize }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
