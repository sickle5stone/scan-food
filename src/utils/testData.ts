import { Timestamp } from 'firebase/firestore';
import { addFoodToDiary, FoodDiaryEntry } from '../services/firestoreService';

// Sample food diary entries for testing
const sampleFoodDiaryEntries: Omit<FoodDiaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'French Toast',
    calories: 350,
    imageUrl: '',
    ingredients: [
      { name: 'Bread', weight: '2 slices', calories: 160 },
      { name: 'Egg', weight: '1 large', calories: 70 },
      { name: 'Milk', weight: '1/4 cup', calories: 30 }
    ],
    nutrients: [
      { name: 'Protein', amount: '12', rda: '24%' },
      { name: 'Carbohydrates', amount: '45', rda: '15%' },
      { name: 'Fat', amount: '15', rda: '23%' }
    ],
    description: 'Delicious French toast made with eggs and milk',
    mealType: 'breakfast',
    date: Timestamp.now()
  },
  {
    name: 'Scrambled Eggs',
    calories: 220,
    imageUrl: '',
    ingredients: [
      { name: 'Eggs', weight: '2 large', calories: 140 },
      { name: 'Butter', weight: '1 tbsp', calories: 80 }
    ],
    nutrients: [
      { name: 'Protein', amount: '16', rda: '32%' },
      { name: 'Fat', amount: '18', rda: '28%' },
      { name: 'Carbohydrates', amount: '2', rda: '1%' }
    ],
    description: 'Fluffy scrambled eggs cooked with butter',
    mealType: 'breakfast',
    date: Timestamp.now()
  },
  {
    name: 'Grilled Chicken Salad',
    calories: 280,
    imageUrl: '',
    ingredients: [
      { name: 'Chicken Breast', weight: '4 oz', calories: 185 },
      { name: 'Mixed Greens', weight: '2 cups', calories: 20 },
      { name: 'Olive Oil', weight: '1 tbsp', calories: 120 }
    ],
    nutrients: [
      { name: 'Protein', amount: '35', rda: '70%' },
      { name: 'Fat', amount: '15', rda: '23%' },
      { name: 'Carbohydrates', amount: '8', rda: '3%' }
    ],
    description: 'Healthy grilled chicken salad with mixed greens',
    mealType: 'lunch',
    date: Timestamp.now()
  },
  {
    name: 'Grilled Salmon',
    calories: 320,
    imageUrl: '',
    ingredients: [
      { name: 'Salmon Fillet', weight: '5 oz', calories: 280 },
      { name: 'Olive Oil', weight: '1 tsp', calories: 40 }
    ],
    nutrients: [
      { name: 'Protein', amount: '40', rda: '80%' },
      { name: 'Fat', amount: '18', rda: '28%' },
      { name: 'Carbohydrates', amount: '0', rda: '0%' }
    ],
    description: 'Perfectly grilled salmon with herbs',
    mealType: 'dinner',
    date: Timestamp.now()
  },
  {
    name: 'Apple with Peanut Butter',
    calories: 190,
    imageUrl: '',
    ingredients: [
      { name: 'Apple', weight: '1 medium', calories: 95 },
      { name: 'Peanut Butter', weight: '1 tbsp', calories: 95 }
    ],
    nutrients: [
      { name: 'Protein', amount: '4', rda: '8%' },
      { name: 'Fat', amount: '8', rda: '12%' },
      { name: 'Carbohydrates', amount: '25', rda: '8%' }
    ],
    description: 'Healthy snack with natural peanut butter',
    mealType: 'snack',
    date: Timestamp.now()
  }
];

export const addTestData = async (): Promise<void> => {
  try {
    console.log('🔄 Adding test data to database...');
    
    // Add food diary entries directly
    for (let i = 0; i < sampleFoodDiaryEntries.length; i++) {
      const entry = sampleFoodDiaryEntries[i];
      
      // Add slight time offset to each entry for better sorting
      const entryWithOffset = {
        ...entry,
        date: Timestamp.fromMillis(Date.now() - (i * 60000)) // 1 minute apart
      };
      
      const entryId = await addFoodToDiary(entryWithOffset);
      console.log(`✅ Added ${entry.name} to diary as ${entry.mealType} (ID: ${entryId})`);
    }
    
    console.log('🎉 Test data added successfully!');
  } catch (error) {
    console.error('❌ Failed to add test data:', error);
    throw error;
  }
};

// Function to call from browser console
declare global {
  interface Window {
    addTestData: () => Promise<void>;
  }
}

window.addTestData = addTestData; 