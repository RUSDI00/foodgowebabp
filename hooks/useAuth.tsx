
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signUp: (name: string, email: string, pass: string, phone?: string) => Promise<User | null>;
  signOut: () => void;
  updateUserContext: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(() => {
    setLoading(true);
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    const signedInUser = await authService.signIn(email, pass);
    setUser(signedInUser);
    setLoading(false);
    return signedInUser;
  };

  const signUp = async (name: string, email: string, pass: string, phone?: string): Promise<User | null> => {
    setLoading(true);
    const signedUpUser = await authService.signUp(name, email, pass, phone);
    setUser(signedUpUser);
    setLoading(false);
    return signedUpUser;
  };

  const signOut = () => {
    authService.signOut();
    setUser(null);
  };

  const updateUserContext = (updatedUser: User) => {
    setUser(updatedUser); // Update context state
    authService.updateCurrentUserInStorage(updatedUser); // Update session/localStorage if needed
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
