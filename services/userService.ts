import { User } from '../types';
import { apiClient } from './api';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await apiClient.getAllUsers();
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | undefined> => {
  try {
    return await apiClient.getUserById(userId);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return undefined;
  }
};

export const updateUser = async (updatedUser: User): Promise<User | null> => {
  try {
    const result = await apiClient.updateUser(updatedUser.id, updatedUser);
    
    // Update session storage if this is the current user
        const currentUserJson = sessionStorage.getItem('currentUser');
        if (currentUserJson) {
            const currentUserSession = JSON.parse(currentUserJson);
            if (currentUserSession.id === result.id) {
                sessionStorage.setItem('currentUser', JSON.stringify(result));
            }
        }
    
    return result;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    await apiClient.deleteUser(userId);
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    return false;
  }
};