/**
 * Core App Component
 * Root component that initializes the application
 */

import { AppRouter } from '../router/router';
import { LanguageProvider } from '@apps/fablab/language/LanguageContext';
import './App.css';

export function App() {
  return (
    <LanguageProvider>
      <AppRouter />
    </LanguageProvider>
  );
}
