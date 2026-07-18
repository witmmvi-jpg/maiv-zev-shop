'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  isLoaded: false,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedCurrentUser = localStorage.getItem('maivzev_current_user_v3');
    if (storedCurrentUser) {
      try {
        const parsed = JSON.parse(storedCurrentUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('maivzev_current_user_v3', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('maivzev_current_user_v3');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}
