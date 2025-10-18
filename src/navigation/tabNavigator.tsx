import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { ViewToggleButton, ViewMode } from '@components/ViewToggleButton';
import { SelectModeButton } from '@components/SelectModeButton';
import { TabBarIcon } from '@components/TabBarIcon';
import Home from '@screens/home';
import Settings from '@screens/settings';
import CreateRecipeOptionsModal from '@components/CreateRecipeOptionsModal';
import { useRecipeStore } from '@store/store';
import { theme } from '@theme/index';

// Custom Tab Bar Component with centered + button
function CustomTabBar({ state, descriptors, navigation }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false);

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

          // Render first tab
          if (index === 0) {
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
                  color: isFocused ? theme.colors.primary[500] : theme.colors.gray[400]
                })}
              </TouchableOpacity>
            );
          }

          // Render second tab (after the center button)
          if (index === 1) {
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

                {/* Second Tab */}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  style={styles.tabButton}
                >
                  {options.tabBarIcon?.({
                    color: isFocused ? theme.colors.primary[500] : theme.colors.gray[400]
                  })}
                </TouchableOpacity>
              </React.Fragment>
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

// Header Right Component with Selection and View Toggle Buttons
function HeaderRightButtons() {
  const { viewMode, setViewMode, selectionMode, setSelectionMode, filteredRecipes } = useRecipeStore();

  const toggleViewMode = () => {
    const modes: ViewMode[] = ['detailed', 'compact', 'grid'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
  };

  const hasRecipes = filteredRecipes.length > 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <SelectModeButton
        isSelectionMode={selectionMode}
        onToggle={toggleSelectionMode}
        disabled={!hasRecipes}
      />
      <ViewToggleButton viewMode={viewMode} onToggle={toggleViewMode} />
    </View>
  );
}

const Tab = createBottomTabNavigator({
  screenOptions: function ScreenOptions() {
    return {
      tabBarActiveTintColor: theme.colors.primary[500],
    };
  },
  tabBar: (props: any) => <CustomTabBar {...props} />,
  screens: {
    Home: {
      screen: Home,
      options: () => ({
        title: 'Recipes',
        tabBarIcon: ({ color }) => <TabBarIcon name="archive" color={color} />,
        headerRight: () => <HeaderRightButtons />,
      }),
    },
    Settings: {
      screen: Settings,
      options: {
        title: 'Settings',
        tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
      },
    },
  },
});

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30, // Raise button above tab bar
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary[500],
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
});

export default Tab;
