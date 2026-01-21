import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../lib/api-config';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  adminEmail: string | null;
  rememberMe: boolean;
  isCustomer: boolean;
  customerLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  customerLogout: () => Promise<void>;
  checkAuth: () => boolean;
  clearError: () => void;
  error: string | null;
  refreshCustomerSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'upkeepqr_admin_token';
const EMAIL_KEY = 'upkeepqr_admin_email';
const REMEMBER_ME_KEY = 'upkeepqr_remember_me';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    adminEmail: null,
    rememberMe: true,
    isCustomer: false,
    customerLoading: true,
  });

  const [error, setError] = useState<string | null>(null);

  const checkCustomerSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session/verify`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setAuthState(prev => ({ ...prev, isCustomer: true, customerLoading: false }));
          return true;
        }
      }
      setAuthState(prev => ({ ...prev, isCustomer: false, customerLoading: false }));
      return false;
    } catch {
      setAuthState(prev => ({ ...prev, isCustomer: false, customerLoading: false }));
      return false;
    }
  };

  useEffect(() => {
    checkCustomerSession();
  }, []);

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
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            token: storedToken,
            adminEmail: storedEmail,
            rememberMe: storedRememberMe === 'true',
          }));
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
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            token: null,
            adminEmail: null,
            rememberMe: true,
          }));
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
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          token: null,
          adminEmail: null,
          rememberMe: true,
        }));
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

        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          token: data.token,
          adminEmail: email,
          rememberMe,
        }));

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
      isCustomer: authState.isCustomer,
      customerLoading: authState.customerLoading,
    });

    setError(null);
  };

  const customerLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/session/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      console.error('Customer logout failed');
    }
    setAuthState(prev => ({ ...prev, isCustomer: false, customerLoading: false }));
  };

  const refreshCustomerSession = async () => {
    await checkCustomerSession();
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
    customerLogout,
    checkAuth,
    clearError,
    error,
    refreshCustomerSession,
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
