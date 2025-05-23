import {
  CollectionReference,
  DocumentReference,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

import { db } from '../config/firebase';

// Meal Type
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

// Combined Food Diary Entry - includes all food data and diary info
export interface FoodDiaryEntry {
  id?: string;
  userId: string;
  
  // Food Information
  name: string;
  calories: number;
  imageUrl?: string;
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
  description?: string;
  
  // Diary Information
  mealType: MealType;
  date: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  tempImageUrl?: string;
  imagePlaceholder?: string;
}

// Legacy types for backward compatibility
export interface FoodItem {
  id?: string;
  name: string;
  calories: number;
  imageUrl?: string;
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
  description?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  tempImageUrl?: string;
  imagePlaceholder?: string;
}

export interface DiaryEntry {
  id?: string;
  userId: string;
  foodItemId: string;
  mealType: MealType;
  date: Timestamp;
  createdAt: Timestamp;
}

// Collection references with type safety
const foodDiaryCollection = collection(db, 'foodDiary') as CollectionReference<FoodDiaryEntry>;

// Helper function to handle Firestore errors
const handleFirestoreError = (error: unknown): Error => {
  console.error('Error:', error);
  return new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
};

// ===== NEW UNIFIED FOOD DIARY FUNCTIONS =====

// Add food to diary (main function for new structure)
export const addFoodToDiary = async (
  foodData: Omit<FoodDiaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = 'current-user-id'
): Promise<string> => {
  console.log('🔄 Adding food to diary:', { 
    name: foodData.name, 
    calories: foodData.calories,
    mealType: foodData.mealType,
    userId 
  });
  
  try {
    const docRef = await addDoc(foodDiaryCollection, {
      ...foodData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Food added to diary successfully:', { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to add food to diary:', error);
    throw handleFirestoreError(error);
  }
};

// Create diary entry with custom ID
export const createDiaryEntry = async (id: string, entry: Omit<FoodDiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  console.log('🔄 Creating diary entry with custom ID:', { 
    id,
    name: entry.name,
    userId: entry.userId,
    mealType: entry.mealType
  });
  
  try {
    const docRef = doc(db, 'foodDiary', id) as DocumentReference<FoodDiaryEntry>;
    await setDoc(docRef, {
      ...entry,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Diary entry created successfully:', { id });
  } catch (error) {
    console.error('❌ Failed to create diary entry:', error);
    throw handleFirestoreError(error);
  }
};

// Get diary entries for a specific user and date
export const getDiaryEntries = async (userId: string, date: Date): Promise<FoodDiaryEntry[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  console.log('🔄 Fetching diary entries:', {
    userId,
    date: date.toISOString(),
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString()
  });

  try {
    // Try the optimized query with date range
    const q = query(
      foodDiaryCollection,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'asc')
    );

    try {
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Diary entries fetched successfully:', { 
        count: entries.length,
        entries: entries.map(e => ({ id: e.id, name: e.name, mealType: e.mealType }))
      });
      
      return entries;
    } catch (indexError) {
      console.warn('⚠️ Composite index not available, falling back to client-side filtering:', indexError);
      
      // Fallback: get all entries for user and filter client-side
      const fallbackQuery = query(
        foodDiaryCollection,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(fallbackQuery);
      const allEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by date on client side
      const filteredEntries = allEntries.filter(entry => {
        const entryDate = entry.date.toDate();
        return entryDate >= startOfDay && entryDate <= endOfDay;
      });
      
      console.log('✅ Diary entries fetched with fallback:', { 
        totalEntries: allEntries.length,
        filteredCount: filteredEntries.length 
      });
      
      return filteredEntries;
    }
  } catch (error) {
    console.error('❌ Failed to fetch diary entries:', error);
    throw handleFirestoreError(error);
  }
};

// Get single diary entry
export const getDiaryEntry = async (id: string): Promise<FoodDiaryEntry | null> => {
  console.log('🔄 Fetching diary entry:', { id });
  try {
    const docRef = doc(db, 'foodDiary', id) as DocumentReference<FoodDiaryEntry>;
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('✅ Diary entry found:', { id, name: docSnap.data().name });
      return { id: docSnap.id, ...docSnap.data() };
    }
    console.log('ℹ️ Diary entry not found:', { id });
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch diary entry:', error);
    throw handleFirestoreError(error);
  }
};

// Update diary entry
export const updateDiaryEntry = async (id: string, data: Partial<FoodDiaryEntry>): Promise<void> => {
  console.log('🔄 Updating diary entry:', { id, updates: Object.keys(data) });
  try {
    const docRef = doc(db, 'foodDiary', id) as DocumentReference<FoodDiaryEntry>;
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    console.log('✅ Diary entry updated successfully:', { id });
  } catch (error) {
    console.error('❌ Failed to update diary entry:', error);
    throw handleFirestoreError(error);
  }
};

// Delete diary entry
export const deleteDiaryEntry = async (id: string): Promise<void> => {
  console.log('🔄 Deleting diary entry:', { id });
  try {
    const docRef = doc(db, 'foodDiary', id) as DocumentReference<FoodDiaryEntry>;
    await deleteDoc(docRef);
    console.log('✅ Diary entry deleted successfully:', { id });
  } catch (error) {
    console.error('❌ Failed to delete diary entry:', error);
    throw handleFirestoreError(error);
  }
};

// ===== LEGACY COMPATIBILITY FUNCTIONS =====

// Legacy function: Get food item (now gets from diary entry)
export const getFoodItem = async (id: string): Promise<FoodItem | null> => {
  console.log('🔄 [LEGACY] Fetching food item:', { id });
  const diaryEntry = await getDiaryEntry(id);
  if (!diaryEntry) return null;
  
  // Convert FoodDiaryEntry to FoodItem format
  const foodItem: FoodItem = {
    id: diaryEntry.id,
    name: diaryEntry.name,
    calories: diaryEntry.calories,
    imageUrl: diaryEntry.imageUrl,
    ingredients: diaryEntry.ingredients,
    nutrients: diaryEntry.nutrients,
    description: diaryEntry.description,
    createdAt: diaryEntry.createdAt,
    updatedAt: diaryEntry.updatedAt,
    tempImageUrl: diaryEntry.tempImageUrl,
    imagePlaceholder: diaryEntry.imagePlaceholder
  };
  
  console.log('✅ [LEGACY] Food item converted from diary entry:', { id, name: foodItem.name });
  return foodItem;
};

// Legacy function: Add food item (now adds directly to diary)
export const addFoodItem = async (foodItem: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  console.log('🔄 [LEGACY] Adding food item:', { name: foodItem.name, calories: foodItem.calories });
  
  // Convert to FoodDiaryEntry format with default values
  const diaryEntry: Omit<FoodDiaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
    ...foodItem,
    mealType: 'other', // Default meal type
    date: Timestamp.now() // Default to current time
  };
  
  return await addFoodToDiary(diaryEntry);
};

