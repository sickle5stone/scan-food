import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';

import { db } from '../config/firebase';

// Food Item Types
export interface FoodItem {
  id?: string;
  name: string;
  calories: number;
  imageUrl: string;
  ingredients: Array<{
    name: string;
    weight: string;
    calories: number;
  }>;
  nutrients: Array<{
    name: string;
    amount: string;
    rda?: string;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Diary Entry Types
export interface DiaryEntry {
  id?: string;
  userId: string;
  foodItemId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  date: Timestamp;
  createdAt: Timestamp;
}

// Food Items Collection
export const addFoodItem = async (foodItem: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'foodItems'), {
      ...foodItem,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding food item:', error);
    throw error;
  }
};

export const getFoodItem = async (id: string): Promise<FoodItem | null> => {
  try {
    const docRef = doc(db, 'foodItems', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FoodItem;
    }
    return null;
  } catch (error) {
    console.error('Error getting food item:', error);
    if (error instanceof FirebaseError && (error.code === 'failed-precondition' || error.code === 'unavailable')) {
      throw new Error('Unable to connect to the database. Please check your internet connection and try again.');
    }
    throw new Error('Failed to load food details. Please try again later.');
  }
};

export const updateFoodItem = async (id: string, data: Partial<FoodItem>): Promise<void> => {
  try {
    const docRef = doc(db, 'foodItems', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    throw error;
  }
};

export const deleteFoodItem = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'foodItems', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting food item:', error);
    throw error;
  }
};

// Diary Entries Collection
export const addDiaryEntry = async (entry: Omit<DiaryEntry, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'diaryEntries'), {
      ...entry,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding diary entry:', error);
    throw error;
  }
};

export const getDiaryEntries = async (userId: string, date: Date): Promise<DiaryEntry[]> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'diaryEntries'),
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DiaryEntry[];
  } catch (error) {
    console.error('Error getting diary entries:', error);
    throw error;
  }
};

export const deleteDiaryEntry = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'diaryEntries', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    throw error;
  }
}; 