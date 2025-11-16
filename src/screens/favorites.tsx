import { useEffect } from 'react';
import { ScreenContent } from '@components/ScreenContent';
import { RecipeList } from '@components/RecipeList';
import { useAuthStore } from '@store/store';
import { useRecipeStore } from '@store/store';

export default function FavoritesScreen() {
  const { user } = useAuthStore();
  const { fetchRecipes } = useRecipeStore();

  useEffect(() => {
    // Fetch recipes when component mounts and user is authenticated
    if (user?.uid) {
      fetchRecipes(user.uid);
    }
  }, [user?.uid, fetchRecipes]);

  return (
    <ScreenContent path="screens/favorites.tsx" title="">
      <RecipeList tabType="home" />
    </ScreenContent>
  );
}
