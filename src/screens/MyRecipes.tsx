import { useEffect } from 'react';
import { ScreenContent } from '@components/ScreenContent';
import { RecipeList } from '@components/RecipeList';
import { useAuthStore } from '@store/store';
import { useRecipeStore } from '@store/store';

export default function MyRecipesScreen() {
  const { user } = useAuthStore();
  const { fetchUserRecipes } = useRecipeStore();

  useEffect(() => {
    // Fetch user's recipes when component mounts and user is authenticated
    if (user?.uid) {
      fetchUserRecipes(user.uid);
    }
  }, [user?.uid, fetchUserRecipes]);

  return (
    <ScreenContent path="screens/MyRecipes.tsx" title="">
      <RecipeList tabType="myRecipes" />
    </ScreenContent>
  );
}
