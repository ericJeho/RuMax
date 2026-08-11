'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type TextScale = 100 | 110 | 125;

type Preferences = {
  theme: ThemeMode;
  highContrast: boolean;
  textScale: TextScale;
  reduceMotion: boolean;
};

type ThemeContextValue = Preferences & {
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  setHighContrast: (on: boolean) => void;
  setTextScale: (scale: TextScale) => void;
  setReduceMotion: (on: boolean) => void;
};

const STORAGE_KEY = 'rumax:prefs';
const DEFAULTS: Preferences = {
  theme: 'system',
  highContrast: false,
  textScale: 100,
  reduceMotion: false,
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Blocking script injected into <head>. It applies the stored preferences before the
 * first paint so the page never flashes the wrong theme — a genuine accessibility issue
 * for light-sensitive users, not only a cosmetic one.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var raw = localStorage.getItem('${STORAGE_KEY}');
    var prefs = raw ? JSON.parse(raw) : {};
    var mode = prefs.theme || 'system';
    var dark = mode === 'dark' || (mode === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.classList.toggle('contrast-high', !!prefs.highContrast);
    if (prefs.textScale && prefs.textScale !== 100) {
      root.classList.add('text-scale-' + prefs.textScale);
    }
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`.trim();

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) });
    } catch {
      /* corrupt storage: fall back to defaults */
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.toggle('contrast-high', prefs.highContrast);
    root.classList.remove('text-scale-110', 'text-scale-125');
    if (prefs.textScale !== 100) root.classList.add(`text-scale-${prefs.textScale}`);
    root.style.colorScheme = resolvedTheme;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage disabled (private mode): preferences apply for this session only */
    }
  }, [prefs, resolvedTheme]);

  const update = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
      setPrefs((current) => ({ ...current, [key]: value })),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...prefs,
      resolvedTheme,
      setTheme: (mode) => update('theme', mode),
      setHighContrast: (on) => update('highContrast', on),
      setTextScale: (scale) => update('textScale', scale),
      setReduceMotion: (on) => update('reduceMotion', on),
    }),
    [prefs, resolvedTheme, update],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
