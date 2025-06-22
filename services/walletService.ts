import { Wallet, WalletTransaction, WalletTransactionType } from '../types';
import { apiClient } from './api';

// Get wallet from backend API
export const getWallet = async (): Promise<Wallet | undefined> => {
  try {
    const wallet = await apiClient.getWallet();
    return wallet;
  } catch (error) {
    console.error('Failed to get wallet:', error);
    return undefined;
  }
};

// Top up wallet via backend API
export const topUpWallet = async (amount: number, method: string): Promise<boolean> => {
  try {
    if (amount <= 0) return false;
    
    await apiClient.topUpWallet(amount, method);
    return true;
  } catch (error) {
    console.error('Failed to top up wallet:', error);
    return false;
  }
};

// Get wallet transactions from backend API
export const getWalletTransactions = async (): Promise<WalletTransaction[]> => {
  try {
    const transactions = await apiClient.getWalletTransactions();
    return transactions;
  } catch (error) {
    console.error('Failed to get wallet transactions:', error);
    return [];
  }
};

// These functions are no longer needed since backend handles them
// but keeping for backward compatibility

export const updateWalletBalance = (): Wallet | null => {
  console.warn('updateWalletBalance is deprecated - wallet balance should be updated via API');
  return null;
};

export const addWalletTransaction = (
  userId: string, 
  type: WalletTransactionType, 
  amount: number, 
  description: string,
  relatedOrderId?: string
): WalletTransaction => {
  console.warn('addWalletTransaction is deprecated - transactions are created via API');
  return {
    id: '',
    userId,
    type,
    amount,
    description,
    relatedOrderId,
    createdAt: new Date().toISOString()
  };
};