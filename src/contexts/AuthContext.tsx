
import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb, getCurrentUser } from '@/services/pocketbase';

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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial auth state
    const authUser = getCurrentUser();
    if (authUser) {
      setUser({
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        name: authUser.name,
      });
    }
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

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
