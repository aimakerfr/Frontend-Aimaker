/**
 * Auth App - Authentication Module
 * Handles login and registration
 * COMPLETELY DECOUPLED - Doesn't know about other apps
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import './AuthApp.css';

export default function AuthApp() {
  return (
    <div className="auth-app">
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </div>
  );
}
