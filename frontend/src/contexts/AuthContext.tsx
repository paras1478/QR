import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { meRequest, loginRequest, logoutRequest, registerRequest } from '../services/auth.service';
import { tokenStorage } from '../services/api';

// The Google OAuth callback redirects to /dashboard#token=... (a URL
// fragment, never sent to any server) so the frontend can pick up the
// Bearer token the same way it would from a normal login response.
function consumeOAuthTokenFromUrl() {
  if (!window.location.hash.startsWith('#token=')) return;
  const token = window.location.hash.slice('#token='.length);
  tokenStorage.set(token);
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await meRequest();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    consumeOAuthTokenFromUrl();
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const loggedInUser = await loginRequest(email, password);
    setUser(loggedInUser);
  };

  const register = async (name: string, email: string, password: string) => {
    const newUser = await registerRequest(name, email, password);
    setUser(newUser);
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
