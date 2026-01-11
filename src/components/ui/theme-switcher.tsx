import { useEffect } from 'react';

// Force dark mode only - no theme switching
const useTheme = () => {
  useEffect(() => {
    // Always enforce dark mode
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    localStorage.theme = 'dark';
  }, []);

  return ['dark' as const, () => {}] as const;
};

// Theme switcher removed - app now uses dark mode only
// Export useTheme for any components that might still reference it
export { useTheme };
