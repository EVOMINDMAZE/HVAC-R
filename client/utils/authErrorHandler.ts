import { supabase } from '@/lib/supabase';

export class AuthErrorHandler {
  private static isHandlingError = false;

  static async handleAuthError(error: any): Promise<void> {
    // Prevent multiple error handlers from running simultaneously
    if (this.isHandlingError) return;
    
    const errorMessage = error?.message || error?.toString() || '';
    
    // Check for refresh token errors
    if (errorMessage.includes('Invalid Refresh Token') || 
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('refresh_token_not_found')) {
      
      this.isHandlingError = true;
      
      try {
        console.warn('Auth token error detected, clearing session and redirecting to login');
        
        // Clear the session
        if (supabase) {
          await supabase.auth.signOut();
        }
        
        // Clear any stored tokens
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/signin') && 
            !window.location.pathname.includes('/signup') &&
            !window.location.pathname.includes('/')) {
          window.location.href = '/signin';
        }
        
      } catch (clearError) {
        console.error('Error clearing session:', clearError);
      } finally {
        this.isHandlingError = false;
      }
    }
  }

  static setupGlobalErrorHandler(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      this.handleAuthError(error);
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.handleAuthError(event.error);
    });
  }
}

// Setup global error handling when this module is imported
if (typeof window !== 'undefined') {
  AuthErrorHandler.setupGlobalErrorHandler();
}
