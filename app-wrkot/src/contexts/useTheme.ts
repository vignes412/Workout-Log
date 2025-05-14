import { useContext } from 'react';
import { ThemeProviderContext } from './ThemeContext';

export const useTheme = () => useContext(ThemeProviderContext);
