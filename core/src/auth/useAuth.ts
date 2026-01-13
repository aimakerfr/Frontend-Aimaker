/**
 * useAuth Hook - React integration for Auth Store
 * Provides reactive access to authentication state
 */

import { useEffect, useState, useCallback } from 'react';
import { authStore, type AuthState } from './auth.store';
import type { LoginRequest, RegisterRequest } from '../api/api.types';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    // Subscribe to auth store changes
    const unsubscribe = authStore.subscribe((state) => {
      setAuthState(state);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    await authStore.login(credentials);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authStore.register(data);
  }, []);

  const logout = useCallback(async () => {
    await authStore.logout();
  }, []);

  const refreshUser = useCallback(async () => {
    await authStore.refreshUser();
  }, []);

  const clearError = useCallback(() => {
    authStore.clearError();
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };
}
