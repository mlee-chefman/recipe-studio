import { ScreenContent } from '@components/ScreenContent';
import { RecipeList } from '@components/RecipeList';

export default function TabOneScreen() {
  return (
    <ScreenContent path="screens/one.tsx" title="">
      <RecipeList />
    </ScreenContent>
  );
}
