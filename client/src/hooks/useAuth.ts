import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  role: 'customer' | 'admin' | 'pro';
  householdId?: string | null;
  email?: string;
  expiresAt?: string;
}

const AUTH_CACHE_KEY = 'upkeepqr_auth_cache';
const CACHE_DURATION = 5 * 60 * 1000;
const EXPIRY_WARNING_TIME = 5 * 60 * 1000;

interface CachedAuth {
  user: User | null;
  timestamp: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiringSoon, setSessionExpiringSoon] = useState(false);
  
  const verifySession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session/verify', { 
        credentials: 'include' 
      });
      
      if (!response.ok) {
        setUser(null);
        clearAuthCache();
        return;
      }
      
      const data = await response.json();
      
      if (data.authenticated) {
        const userData: User = {
          id: data.userId || data.householdId || data.sessionId,
          role: data.role || 'customer',
          householdId: data.householdId || null,
          email: data.email,
          expiresAt: data.expiresAt
        };
        
        setUser(userData);
        
        if (userData.expiresAt) {
          const expiryTime = new Date(userData.expiresAt).getTime();
          const timeUntilExpiry = expiryTime - Date.now();
          setSessionExpiringSoon(timeUntilExpiry < EXPIRY_WARNING_TIME && timeUntilExpiry > 0);
        }
        
        const cached: CachedAuth = {
          user: userData,
          timestamp: Date.now()
        };
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cached));
      } else {
        setUser(null);
        clearAuthCache();
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (cached) {
      try {
        const { user: cachedUser, timestamp }: CachedAuth = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          setUser(cachedUser);
          setLoading(false);
          verifySession();
          return;
        }
      } catch {
      }
    }
    
    verifySession();
  }, [verifySession]);
  
  useEffect(() => {
    if (user?.expiresAt) {
      const expiryTime = new Date(user.expiresAt).getTime();
      const timeUntilExpiry = expiryTime - Date.now();
      
      if (timeUntilExpiry < EXPIRY_WARNING_TIME && timeUntilExpiry > 0) {
        setSessionExpiringSoon(true);
      }
    }
  }, [user]);
  
  return { user, loading, sessionExpiringSoon, refetch: verifySession };
}

export function clearAuthCache() {
  sessionStorage.removeItem(AUTH_CACHE_KEY);
}

export async function refreshSession() {
  try {
    await fetch('/api/auth/session/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    clearAuthCache();
  } catch (err) {
    console.error('Session refresh failed:', err);
  }
}
