import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Modal from '../screens/modal';
import RecipeDetail from '../screens/recipeDetail';
import RecipeCreator from '../screens/recipeCreator';
import RecipeEdit from '../screens/recipeEdit';
import TabNavigator from './tabNavigator';

const Stack = createStackNavigator({
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
        presentation: 'card',
      },
    },
    RecipeEdit: {
      screen: RecipeEdit,
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
