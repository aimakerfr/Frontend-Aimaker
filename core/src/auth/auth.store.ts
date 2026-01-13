/**
 * Auth Store - Centralized authentication state management
 * Manages user authentication, token storage, and auth state
 * Uses simple reactive pattern with subscribers
 */

import { httpClient, tokenStorage } from '../api/http.client';
import {
  API_ENDPOINTS,
  type User,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
} from '../api/api.types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth State
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

type AuthSubscriber = (state: AuthState) => void;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth Store
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class AuthStore {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  };

  private subscribers: Set<AuthSubscriber> = new Set();

  constructor() {
    // Initialize auth state on creation
    this.initializeAuth();
  }

  /**
   * Get current state
   */
  public getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(subscriber: AuthSubscriber): () => void {
    this.subscribers.add(subscriber);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Update state and notify subscribers
   */
  private setState(partialState: Partial<AuthState>): void {
    this.state = { ...this.state, ...partialState };
    this.notifySubscribers();
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    this.subscribers.forEach((subscriber) => {
      subscriber(this.getState());
    });
  }

  /**
   * Initialize authentication state
   * Check if token exists and validate it
   */
  private async initializeAuth(): Promise<void> {
    if (!tokenStorage.exists()) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      const user = await httpClient.get<User>(API_ENDPOINTS.auth.me);
      this.setState({
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Token is invalid, clear it
      tokenStorage.remove();
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    }
  }

  /**
   * Login user
   */
  public async login(credentials: LoginRequest): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await httpClient.post<LoginResponse>(
        API_ENDPOINTS.auth.login,
        credentials,
        false // No auth required for login
      );

      // Store token
      tokenStorage.set(response.token);

      // Set user state
      this.setState({
        isAuthenticated: true,
        user: {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          roles: response.user.roles,
          createdAt: response.user.lastLoginAt,
          lastLoginAt: response.user.lastLoginAt,
          isActive: true,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Register new user
   */
  public async register(data: RegisterRequest): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await httpClient.post<RegisterResponse>(
        API_ENDPOINTS.auth.register,
        data,
        false // No auth required for register
      );

      // Store token
      tokenStorage.set(response.token);

      // Set user state
      this.setState({
        isAuthenticated: true,
        user: {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          roles: response.user.roles,
          createdAt: response.user.createdAt,
          lastLoginAt: null,
          isActive: true,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional, since JWT is stateless)
      await httpClient.post(API_ENDPOINTS.auth.logout, {});
    } catch (error) {
      // Ignore errors on logout endpoint
      console.warn('Logout endpoint failed:', error);
    } finally {
      // Always clear local state
      tokenStorage.remove();
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    }
  }

  /**
   * Refresh user data
   */
  public async refreshUser(): Promise<void> {
    if (!this.state.isAuthenticated) {
      return;
    }

    try {
      const user = await httpClient.get<User>(API_ENDPOINTS.auth.me);
      this.setState({ user });
    } catch (error) {
      // Token might be expired, logout
      await this.logout();
      throw error;
    }
  }

  /**
   * Clear error
   */
  public clearError(): void {
    this.setState({ error: null });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Export singleton instance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const authStore = new AuthStore();
