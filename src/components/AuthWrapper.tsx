import React, { useEffect } from 'react';

import { onAuthStateChange, convertToAuthUser } from '../modules/user/userAuth';
import { getUserProfile } from '../modules/user/userService';
import { useAuthStore } from '../store/store';
import { HomeScreenSkeleton } from './HomeScreenSkeleton';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { setUser, setUserProfile, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Convert Firebase user to AuthUser
          const authUser = convertToAuthUser(firebaseUser);
          setUser(authUser);

          // Get user profile from Firestore
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(null);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setUserProfile, setLoading]);

  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  return <>{children}</>;
}