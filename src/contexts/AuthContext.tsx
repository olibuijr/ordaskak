
import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '@/services/pocketbase';
import { getCurrentUser, logout } from '@/services/authentication';

type User = {
  id: string;
  username: string;
  email: string;
  name?: string;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
  refreshUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const authUser = getCurrentUser();
    if (authUser) {
      setUser({
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        name: authUser.name,
      });
    }
  };

  useEffect(() => {
    // Load initial auth state
    refreshUser();
    setIsLoading(false);

    // Listen for auth state changes
    pb.authStore.onChange(() => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser({
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          name: currentUser.name,
        });
      } else {
        setUser(null);
      }
    });
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
