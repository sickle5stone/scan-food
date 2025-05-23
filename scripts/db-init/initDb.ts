import {
  Timestamp,
  doc,
  getFirestore,
  setDoc,
  writeBatch
} from 'firebase/firestore';

import { initializeApp } from 'firebase/app';

// Helper to check required env vars
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: requireEnv('FIREBASE_API_KEY'),
  authDomain: requireEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('FIREBASE_APP_ID')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data for testing
const sampleFoodItems = [
  {
    id: 'french-toast-001',
    name: 'French Toast',
    calories: 350,
    imageUrl: 'https://example.com/french-toast.jpg',
    ingredients: [
      {
        name: 'Bread',
        weight: '2 slices',
        calories: 160
      },
      {
        name: 'Egg',
        weight: '1 large',
        calories: 70
      },
      {
        name: 'Milk',
        weight: '1/4 cup',
        calories: 30
      }
    ],
    nutrients: [
      {
        name: 'Protein',
        amount: '12g',
        rda: '24%'
      },
      {
        name: 'Carbohydrates',
        amount: '45g',
        rda: '15%'
      },
      {
        name: 'Fat',
        amount: '15g',
        rda: '23%'
      }
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: 'scrambled-eggs-001',
    name: 'Scrambled Eggs',
    calories: 220,
    imageUrl: 'https://example.com/scrambled-eggs.jpg',
    ingredients: [
      {
        name: 'Eggs',
        weight: '2 large',
        calories: 140
      },
      {
        name: 'Butter',
        weight: '1 tbsp',
        calories: 80
      }
    ],
    nutrients: [
      {
        name: 'Protein',
        amount: '16g',
        rda: '32%'
      },
      {
        name: 'Fat',
        amount: '18g',
        rda: '28%'
      },
      {
        name: 'Carbohydrates',
        amount: '2g',
        rda: '1%'
      }
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

const sampleDiaryEntries = [
  {
    id: 'diary-entry-001',
    userId: 'current-user-id',
    foodItemId: 'french-toast-001',
    mealType: 'breakfast',
    date: Timestamp.now(),
    createdAt: Timestamp.now()
  },
  {
    id: 'diary-entry-002',
    userId: 'current-user-id',
    foodItemId: 'scrambled-eggs-001',
    mealType: 'breakfast',
    date: Timestamp.now(),
    createdAt: Timestamp.now()
  }
];

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    const batch = writeBatch(db);

    // Create food items with custom IDs using setDoc
    console.log('Creating food items...');
    for (const foodItem of sampleFoodItems) {
      const { id, ...foodItemData } = foodItem;
      const docRef = doc(db, 'foodItems', id);
      batch.set(docRef, foodItemData);
    }

    // Create diary entries with custom IDs using setDoc
    console.log('Creating diary entries...');
    for (const entry of sampleDiaryEntries) {
      const { id, ...entryData } = entry;
      const docRef = doc(db, 'diaryEntries', id);
      batch.set(docRef, entryData);
    }

    // Commit the batch
    await batch.commit();
    console.log('Database initialization completed successfully!');

    // Optional: Create additional sample data using individual setDoc calls
    console.log('Creating additional sample data...');
    
    const additionalFoodItem = {
      name: 'Grilled Chicken Breast',
      calories: 165,
      imageUrl: 'https://example.com/grilled-chicken.jpg',
      ingredients: [
        {
          name: 'Chicken Breast',
          weight: '100g',
          calories: 165
        }
      ],
      nutrients: [
        {
          name: 'Protein',
          amount: '31g',
          rda: '62%'
        },
        {
          name: 'Fat',
          amount: '4g',
          rda: '6%'
        },
        {
          name: 'Carbohydrates',
          amount: '0g',
          rda: '0%'
        }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Use setDoc with custom ID
    await setDoc(doc(db, 'foodItems', 'grilled-chicken-001'), additionalFoodItem);
    console.log('Additional food item created with custom ID');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('Database initialization script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }); 