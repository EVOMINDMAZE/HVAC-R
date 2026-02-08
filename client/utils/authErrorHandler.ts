import { supabase } from '@/lib/supabase';

const TOKEN_ERROR_PATTERNS = [
  'Invalid Refresh Token',
  'Refresh Token Not Found',
  'refresh_token_not_found',
  'jwt expired',
  'JWT expired',
  'token is expired',
  'expired token',
  'invalid JWT token',
  'invalid token',
  'Invalid JWT',
  'Invalid token',
  'Token expired',
  'token not valid',
  'not authenticated',
  'Unauthorized',
  'auth_failed',
  'Authentication failed',
  'missing authentication',
  'Invalid claim',
  'RLS related authentication',
];

export function isTokenError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code || '';
  
  return TOKEN_ERROR_PATTERNS.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
    errorCode.toLowerCase().includes(pattern.toLowerCase())
  );
}

export class AuthErrorHandler {
  private static isHandlingError = false;

  static async handleAuthError(error: any): Promise<boolean> {
    if (!isTokenError(error)) {
      return false;
    }
    
    if (this.isHandlingError) return true;
    
    this.isHandlingError = true;
    
    try {
      console.warn('[AuthErrorHandler] Auth token error detected, clearing session and redirecting to login', error);
      
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      if (!window.location.pathname.includes('/signin') && 
          !window.location.pathname.includes('/signup') &&
          !window.location.pathname.includes('/')) {
        window.location.href = '/signin';
      }
      
      return true;
    } catch (clearError) {
      console.error('[AuthErrorHandler] Error clearing session:', clearError);
      return false;
    } finally {
      this.isHandlingError = false;
    }
  }

  static setupGlobalErrorHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      this.handleAuthError(error);
    });

    window.addEventListener('error', (event) => {
      this.handleAuthError(event.error);
    });
  }
}

if (typeof window !== 'undefined') {
  AuthErrorHandler.setupGlobalErrorHandler();
}
