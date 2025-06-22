
import { User, AppData, CartItem, NotificationType, DiscountType } from '../types';
import { ADMIN_EMAIL, ADMIN_PASSWORD, APP_DB_KEY, INITIAL_PRODUCTS, INITIAL_PROMOS } from '../constants';

// Helper to generate simple IDs
export const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Create a type that includes only keys of AppData whose values are arrays.
type ArrayKeys<T> = {
  [K in keyof T]: T[K] extends Array<any> ? K : never;
}[keyof T];

// This type will be a union of keys like 'users', 'products', etc., excluding 'carts'.
type ArrayTableKey = Exclude<ArrayKeys<AppData>, 'carts'>;


const getInitialData = (): AppData => {
  const adminUser: User = {
    id: 'admin001',
    email: ADMIN_EMAIL,
    passwordHash: ADMIN_PASSWORD, // In a real app, hash this securely! This is plain for demo.
    role: 'admin',
    name: 'Admin FoodGo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleUser: User = {
    id: 'user001',
    email: 'user@example.com',
    passwordHash: 'password123', // Plain for demo
    role: 'user',
    name: 'Pengguna FoodGo',
    phone: '081234567890',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    users: [adminUser, sampleUser],
    products: INITIAL_PRODUCTS.map(p => ({...p, id: p.id || generateId(), updatedAt: new Date().toISOString() })),
    orders: [],
    wallets: [
      { userId: adminUser.id, balance: 0 },
      { userId: sampleUser.id, balance: 500000 }
    ],
    walletTransactions: [],
    notifications: [
        { id: generateId(), userId: sampleUser.id, message: 'Selamat datang di FoodGo! Pesan makanan favoritmu sekarang.', type: NotificationType.GENERAL, isRead: false, createdAt: new Date().toISOString() }
    ],
    promos: INITIAL_PROMOS.map(p => ({...p, id: p.id || generateId(), discountType: p.discountType as DiscountType, updatedAt: new Date().toISOString() })), // Ensure DiscountType
    reviews: [
        { id: generateId(), userId: sampleUser.id, userName: sampleUser.name, productId: 'food1', rating: 5, text: 'Nasi gorengnya enak banget, porsinya pas!', createdAt: new Date().toISOString() },
        { id: generateId(), userId: sampleUser.id, userName: sampleUser.name, productId: 'food2', rating: 4, text: 'Ayam gepreknya pedas mantap, sambal matahnya segar.', createdAt: new Date().toISOString() },
    ],
    carts: {
      [sampleUser.id]: [
        { productId: 'food1', quantity: 1, name: INITIAL_PRODUCTS[0].name, price: INITIAL_PRODUCTS[0].price, imageUrl: INITIAL_PRODUCTS[0].imageUrl },
      ]
    },
  };
};

export const initializeDb = (): void => {
  if (!localStorage.getItem(APP_DB_KEY)) {
    localStorage.setItem(APP_DB_KEY, JSON.stringify(getInitialData()));
  }
};

export const getData = <K extends keyof AppData>(table: K): AppData[K] => {
  const dbString = localStorage.getItem(APP_DB_KEY);
  if (!dbString) {
    initializeDb(); 
    return getInitialData()[table];
  }
  try {
    const db: AppData = JSON.parse(dbString);
    return db[table];
  } catch (error) {
    console.error("Error parsing DB data from localStorage:", error);
    localStorage.removeItem(APP_DB_KEY); 
    initializeDb();
    return getInitialData()[table];
  }
};

export const saveData = <K extends keyof AppData>(table: K, data: AppData[K]): void => {
  const dbString = localStorage.getItem(APP_DB_KEY);
  let db: AppData;
  if (dbString) {
    db = JSON.parse(dbString);
  } else {
    db = getInitialData();
  }
  db[table] = data;
  localStorage.setItem(APP_DB_KEY, JSON.stringify(db));
};

// Type for items in array-like tables (excluding 'carts')
// AppData[K][number] gets the element type from an array type AppData[K]
type ArrayTableItemType<K extends ArrayTableKey> = AppData[K][number];

export const addItem = <K extends ArrayTableKey>(
  table: K, 
  item: Omit<ArrayTableItemType<K>, 'id' | 'createdAt' | 'updatedAt'> & { id?: string, createdAt?: string, updatedAt?:string }
): ArrayTableItemType<K> => {
  const items = getData(table) as ArrayTableItemType<K>[];
  const newItem = {
    ...item,
    id: item.id || generateId(),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(), 
  } as ArrayTableItemType<K>;
  saveData(table, [...items, newItem] as AppData[K]); // Cast is okay because K is ArrayTableKey
  return newItem;
};

export const updateItem = <K extends ArrayTableKey>(
  table: K, 
  updatedItem: Partial<ArrayTableItemType<K>> & { id: string } // Partial allows for updating subset of fields
): ArrayTableItemType<K> | null => {
  const items = getData(table) as (ArrayTableItemType<K> & { id: string })[];
  const itemIndex = items.findIndex(item => item.id === updatedItem.id);
  if (itemIndex > -1) {
    items[itemIndex] = { 
        ...items[itemIndex], 
        ...updatedItem, 
        updatedAt: new Date().toISOString() 
    };
    saveData(table, items as AppData[K]);
    return items[itemIndex];
  }
  return null;
};


export const deleteItem = <K extends ArrayTableKey>(table: K, itemId: string): boolean => {
  const items = getData(table) as (ArrayTableItemType<K> & { id: string })[];
  const newItems = items.filter(item => item.id !== itemId);
  if (newItems.length < items.length) {
    saveData(table, newItems as AppData[K]);
    return true;
  }
  return false;
};

export const getItemById = <K extends ArrayTableKey>(
    table: K, 
    itemId: string
): (ArrayTableItemType<K> & { id: string }) | undefined => {
  const items = getData(table) as (ArrayTableItemType<K> & { id: string })[];
  return items.find(item => item.id === itemId);
};


// Cart specific operations
export const getCart = (userId: string): CartItem[] => {
  const carts = getData('carts');
  return carts[userId] || [];
};

export const saveCart = (userId: string, cartItems: CartItem[]): void => {
  const carts = getData('carts');
  carts[userId] = cartItems;
  saveData('carts', carts);
};

export const clearCart = (userId: string): void => {
  const carts = getData('carts');
  delete carts[userId];
  saveData('carts', carts);
}