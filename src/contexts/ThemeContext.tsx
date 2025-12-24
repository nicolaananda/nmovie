import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { webStorage } from '../services/storage';
import { colors as defaultColors } from '../styles/colors';

export interface Theme {
  id: string;
  name: string;
  colors: typeof defaultColors;
  isEditable: boolean;
}

export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default Dark',
    colors: defaultColors,
    isEditable: false,
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      ...defaultColors,
      primary: '#3498db',
      secondary: '#2ecc71',
      darkBackground: '#0a192f',
    },
    isEditable: false,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      ...defaultColors,
      primary: '#ff7e5f',
      secondary: '#feb47b',
      darkBackground: '#1a0f0b',
    },
    isEditable: false,
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    colors: {
      ...defaultColors,
      primary: '#c084fc',
      secondary: '#60a5fa',
      darkBackground: '#060609',
    },
    isEditable: false,
  },
  {
    id: 'emerald',
    name: 'Emerald',
    colors: {
      ...defaultColors,
      primary: '#2ecc71',
      secondary: '#3498db',
      darkBackground: '#0e1e13',
    },
    isEditable: false,
  },
  {
    id: 'ruby',
    name: 'Ruby',
    colors: {
      ...defaultColors,
      primary: '#e74c3c',
      secondary: '#9b59b6',
      darkBackground: '#1a0a0a',
    },
    isEditable: false,
  },
];

interface ThemeContextProps {
  currentTheme: Theme;
  availableThemes: Theme[];
  setCurrentTheme: (themeId: string) => void;
  addCustomTheme: (theme: Omit<Theme, 'id' | 'isEditable'>) => void;
  updateCustomTheme: (theme: Theme) => void;
  deleteCustomTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const CURRENT_THEME_KEY = 'current_theme';
const CUSTOM_THEMES_KEY = 'custom_themes';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentThemeState] = useState<Theme>(DEFAULT_THEMES[0]);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>(DEFAULT_THEMES);

  // Load themes from storage
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const savedThemeId = await webStorage.getItem(CURRENT_THEME_KEY);
        const customThemesJson = await webStorage.getItem(CUSTOM_THEMES_KEY);
        const customThemes = customThemesJson ? JSON.parse(customThemesJson) : [];
        const allThemes = [...DEFAULT_THEMES, ...customThemes];
        setAvailableThemes(allThemes);

        if (savedThemeId) {
          const theme = allThemes.find(t => t.id === savedThemeId);
          if (theme) {
            setCurrentThemeState(theme);
            applyThemeColors(theme);
          }
        }
      } catch (error) {
        console.error('Failed to load themes:', error);
      }
    };
    loadThemes();
  }, []);

  // Apply theme colors to CSS variables
  const applyThemeColors = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-dark-background', theme.colors.darkBackground);
  };

  const setCurrentTheme = async (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentThemeState(theme);
      applyThemeColors(theme);
      await webStorage.setItem(CURRENT_THEME_KEY, themeId);
    }
  };

  const addCustomTheme = async (themeData: Omit<Theme, 'id' | 'isEditable'>) => {
    try {
      const id = `custom_${Date.now()}`;
      const newTheme: Theme = {
        id,
        ...themeData,
        isEditable: true,
      };

      const customThemes = availableThemes.filter(t => t.isEditable);
      const updatedCustomThemes = [...customThemes, newTheme];
      const updatedAllThemes = [...DEFAULT_THEMES, ...updatedCustomThemes];

      await webStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updatedCustomThemes));
      setAvailableThemes(updatedAllThemes);
      setCurrentThemeState(newTheme);
      applyThemeColors(newTheme);
      await webStorage.setItem(CURRENT_THEME_KEY, id);
    } catch (error) {
      console.error('Failed to add custom theme:', error);
    }
  };

  const updateCustomTheme = async (updatedTheme: Theme) => {
    try {
      if (!updatedTheme.isEditable) {
        throw new Error('Cannot edit built-in themes');
      }

      const customThemes = availableThemes.filter(t => t.isEditable);
      const updatedCustomThemes = customThemes.map(t =>
        t.id === updatedTheme.id ? updatedTheme : t
      );

      const updatedAllThemes = [...DEFAULT_THEMES, ...updatedCustomThemes];

      await webStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updatedCustomThemes));
      setAvailableThemes(updatedAllThemes);

      if (currentTheme.id === updatedTheme.id) {
        setCurrentThemeState(updatedTheme);
        applyThemeColors(updatedTheme);
      }
    } catch (error) {
      console.error('Failed to update custom theme:', error);
    }
  };

  const deleteCustomTheme = async (themeId: string) => {
    try {
      const themeToDelete = availableThemes.find(t => t.id === themeId);

      if (!themeToDelete || !themeToDelete.isEditable) {
        throw new Error('Cannot delete built-in themes or theme not found');
      }

      const customThemes = availableThemes.filter(t => t.isEditable && t.id !== themeId);
      const updatedAllThemes = [...DEFAULT_THEMES, ...customThemes];

      await webStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
      setAvailableThemes(updatedAllThemes);

      if (currentTheme.id === themeId) {
        setCurrentThemeState(DEFAULT_THEMES[0]);
        applyThemeColors(DEFAULT_THEMES[0]);
        await webStorage.setItem(CURRENT_THEME_KEY, DEFAULT_THEMES[0].id);
      }
    } catch (error) {
      console.error('Failed to delete custom theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        availableThemes,
        setCurrentTheme,
        addCustomTheme,
        updateCustomTheme,
        deleteCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

