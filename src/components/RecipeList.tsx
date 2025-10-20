import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { useRecipeStore, useAuthStore } from '@store/store';
import { Recipe } from '~/types/recipe';
import { FilterModal } from './FilterModal';
import { CompactRecipeCard } from './CompactRecipeCard';
import { GridRecipeCard } from './GridRecipeCard';
import { getApplianceById } from '~/types/chefiq';
import RecipeCreatorScreen from '@screens/recipeCreator';
import { theme } from '@theme/index';

const RecipeCard = ({
  recipe,
  onPress,
  showStatus = false,
  isSelectionMode = false,
  isSelected = false
}: {
  recipe: Recipe;
  onPress: () => void;
  showStatus?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className={`bg-white rounded-lg mb-3 shadow-sm border-2 overflow-hidden ${
        isSelected ? 'border-green-500' : 'border-gray-200'
      }`}>
        {/* Recipe Image */}
        <View style={{ position: 'relative' }}>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={{ width: '100%', height: 160 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-40 bg-gray-100 items-center justify-center">
              <Text className="text-4xl text-gray-400">🍽️</Text>
              <Text className="text-gray-500 text-sm mt-1">No Image</Text>
            </View>
          )}

          {/* Status Badge - Absolutely positioned on image */}
          {showStatus && (
            <View style={styles.statusBadge}>
              <View className={`px-3 py-1.5 rounded-lg ${recipe.status === 'Published' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                <Text className="text-xs font-bold text-white">
                  {recipe.status}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Recipe Content */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">{recipe.title}</Text>
          <Text className="text-gray-600 mb-2 line-clamp-2">{recipe.description}</Text>

          {/* Author */}
          {recipe.authorName && (
            <View className="flex-row items-center mb-3">
              {recipe.authorProfilePicture && (
                <Image
                  source={{ uri: recipe.authorProfilePicture }}
                  style={{ width: 20, height: 20, borderRadius: 10, marginRight: 6 }}
                  contentFit="cover"
                />
              )}
              <Text className="text-xs text-gray-500">
                By {recipe.authorName}
              </Text>
            </View>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mb-3">
              {recipe.tags.slice(0, 4).map((tag, index) => (
                <View key={index} className="px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.primary[100] }}>
                  <Text className="text-xs" style={{ color: theme.colors.primary[700] }}>{tag}</Text>
                </View>
              ))}
              {recipe.tags.length > 4 && (
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.gray[200] }}>
                  <Text className="text-xs" style={{ color: theme.colors.text.secondary }}>+{recipe.tags.length - 4}</Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-500 mr-4">⏱️ {recipe.cookTime} min</Text>
              <Text className="text-sm text-gray-500 mr-4">👥 {recipe.servings} servings</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-wrap gap-1">
              <Text className="text-sm font-medium mr-2" style={{ color: theme.colors.primary[500] }}>{recipe.category}</Text>
              {recipe.chefiqAppliance && (
                <View className="flex-row items-center gap-1">
                  <View className="px-2 py-1 rounded-full flex-row items-center" style={{ backgroundColor: theme.colors.primary[100] }}>
                    <Text className="text-xs mr-1">🍳</Text>
                    <Text className="text-xs font-medium" style={{ color: theme.colors.primary[500] }}>
                      {getApplianceById(recipe.chefiqAppliance)?.short_code || 'iQ'}
                    </Text>
                  </View>
                  {recipe.useProbe && (
                    <View className="bg-orange-100 px-1.5 py-0.5 rounded-full">
                      <Text className="text-xs text-orange-800">🌡️</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-gray-400">Tap for details →</Text>
            </View>
          </View>
        </View>

        {/* Selection Checkbox Overlay */}
        {isSelectionMode && (
          <View style={styles.checkboxOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && (
                <FontAwesome name="check" size={16} color="white" />
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const FilterButton = ({ 
  title, 
  isSelected, 
  onPress 
}: { 
  title: string; 
  isSelected: boolean; 
  onPress: () => void; 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-2 rounded-full mr-2 ${
        isSelected ? 'bg-green-500' : 'bg-gray-200'
      }`}
      style={{ height: 36, minWidth: 60, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text className={`text-sm font-medium ${
        isSelected ? 'text-white' : 'text-gray-700'
      }`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

interface RecipeListProps {
  tabType: 'home' | 'myRecipes';
}

export const RecipeList = ({ tabType }: RecipeListProps) => {
  const navigation = useNavigation();
  const recipeStore = useRecipeStore();
  const { user } = useAuthStore();

  // Determine if we're on the home tab
  const isHomeTab = tabType === 'home';

  // Select the appropriate state and actions based on tab type
  const filteredRecipes = isHomeTab ? recipeStore.filteredAllRecipes : recipeStore.filteredUserRecipes;
  const searchQuery = isHomeTab ? recipeStore.allRecipesSearchQuery : recipeStore.userRecipesSearchQuery;
  const selectedCategory = isHomeTab ? recipeStore.allRecipesSelectedCategory : recipeStore.userRecipesSelectedCategory;
  const selectedDifficulty = isHomeTab ? recipeStore.allRecipesSelectedDifficulty : recipeStore.userRecipesSelectedDifficulty;
  const selectedTags = isHomeTab ? recipeStore.allRecipesSelectedTags : recipeStore.userRecipesSelectedTags;
  const selectedAppliance = isHomeTab ? recipeStore.allRecipesSelectedAppliance : recipeStore.userRecipesSelectedAppliance;
  const setSearchQuery = isHomeTab ? recipeStore.setAllRecipesSearchQuery : recipeStore.setUserRecipesSearchQuery;
  const setSelectedCategory = isHomeTab ? recipeStore.setAllRecipesSelectedCategory : recipeStore.setUserRecipesSelectedCategory;
  const setSelectedDifficulty = isHomeTab ? recipeStore.setAllRecipesSelectedDifficulty : recipeStore.setUserRecipesSelectedDifficulty;
  const setSelectedTags = isHomeTab ? recipeStore.setAllRecipesSelectedTags : recipeStore.setUserRecipesSelectedTags;
  const setSelectedAppliance = isHomeTab ? recipeStore.setAllRecipesSelectedAppliance : recipeStore.setUserRecipesSelectedAppliance;
  const recipes = isHomeTab ? recipeStore.allRecipes : recipeStore.userRecipes;
  const filterRecipes = isHomeTab ? recipeStore.filterAllRecipes : recipeStore.filterUserRecipes;

  // View mode and selection mode (only for myRecipes tab)
  const viewMode = isHomeTab ? recipeStore.allRecipesViewMode : recipeStore.userRecipesViewMode;
  const selectionMode = isHomeTab ? false : recipeStore.selectionMode; // Only myRecipes can have selection mode
  const setViewMode = isHomeTab ? recipeStore.setAllRecipesViewMode : recipeStore.setUserRecipesViewMode;
  const deleteRecipes = recipeStore.deleteRecipes;

  // Modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Selection state
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());

  // Clear selection when exiting selection mode
  useEffect(() => {
    if (!selectionMode) {
      setSelectedRecipeIds(new Set());
    }
  }, [selectionMode]);

  // Exit selection mode when there are no recipes
  useEffect(() => {
    if (selectionMode && filteredRecipes.length === 0) {
      useRecipeStore.getState().setSelectionMode(false);
    }
  }, [selectionMode, filteredRecipes.length]);

  // Ensure recipes are filtered on mount
  useEffect(() => {
    filterRecipes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique categories, difficulties, tags, and appliances for filter options
  const categories = Array.from(new Set(recipes.map(recipe => recipe.category).filter(c => c)));
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const allTags = Array.from(new Set(recipes.flatMap(recipe => recipe.tags || [])));

  // Deduplicate appliances by ID
  const applianceMap = new Map<string, { id: string; name: string }>();
  recipes
    .filter(recipe => recipe.chefiqAppliance)
    .forEach(recipe => {
      const id = recipe.chefiqAppliance!;
      if (!applianceMap.has(id)) {
        applianceMap.set(id, {
          id,
          name: getApplianceById(id)?.name || 'Unknown'
        });
      }
    });
  const appliances = Array.from(applianceMap.values());

  const handleRecipePress = (recipe: Recipe) => {
    if (selectionMode) {
      // Toggle selection
      const newSelected = new Set(selectedRecipeIds);
      if (newSelected.has(recipe.id)) {
        newSelected.delete(recipe.id);
      } else {
        newSelected.add(recipe.id);
      }
      setSelectedRecipeIds(newSelected);
    } else {
      // @ts-ignore - Navigation typing issue with static navigation
      navigation.navigate('RecipeDetail', { recipe });
    }
  };

  const handleEditComplete = () => {
    setShowEditModal(false);
    setEditingRecipe(null);
    // Refresh the filtered recipes to show updated data
    filterRecipes();
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedTags([]);
    setSelectedAppliance('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedDifficulty) count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    if (selectedAppliance) count++;
    return count;
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredRecipes.map(r => r.id));
    setSelectedRecipeIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedRecipeIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedRecipeIds.size === 0 || !user) return;

    const count = selectedRecipeIds.size;
    Alert.alert(
      'Delete Recipes',
      `Are you sure you want to delete ${count} recipe${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecipes(Array.from(selectedRecipeIds), user.uid);
            setSelectedRecipeIds(new Set());
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 w-full">
      {/* Fixed Header */}
      <View className="px-4 pb-2 bg-gray-50 w-full">
        {/* Search Input and Filter Button */}
        <View className="flex-row mb-3 gap-2">
          <TextInput
            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className="rounded-lg px-4 py-3 items-center justify-center min-w-[80px]"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            <View className="flex-row items-center">
              <Text className="text-white font-medium text-sm mr-1">Filter</Text>
              {getActiveFiltersCount() > 0 && (
                <View className="bg-white rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-xs font-bold" style={{ color: theme.colors.primary[500] }}>{getActiveFiltersCount()}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {(selectedCategory || selectedDifficulty || selectedTags.length > 0 || selectedAppliance) && (
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-2">Active Filters:</Text>
            <View className="flex-row flex-wrap">
              {selectedCategory && (
                <View className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center" style={{ backgroundColor: theme.colors.primary[100] }}>
                  <Text className="text-sm mr-1" style={{ color: theme.colors.primary[600] }}>Category: {selectedCategory}</Text>
                  <TouchableOpacity onPress={() => setSelectedCategory('')}>
                    <Text className="font-bold" style={{ color: theme.colors.primary[600] }}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              {selectedDifficulty && (
                <View className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center" style={{ backgroundColor: theme.colors.primary[100] }}>
                  <Text className="text-sm mr-1" style={{ color: theme.colors.primary[600] }}>Difficulty: {selectedDifficulty}</Text>
                  <TouchableOpacity onPress={() => setSelectedDifficulty('')}>
                    <Text className="font-bold" style={{ color: theme.colors.primary[600] }}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              {selectedTags.map((tag) => (
                <View key={tag} className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center" style={{ backgroundColor: theme.colors.primary[100] }}>
                  <Text className="text-sm mr-1" style={{ color: theme.colors.primary[600] }}>Tag: {tag}</Text>
                  <TouchableOpacity onPress={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>
                    <Text className="font-bold" style={{ color: theme.colors.primary[600] }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {selectedAppliance && (
                <View className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center" style={{ backgroundColor: theme.colors.primary[100] }}>
                  <Text className="text-sm mr-1" style={{ color: theme.colors.primary[600] }}>Appliance: {getApplianceById(selectedAppliance)?.short_code}</Text>
                  <TouchableOpacity onPress={() => setSelectedAppliance('')}>
                    <Text className="font-bold" style={{ color: theme.colors.primary[600] }}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Results Count */}
        <Text className="text-sm text-gray-600 mb-2">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Scrollable Recipe List */}
      <View className="flex-1 w-full">
        <FlatList
          key={viewMode === 'grid' ? 'grid' : 'list'}
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          renderItem={({ item, index }) => {
            const isSelected = selectedRecipeIds.has(item.id);

            if (viewMode === 'grid') {
              return (
                <View style={{ flex: 1, margin: 4 }}>
                  <GridRecipeCard
                    recipe={item}
                    onPress={() => handleRecipePress(item)}
                    showStatus={!isHomeTab}
                    isSelectionMode={selectionMode}
                    isSelected={isSelected}
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
                  isSelected={isSelected}
                />
              );
            } else {
              return (
                <RecipeCard
                  recipe={item}
                  onPress={() => handleRecipePress(item)}
                  showStatus={!isHomeTab}
                  isSelectionMode={selectionMode}
                  isSelected={isSelected}
                />
              );
            }
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: selectionMode ? 100 : 20,
            paddingHorizontal: viewMode === 'grid' ? 12 : 16,
            flexGrow: 1
          }}
          columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-8 w-full">
              <Text className="text-gray-500 text-center">
                No recipes found matching your criteria.
              </Text>
            </View>
          }
        />
      </View>

      {/* Selection Mode Bottom Bar */}
      {selectionMode && (
        <View style={styles.selectionBottomBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {selectedRecipeIds.size} selected
            </Text>
            <View style={styles.selectionActions}>
              {selectedRecipeIds.size === filteredRecipes.length ? (
                <TouchableOpacity onPress={handleDeselectAll} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Deselect All</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSelectAll} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Select All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={selectedRecipeIds.size === 0}
                style={[styles.deleteButton, selectedRecipeIds.size === 0 && styles.deleteButtonDisabled]}
              >
                <FontAwesome name="trash" size={18} color="white" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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

const styles = StyleSheet.create({
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  selectionBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  selectionInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
