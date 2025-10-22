import React, { useState, useEffect } from 'react';
import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import RecipeDetail from '@screens/recipeDetail';
import RecipeCreator from '@screens/recipeCreator';
import RecipeInfo from '@screens/RecipeInfo';
import RecipeEdit from '@screens/recipeEdit';
import RecipeWebImport from '@screens/RecipeWebImport';
import RecipeOCRImport from '@screens/RecipeOCRImport';
import RecipeTextImport from '@screens/RecipeTextImport';
import RecipePDFImport from '@screens/RecipePDFImport';
import RecipeSelection from '@screens/RecipeSelection';
import ThemeSettings from '@screens/ThemeSettings';
import MyFridgeRecipeDetail from '@screens/MyFridgeRecipeDetail';
import SignUpScreen from '@screens/signup';
import SignInScreen from '@screens/signin';
import TabNavigator from './tabNavigator';
import AuthWrapper from '../components/AuthWrapper';
import { useAuthStore } from '../store/store';
import { getHasSignedUpBefore } from '../services/authStorageService';

// Auth Stack for unauthenticated users (starts with SignUp)
const AuthStackSignUp = createStackNavigator({
  screenOptions: {
    headerBackTitle: '',
    headerBackTitleVisible: false,
  },
  screens: {
    SignUp: {
      screen: SignUpScreen,
      options: {
        headerShown: false,
      },
    },
    SignIn: {
      screen: SignInScreen,
      options: {
        headerShown: false,
      },
    },
  },
});

// Auth Stack for returning users (starts with SignIn)
const AuthStackSignIn = createStackNavigator({
  screenOptions: {
    headerBackTitle: '',
    headerBackTitleVisible: false,
  },
  screens: {
    SignIn: {
      screen: SignInScreen,
      options: {
        headerShown: false,
      },
    },
    SignUp: {
      screen: SignUpScreen,
      options: {
        headerShown: false,
      },
    },
  },
});

// Main Stack for authenticated users
const MainStack = createStackNavigator({
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
    MyFridgeRecipeDetail: {
      screen: MyFridgeRecipeDetail,
      options: {
        headerShown: false,
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
    RecipeInfo: {
      screen: RecipeInfo,
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
    ThemeSettings: {
      screen: ThemeSettings,
      options: {
        headerShown: true,
        presentation: 'card',
        title: 'Theme Settings',
      },
    }
  },
});

// Create the navigation components
const AuthNavigationSignUp = createStaticNavigation(AuthStackSignUp);
const AuthNavigationSignIn = createStaticNavigation(AuthStackSignIn);
const MainNavigation = createStaticNavigation(MainStack);

// Root component that conditionally renders auth or main stack
function RootNavigator() {
  const { isAuthenticated } = useAuthStore();
  const [hasSignedUpBefore, setHasSignedUpBefore] = useState(false);
  const [isCheckingSignUpStatus, setIsCheckingSignUpStatus] = useState(true);

  // Check if user has signed up before
  useEffect(() => {
    const checkSignUpStatus = async () => {
      const hasSigned = await getHasSignedUpBefore();
      setHasSignedUpBefore(hasSigned);
      setIsCheckingSignUpStatus(false);
    };
    checkSignUpStatus();
  }, []);

  // Show nothing while checking signup status
  if (isCheckingSignUpStatus) {
    return null;
  }

  if (isAuthenticated) {
    return <MainNavigation />;
  } else {
    // Show SignIn screen if user has signed up before, otherwise SignUp
    return hasSignedUpBefore ? <AuthNavigationSignIn /> : <AuthNavigationSignUp />;
  }
}

type AuthStackParamList = StaticParamList<typeof AuthStackSignIn>;
type MainStackParamList = StaticParamList<typeof MainStack>;

declare global {
  namespace ReactNavigation {
     
    interface RootParamList extends AuthStackParamList, MainStackParamList {}
  }
}

// Wrap the root navigator with AuthWrapper
function Navigation() {
  return (
    <AuthWrapper>
      <RootNavigator />
    </AuthWrapper>
  );
}

export default Navigation;
