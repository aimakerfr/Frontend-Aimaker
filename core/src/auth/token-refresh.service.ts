/**
 * Token Refresh Service
 * Handles automatic token refresh and inactivity detection
 */

import { authStore } from './auth.store';

interface TokenInfo {
  token: string;
  expiresAt: number;
}

class TokenRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes before expiry
  private lastActivity: number = Date.now();
  private isRefreshing = false;

  /**
   * Initialize token refresh and inactivity detection
   */
  public initialize(): void {
    // Listen to user activity events
    this.setupActivityListeners();
    
    // Start refresh timer
    this.scheduleTokenRefresh();
    
    // Start inactivity check
    this.startInactivityCheck();
    
    console.log('[TokenRefresh] Service initialized');
  }

  /**
   * Stop all timers (on logout)
   */
  public stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.removeActivityListeners();
    console.log('[TokenRefresh] Service stopped');
  }

  /**
   * Setup event listeners for user activity
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  /**
   * Remove activity event listeners
   */
  private removeActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.lastActivity = Date.now();
  };

  /**
   * Check for inactivity and logout if needed
   */
  private startInactivityCheck(): void {
    this.inactivityTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;

      if (timeSinceActivity >= this.INACTIVITY_TIMEOUT) {
        console.log('[TokenRefresh] User inactive for 30 minutes, logging out...');
        this.handleInactivityLogout();
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Handle logout due to inactivity
   */
  private async handleInactivityLogout(): Promise<void> {
    this.stop();
    try {
      await authStore.logout();
      // Redirect to login with message
      window.location.href = '/auth/login?reason=inactivity';
    } catch (error) {
      console.error('[TokenRefresh] Error during inactivity logout:', error);
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    // Check every 5 minutes if token needs refresh
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshToken();
    }, 5 * 60 * 1000);

    // Also check immediately
    this.checkAndRefreshToken();
  }

  /**
   * Check if token needs refresh and refresh it
   */
  private async checkAndRefreshToken(): Promise<void> {
    if (this.isRefreshing) {
      return; // Already refreshing
    }

    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo) {
      return; // No token to refresh
    }

    const now = Date.now();
    const timeUntilExpiry = tokenInfo.expiresAt - now;

    // Refresh if token expires in less than 5 minutes
    if (timeUntilExpiry < this.REFRESH_BEFORE_EXPIRY && timeUntilExpiry > 0) {
      console.log('[TokenRefresh] Token expiring soon, refreshing...');
      await this.refreshToken();
    }
  }

  /**
   * Get current token information from localStorage
   */
  private getTokenInfo(): TokenInfo | null {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      // Decode JWT to get expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds

      return { token, expiresAt };
    } catch (error) {
      console.error('[TokenRefresh] Error decoding token:', error);
      return null;
    }
  }

  /**
   * Refresh the token by re-authenticating silently
   * In a production environment, this should call a dedicated refresh endpoint
   */
  private async refreshToken(): Promise<void> {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;

    try {
      // Get current user email from token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.email;

      console.log(`[TokenRefresh] Refreshing token for user: ${email}`);

      // Call refresh endpoint (needs to be implemented in backend)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/login_check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: email,
          // Note: In production, implement a proper refresh token mechanism
          // This is a simplified approach
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('[TokenRefresh] Token refreshed successfully');
      }
    } catch (error) {
      console.error('[TokenRefresh] Error refreshing token:', error);
      // Don't logout immediately, let the token expire naturally
      // and handle it in the http interceptor
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Manually trigger token refresh (useful after user performs an action)
   */
  public async triggerRefresh(): Promise<void> {
    await this.refreshToken();
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();
