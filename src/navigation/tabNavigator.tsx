import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ViewToggleButton, ViewMode } from '@components/ViewToggleButton';
import { SelectModeButton } from '@components/SelectModeButton';
import { TabBarIcon } from '@components/TabBarIcon';
import Home from '@screens/home';
import MyFridge from '@screens/MyFridge';
import MyRecipes from '@screens/MyRecipes';
import Settings from '@screens/settings';
import CreateRecipeOptionsModal from '@components/CreateRecipeOptionsModal';
import { useRecipeStore } from '@store/store';
import { useAppTheme, theme } from '@theme/index';

// Custom Tab Bar Component with centered + button
function CustomTabBar({ state, descriptors, navigation }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const appTheme = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    tabBarContainer: {
      flexDirection: 'row',
      width: '100%',
      height: 80,
      backgroundColor: appTheme.colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: appTheme.colors.gray[200],
      paddingBottom: 8,
      paddingTop: 8,
      alignItems: 'center',
    },
    tabButton: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
      textAlign: 'center',
    },
    centerButtonContainer: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -30, // Raise button above tab bar
    },
    centerButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: appTheme.colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  }), [appTheme]);

  const handleWebImport = () => {
    setShowCreateModal(false);
    navigation.navigate('RecipeWebImport');
  };

  const handleOCRImport = () => {
    setShowCreateModal(false);
    navigation.navigate('RecipeOCRImport');
  };

  const handleTextImport = () => {
    setShowCreateModal(false);
    navigation.navigate('RecipeTextImport');
  };

  const handlePDFImport = () => {
    setShowCreateModal(false);
    navigation.navigate('RecipePDFImport');
  };

  const handleStartFromScratch = () => {
    setShowCreateModal(false);
    navigation.navigate('RecipeCreator');
  };

  return (
    <>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Render tabs 0 and 1 (All Recipes and Favorites)
          if (index === 0 || index === 1) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabButton}
              >
                {options.tabBarIcon?.({
                  color: isFocused ? appTheme.colors.primary[500] : appTheme.colors.gray[400]
                })}
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? appTheme.colors.primary[500] : appTheme.colors.gray[400] }
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }

          // Render tab 2 (My Recipes) with center button before it
          if (index === 2) {
            return (
              <React.Fragment key={route.key}>
                {/* Center + Button */}
                <View style={styles.centerButtonContainer}>
                  <TouchableOpacity
                    style={styles.centerButton}
                    onPress={() => setShowCreateModal(true)}
                    activeOpacity={0.8}
                  >
                    <TabBarIcon name="plus" color="white" />
                  </TouchableOpacity>
                </View>

                {/* My Recipes Tab */}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  style={styles.tabButton}
                >
                  {options.tabBarIcon?.({
                    color: isFocused ? appTheme.colors.primary[500] : appTheme.colors.gray[400]
                  })}
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? appTheme.colors.primary[500] : appTheme.colors.gray[400] }
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          }

          // Render tab 3 (Settings)
          if (index === 3) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabButton}
              >
                {options.tabBarIcon?.({
                  color: isFocused ? appTheme.colors.primary[500] : appTheme.colors.gray[400]
                })}
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? appTheme.colors.primary[500] : appTheme.colors.gray[400] }
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }

          return null;
        })}
      </View>

      {/* Create Recipe Options Modal */}
      <CreateRecipeOptionsModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelectWebImport={handleWebImport}
        onSelectOCRImport={handleOCRImport}
        onSelectTextImport={handleTextImport}
        onSelectPDFImport={handlePDFImport}
        onSelectStartFromScratch={handleStartFromScratch}
      />
    </>
  );
}

// Header Right Component for Home Tab (All Recipes)
function HomeHeaderRightButtons() {
  const { allRecipesViewMode, setAllRecipesViewMode } = useRecipeStore();

  const toggleViewMode = () => {
    const modes: ViewMode[] = ['detailed', 'compact', 'grid'];
    const currentIndex = modes.indexOf(allRecipesViewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setAllRecipesViewMode(modes[nextIndex]);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <ViewToggleButton viewMode={allRecipesViewMode} onToggle={toggleViewMode} />
    </View>
  );
}

// Header Right Component for MyFridge Tab (empty for now)
function MyFridgeHeaderRightButtons() {
  return null;
}

// Header Right Component for MyRecipes Tab
function MyRecipesHeaderRightButtons() {
  const { userRecipesViewMode, setUserRecipesViewMode, selectionMode, setSelectionMode, filteredUserRecipes } = useRecipeStore();

  const toggleViewMode = () => {
    const modes: ViewMode[] = ['detailed', 'compact', 'grid'];
    const currentIndex = modes.indexOf(userRecipesViewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setUserRecipesViewMode(modes[nextIndex]);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
  };

  const hasRecipes = filteredUserRecipes.length > 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <SelectModeButton
        isSelectionMode={selectionMode}
        onToggle={toggleSelectionMode}
        disabled={!hasRecipes}
      />
      <ViewToggleButton viewMode={userRecipesViewMode} onToggle={toggleViewMode} />
    </View>
  );
}

const Tab = createBottomTabNavigator({
  screenOptions: function ScreenOptions() {
    return {
      tabBarActiveTintColor: theme.colors.primary[500],
      tabBarStyle: {
        width: '100%',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
      },
    };
  },
  tabBar: (props: any) => <CustomTabBar {...props} />,
  screens: {
    Home: {
      screen: Home,
      options: () => ({
        title: 'All Recipes',
        tabBarLabel: 'All',
        tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        headerRight: () => <HomeHeaderRightButtons />,
      }),
    },
    MyRecipes: {
      screen: MyRecipes,
      options: {
        title: 'My Recipes',
        tabBarLabel: 'My Recipes',
        tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        headerRight: () => <MyRecipesHeaderRightButtons />,
      },
    },
    MyFridge: {
      screen: MyFridge,
      options: () => ({
        title: 'My Fridge',
        tabBarLabel: 'My Fridge',
        tabBarIcon: ({ color }) => <TabBarIcon name="cube" color={color} />,
        headerRight: () => <MyFridgeHeaderRightButtons />,
      }),
    },
    Settings: {
      screen: Settings,
      options: {
        title: 'Settings',
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
      },
    },
  },
});

export default Tab;
