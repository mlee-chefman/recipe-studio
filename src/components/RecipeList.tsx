import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecipeStore, useAuthStore } from '@store/store';
import { Recipe } from '~/types/recipe';
import { FilterModal } from './FilterModal';
import { SortModal } from './SortModal';
import { CompactRecipeCard } from './CompactRecipeCard';
import { GridRecipeCard } from './GridRecipeCard';
import { DetailedRecipeCard } from './DetailedRecipeCard';
import { RecipeCardSkeleton } from './RecipeCardSkeleton';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { SelectionBottomBar } from './SelectionBottomBar';
import RecipeCreatorScreen from '@screens/recipeCreator';
import { useStyles } from '@hooks/useStyles';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';
import { useRecipeListData } from '@hooks/useRecipeListData';
import { useRecipeSelection } from '@hooks/useRecipeSelection';
import {
  getActiveFiltersCount,
  getUniqueCategories,
  getUniqueTags,
  getUniqueAppliances,
  DIFFICULTY_OPTIONS,
} from '@utils/recipeListHelpers';

interface RecipeListProps {
  tabType: 'home' | 'myRecipes';
}

export const RecipeList = ({ tabType }: RecipeListProps) => {
  const navigation = useNavigation();
  const recipeStore = useRecipeStore();
  const { user } = useAuthStore();
  const appTheme = useAppTheme();
  const styles = useStyles(createStyles);

  // Use custom hooks
  const {
    recipes,
    filteredRecipes,
    isLoading,
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    selectedTags,
    selectedAppliance,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    setSelectedTags,
    setSelectedAppliance,
    filterRecipes,
    viewMode,
    sortOption,
    setSortOption,
    selectionMode,
  } = useRecipeListData(tabType);

  const {
    selectedRecipeIds,
    toggleRecipeSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    isSelected,
  } = useRecipeSelection({
    selectionMode,
    filteredRecipes,
    userId: user?.uid,
  });

  const isHomeTab = tabType === 'home';

  // Modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure recipes are filtered on mount
  useEffect(() => {
    filterRecipes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get filter options
  const categories = getUniqueCategories(recipes);
  const difficulties = DIFFICULTY_OPTIONS;
  const allTags = getUniqueTags(recipes);
  const appliances = getUniqueAppliances(recipes);

  const handleRecipePress = (recipe: Recipe) => {
    if (selectionMode) {
      toggleRecipeSelection(recipe.id);
    } else {
      // @ts-ignore - Navigation typing issue with static navigation
      navigation.navigate('RecipeDetail', { recipe });
    }
  };

  const handleEditComplete = () => {
    setShowEditModal(false);
    setEditingRecipe(null);
    filterRecipes();
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedTags([]);
    setSelectedAppliance('');
  };

  const handleRefresh = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      if (isHomeTab) {
        await recipeStore.fetchRecipes(user.uid);
      } else {
        await recipeStore.fetchUserRecipes(user.uid);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeFiltersCount = getActiveFiltersCount(
    selectedCategory,
    selectedDifficulty,
    selectedTags,
    selectedAppliance
  );

  const renderRecipeCard = (item: Recipe) => {
    const selected = isSelected(item.id);

    if (viewMode === 'grid') {
      return (
        <View style={{ flex: 1, margin: 4 }}>
          <GridRecipeCard
            recipe={item}
            onPress={() => handleRecipePress(item)}
            showStatus={!isHomeTab}
            isSelectionMode={selectionMode}
            isSelected={selected}
          />
        </View>
      );
    } else if (viewMode === 'compact') {
      return (
        <CompactRecipeCard
          recipe={item}
          onPress={() => handleRecipePress(item)}
          showStatus={!isHomeTab}
          isSelectionMode={selectionMode}
          isSelected={selected}
        />
      );
    } else {
      return (
        <DetailedRecipeCard
          recipe={item}
          onPress={() => handleRecipePress(item)}
          showStatus={!isHomeTab}
          isSelectionMode={selectionMode}
          isSelected={selected}
        />
      );
    }
  };

  const renderSkeletonCard = () => {
    if (viewMode === 'grid') {
      return (
        <View style={{ flex: 1, margin: 4 }}>
          <RecipeCardSkeleton viewMode="grid" />
        </View>
      );
    } else if (viewMode === 'compact') {
      return <RecipeCardSkeleton viewMode="compact" />;
    } else {
      return <RecipeCardSkeleton viewMode="detailed" />;
    }
  };

  return (
    <View className="flex-1 w-full" style={styles.container}>
      {/* Fixed Header */}
      <View className="px-4 pb-2 w-full" style={styles.header}>
        {/* Search Input, Sort, and Filter Buttons */}
        <View className="flex-row mb-3 gap-2">
          <TextInput
            className="flex-1 rounded-lg px-4 py-3 text-base"
            style={{
              backgroundColor: appTheme.colors.surface.primary,
              borderWidth: 1,
              borderColor: appTheme.colors.border.main,
              color: appTheme.colors.text.primary
            }}
            placeholder="Search recipes..."
            placeholderTextColor={appTheme.colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={() => setSortModalVisible(true)}
            className="rounded-lg px-3 py-3 items-center justify-center"
            style={{ backgroundColor: appTheme.colors.secondary[500] }}
          >
            <View className="flex-row items-center">
              <Text className="text-white font-medium text-sm">Sort</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className="rounded-lg px-3 py-3 items-center justify-center"
            style={{ backgroundColor: appTheme.colors.primary[500] }}
          >
            <View className="flex-row items-center">
              <Text className="text-white font-medium text-sm mr-1">Filter</Text>
              {activeFiltersCount > 0 && (
                <View className="bg-white rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-xs font-bold" style={{ color: appTheme.colors.primary[500] }}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        <ActiveFiltersDisplay
          selectedCategory={selectedCategory}
          selectedDifficulty={selectedDifficulty}
          selectedTags={selectedTags}
          selectedAppliance={selectedAppliance}
          onCategoryRemove={() => setSelectedCategory('')}
          onDifficultyRemove={() => setSelectedDifficulty('')}
          onTagRemove={(tag) => setSelectedTags(selectedTags.filter(t => t !== tag))}
          onApplianceRemove={() => setSelectedAppliance('')}
        />

        {/* Results Count */}
        <Text className="text-sm mb-2" style={{ color: appTheme.colors.text.secondary }}>
          {isLoading ? 'Loading recipes...' : `${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Scrollable Recipe List */}
      <View className="flex-1 w-full">
        {isLoading ? (
          <FlatList
            key={`${viewMode}-skeleton`}
            data={[1, 2, 3, 4, 5, 6]}
            keyExtractor={(item) => `skeleton-${item}`}
            numColumns={viewMode === 'grid' ? 2 : 1}
            renderItem={renderSkeletonCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 20,
              paddingHorizontal: viewMode === 'grid' ? 12 : 16,
              minHeight: '100%',
            }}
            columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={appTheme.colors.primary[500]}
                colors={[appTheme.colors.primary[500]]}
              />
            }
          />
        ) : (
          <FlatList
            key={`${viewMode}-list`}
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === 'grid' ? 2 : 1}
            renderItem={({ item }) => renderRecipeCard(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: selectionMode ? 100 : 20,
              paddingHorizontal: viewMode === 'grid' ? 12 : 16,
              flexGrow: 1,
            }}
            columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={appTheme.colors.primary[500]}
                colors={[appTheme.colors.primary[500]]}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-8 w-full">
                <Text className="text-center" style={{ color: appTheme.colors.text.tertiary }}>
                  No recipes found matching your criteria.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Selection Mode Bottom Bar */}
      {selectionMode && (
        <SelectionBottomBar
          selectedCount={selectedRecipeIds.size}
          totalCount={filteredRecipes.length}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onDelete={deleteSelected}
        />
      )}

      {/* Sort Modal */}
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        selectedSort={sortOption}
        onSortChange={setSortOption}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        categories={categories}
        difficulties={difficulties}
        allTags={allTags}
        appliances={appliances}
        selectedCategory={selectedCategory}
        selectedDifficulty={selectedDifficulty}
        selectedTags={selectedTags}
        selectedAppliance={selectedAppliance}
        onCategoryChange={setSelectedCategory}
        onDifficultyChange={setSelectedDifficulty}
        onTagsChange={setSelectedTags}
        onApplianceChange={setSelectedAppliance}
        onClearFilters={handleClearFilters}
      />

      {/* Edit Recipe Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowEditModal(false)}
      >
        <RecipeCreatorScreen
          onComplete={handleEditComplete}
        />
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    backgroundColor: theme.colors.background.secondary,
  },
});
