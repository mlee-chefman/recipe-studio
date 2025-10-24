import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// You'll need to replace these with your actual Firebase project credentials

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: 'reciep-studio.firebaseapp.com',
  projectId: 'reciep-studio',
  storageBucket: 'reciep-studio.firebasestorage.app',
  messagingSenderId: '727004354105',
  appId: '1:727004354105:web:8297078d4543f135b2dfe8',
  measurementId: 'G-E0X1Q69HW6',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
