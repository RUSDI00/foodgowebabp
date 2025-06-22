
import { Promo, DiscountType } from '../types';
import { getData, addItem, updateItem as updateDbItem, deleteItem as deleteDbItem, getItemById as getDbItemById } from './db';

export const getAllPromos = (): Promo[] => {
  return getData('promos').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getActivePromos = (): Promo[] => {
  const now = new Date().toISOString();
  return getAllPromos().filter(promo => 
    promo.isActive && 
    new Date(promo.startDate) <= new Date(now) && 
    new Date(promo.endDate) >= new Date(now)
  );
};

export const getPromoById = (promoId: string): Promo | undefined => {
  return getDbItemById('promos', promoId);
};

export const getPromoByCode = (code: string): Promo | undefined => {
  const activePromos = getActivePromos();
  return activePromos.find(promo => promo.code.toUpperCase() === code.toUpperCase());
};

export const addPromo = (promoData: Omit<Promo, 'id' | 'createdAt'>): Promo => {
  return addItem('promos', promoData);
};

export const updatePromo = (updatedPromoData: Promo): Promo | null => {
  return updateDbItem('promos', updatedPromoData);
};

export const deletePromo = (promoId: string): boolean => {
  return deleteDbItem('promos', promoId);
};

export const applyPromo = (totalAmount: number, promoCode: string): { discountedAmount: number, discountValue: number, error?: string } => {
  const promo = getPromoByCode(promoCode);

  if (!promo) {
    return { discountedAmount: totalAmount, discountValue: 0, error: 'Kode promo tidak valid atau sudah kedaluwarsa.' };
  }

  if (promo.minPurchase && totalAmount < promo.minPurchase) {
    return { discountedAmount: totalAmount, discountValue: 0, error: `Minimal pembelian Rp ${promo.minPurchase.toLocaleString()} untuk menggunakan promo ini.` };
  }

  let discountValue = 0;
  if (promo.discountType === DiscountType.PERCENTAGE) {
    discountValue = (totalAmount * promo.discountValue) / 100;
  } else if (promo.discountType === DiscountType.FIXED) {
    discountValue = promo.discountValue;
  }

  // Ensure discount doesn't exceed total amount
  discountValue = Math.min(discountValue, totalAmount);
  
  const discountedAmount = totalAmount - discountValue;

  return { discountedAmount, discountValue };
};
