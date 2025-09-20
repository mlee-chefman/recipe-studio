import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HeaderButton } from '../components/HeaderButton';
import { TabBarIcon } from '../components/TabBarIcon';
import One from '../screens/one';
import Two from '../screens/two';
import RecipeCreator from '../screens/recipe-creator';

const Tab = createBottomTabNavigator({
  screenOptions: function ScreenOptions() {
    return {
      tabBarActiveTintColor: 'black',
    };
  },
  screens: {
    One: {
      screen: One,
      options: ({ navigation }) => ({
        title: 'Recipes',
        tabBarIcon: ({ color }) => <TabBarIcon name="archive" color={color} />,
        headerRight: () => <HeaderButton onPress={() => navigation.navigate('Modal')} />,
      }),
    },
    RecipeCreator: {
      screen: RecipeCreator,
      options: {
        title: 'Create',
        tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
      },
    },
    Two: {
      screen: Two,
      options: {
        title: 'Tab Two',
        tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
      },
    },
  },
});

export default Tab;
