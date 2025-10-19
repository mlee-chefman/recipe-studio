import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  DocumentData,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../services/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProfileData {
  uid: string;
  email: string;
  name: string;
}

export interface UpdateUserProfileData {
  name?: string;
  email?: string;
}

// Create a new user profile in Firestore
export const createUserProfile = async (data: CreateUserProfileData): Promise<void> => {
  try {
    const userRef = doc(db, 'users', data.uid);
    const now = new Date();
    
    const userProfile: UserProfile = {
      uid: data.uid,
      email: data.email,
      name: data.name,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(userRef, userProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap: DocumentSnapshot<DocumentData> = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid: data.uid,
        email: data.email,
        name: data.name,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile in Firestore
export const updateUserProfile = async (
  uid: string,
  data: UpdateUserProfileData
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Check if user profile exists
export const userProfileExists = async (uid: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error('Error checking user profile existence:', error);
    throw error;
  }
};