// Legacy function: Create food item with custom ID
export const createFoodItem = async (id: string, foodItem: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  console.log('🔄 [LEGACY] Creating food item with custom ID:', { id, name: foodItem.name });
  
  // Convert to FoodDiaryEntry format
  const diaryEntry: Omit<FoodDiaryEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    ...foodItem,
    userId: 'current-user-id', // Default user ID
    mealType: 'other', // Default meal type
    date: Timestamp.now() // Default to current time
  };
  
  await createDiaryEntry(id, diaryEntry);
};

// Legacy function: Update food item
export const updateFoodItem = async (id: string, data: Partial<FoodItem>): Promise<void> => {
  console.log('🔄 [LEGACY] Updating food item:', { id, updates: Object.keys(data) });
  
  // Convert FoodItem updates to FoodDiaryEntry updates
  const diaryUpdates: Partial<FoodDiaryEntry> = { ...data };
  await updateDiaryEntry(id, diaryUpdates);
};

// Legacy function: Delete food item
export const deleteFoodItem = async (id: string): Promise<void> => {
  console.log('🔄 [LEGACY] Deleting food item:', { id });
  await deleteDiaryEntry(id);
};

// Legacy function: Upsert food item
export const upsertFoodItem = async (id: string, foodItem: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  console.log('🔄 [LEGACY] Upserting food item:', { id, name: foodItem.name });
  
  const existingEntry = await getDiaryEntry(id);
  if (existingEntry) {
    await updateFoodItem(id, foodItem);
  } else {
    await createFoodItem(id, foodItem);
  }
};

// Legacy function: Add diary entry (now redundant but kept for compatibility)
export const addDiaryEntry = async (entry: Omit<DiaryEntry, 'id' | 'createdAt'>): Promise<string> => {
  console.log('🔄 [LEGACY] Adding diary entry:', { 
    userId: entry.userId, 
    foodItemId: entry.foodItemId,
    mealType: entry.mealType,
    date: entry.date.toDate()
  });
  
  // Get the food item and convert to new format
  const foodItem = await getFoodItem(entry.foodItemId);
  if (!foodItem) {
    throw new Error(`Food item not found: ${entry.foodItemId}`);
  }
  
  // Convert to new FoodDiaryEntry format
  const diaryEntry: Omit<FoodDiaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
    name: foodItem.name,
    calories: foodItem.calories,
    imageUrl: foodItem.imageUrl,
    ingredients: foodItem.ingredients,
    nutrients: foodItem.nutrients,
    description: foodItem.description,
    mealType: entry.mealType,
    date: entry.date,
    tempImageUrl: foodItem.tempImageUrl,
    imagePlaceholder: foodItem.imagePlaceholder
  };
  
  return await addFoodToDiary(diaryEntry, entry.userId);
}; 