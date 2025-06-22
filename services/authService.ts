
import { User } from '../types';
import { apiClient } from './api';

const SESSION_STORAGE_KEY = 'currentUser';

export const signUp = async (name: string, email: string, password: string, phone?: string): Promise<User | null> => {
  try {
    const { user } = await apiClient.register(email, password, name, phone);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Registration failed');
    return null;
  }
};

export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    const { user } = await apiClient.login(email, password);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Login failed');
    return null;
  }
};

export const signOut = (): void => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  apiClient.setToken(null);
};

export const getCurrentUser = (): User | null => {
  const userJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const updateCurrentUserInStorage = (user: User): void => {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
};

// Fetch fresh user data from server
export const refreshCurrentUser = async (): Promise<User | null> => {
  try {
    const user = await apiClient.getCurrentUser();
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Failed to refresh user:', error);
    return null;
  }
};
