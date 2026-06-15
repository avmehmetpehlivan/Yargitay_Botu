import { create } from 'zustand';

export type Theme = 'light' | 'dark';
export type Accent = 'teal' | 'neutral' | 'blue';

const THEME_KEY = 'yb-theme';
const ACCENT_KEY = 'yb-accent';

/** <html>'e data-theme / data-accent uygular (teal = varsayılan, attribute yok). */
function apply(theme: Theme, accent: Accent): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (accent === 'teal') delete root.dataset.accent;
  else root.dataset.accent = accent;
}

function readTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}
function readAccent(): Accent {
  const a = localStorage.getItem(ACCENT_KEY);
  return a === 'neutral' || a === 'blue' ? a : 'teal';
}

interface UiState {
  theme: Theme;
  accent: Accent;
  init: () => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setAccent: (a: Accent) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: readTheme(),
  accent: readAccent(),

  init: () => apply(get().theme, get().accent),

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    apply(theme, get().accent);
    set({ theme });
  },

  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  setAccent: (accent) => {
    localStorage.setItem(ACCENT_KEY, accent);
    apply(get().theme, accent);
    set({ accent });
  },
}));
