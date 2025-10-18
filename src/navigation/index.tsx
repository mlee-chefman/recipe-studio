import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Modal from '@screens/modal';
import RecipeDetail from '@screens/recipeDetail';
import RecipeCreator from '@screens/recipeCreator';
import RecipeEdit from '@screens/recipeEdit';
import RecipeWebImport from '@screens/RecipeWebImport';
import RecipeOCRImport from '@screens/RecipeOCRImport';
import RecipeTextImport from '@screens/RecipeTextImport';
import RecipePDFImport from '@screens/RecipePDFImport';
import RecipeSelection from '@screens/RecipeSelection';
import TabNavigator from './tabNavigator';

const Stack = createStackNavigator({
  screenOptions: {
    headerBackTitle: '',
    headerBackTitleVisible: false,
  },
  screens: {
    TabNavigator: {
      screen: TabNavigator,
      options: {
        headerShown: false,
      },
    },
    RecipeDetail: {
      screen: RecipeDetail,
      options: {
        headerShown: true,
        presentation: 'card',
      },
    },
    RecipeCreator: {
      screen: RecipeCreator,
      options: {
        headerShown: true,
        presentation: 'modal',
      },
    },
    RecipeEdit: {
      screen: RecipeEdit,
      options: {
        headerShown: true,
        presentation: 'card',
      },
    },
    RecipeWebImport: {
      screen: RecipeWebImport,
      options: {
        headerShown: true,
        presentation: 'card',
      },
    },
    RecipeOCRImport: {
      screen: RecipeOCRImport,
      options: {
        headerShown: true,
        presentation: 'card',
      },
    },
    RecipeTextImport: {
      screen: RecipeTextImport,
      options: {
        headerShown: true,
        presentation: 'card',
      },
    },
    RecipePDFImport: {
      screen: RecipePDFImport,
      options: {
        headerShown: true,
        presentation: 'card',
      },
    },
    RecipeSelection: {
      screen: RecipeSelection,
      options: {
        headerShown: true,
        presentation: 'card',
      },
    },
    Modal: {
      screen: Modal,
      options: {
        presentation: 'modal',
        headerLeft: () => null,
      },
    },
  },
});

type RootNavigatorParamList = StaticParamList<typeof Stack>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootNavigatorParamList {}
  }
}

const Navigation = createStaticNavigation(Stack);
export default Navigation;
