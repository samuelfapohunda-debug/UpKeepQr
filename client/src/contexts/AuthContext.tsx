import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  adminEmail: string | null;
  rememberMe: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => boolean;
  clearError: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'upkeepqr_admin_token';
const EMAIL_KEY = 'upkeepqr_admin_email';
const REMEMBER_ME_KEY = 'upkeepqr_remember_me';

// API base URL - defaults to same-origin (empty string) for production
// Set VITE_API_BASE_URL only if backend is on a different origin
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    adminEmail: null,
    rememberMe: true,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const storedEmail = localStorage.getItem(EMAIL_KEY) || sessionStorage.getItem(EMAIL_KEY);
    const storedRememberMe = localStorage.getItem(REMEMBER_ME_KEY);
    const isFromLocalStorage = Boolean(localStorage.getItem(TOKEN_KEY));

    if (storedToken && storedEmail) {
      try {
        const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
        const expirationTime = tokenData.exp * 1000;
        
        if (Date.now() < expirationTime) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            token: storedToken,
            adminEmail: storedEmail,
            rememberMe: storedRememberMe === 'true',
          });
        } else {
          if (isFromLocalStorage) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EMAIL_KEY);
            localStorage.removeItem(REMEMBER_ME_KEY);
          } else {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(EMAIL_KEY);
          }
          setError('Your session has expired. Please log in again.');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            token: null,
            adminEmail: null,
            rememberMe: true,
          });
        }
      } catch (error) {
        if (isFromLocalStorage) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(EMAIL_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(EMAIL_KEY);
        }
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
          adminEmail: null,
          rememberMe: true,
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (
    email: string, 
    password: string, 
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/auth/agent/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || 'Login failed. Please check your credentials.' 
        };
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        if (rememberMe) {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(EMAIL_KEY, email);
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
        } else {
          sessionStorage.setItem(TOKEN_KEY, data.token);
          sessionStorage.setItem(EMAIL_KEY, email);
        }

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token: data.token,
          adminEmail: email,
          rememberMe,
        });

        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Invalid response from server. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);

    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      adminEmail: null,
      rememberMe: true,
    });

    setError(null);
  };

  const checkAuth = (): boolean => {
    return authState.isAuthenticated;
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
    clearError,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}
