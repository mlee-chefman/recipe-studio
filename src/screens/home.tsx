import { ScreenContent } from '@components/ScreenContent';
import { RecipeList } from '@components/RecipeList';

export default function HomeScreen() {
  return (
    <ScreenContent path="screens/home.tsx" title="">
      <RecipeList />
    </ScreenContent>
  );
}
