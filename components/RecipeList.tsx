import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useRecipeStore, Recipe } from '../store/store';
import { FilterModal } from './FilterModal';
import { getApplianceById } from '../types/chefiq';
import RecipeCreatorScreen from '../screens/recipeCreator';
import { theme } from '../theme';

const RecipeCard = ({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className="bg-white rounded-lg mb-3 shadow-sm border border-gray-200 overflow-hidden">
        {/* Recipe Image */}
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

        {/* Recipe Content */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">{recipe.title}</Text>
          <Text className="text-gray-600 mb-3 line-clamp-2">{recipe.description}</Text>

          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-500 mr-4">⏱️ {recipe.cookTime} min</Text>
              <Text className="text-sm text-gray-500 mr-4">👥 {recipe.servings} servings</Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${
              recipe.difficulty === 'Easy' ? 'bg-green-100' :
              recipe.difficulty === 'Medium' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Text className={`text-xs font-medium ${
                recipe.difficulty === 'Easy' ? 'text-green-800' :
                recipe.difficulty === 'Medium' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {recipe.difficulty}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
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
            <Text className="text-xs text-gray-400">Tap for details →</Text>
          </View>
        </View>
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

export const RecipeList = () => {
  const navigation = useNavigation();
  const {
    filteredRecipes,
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    recipes,
    filterRecipes
  } = useRecipeStore();

  // Modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Ensure recipes are filtered on mount
  useEffect(() => {
    filterRecipes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique categories and difficulties for filter options
  const categories = Array.from(new Set(recipes.map(recipe => recipe.category)));
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const handleRecipePress = (recipe: Recipe) => {
    // @ts-ignore - Navigation typing issue with static navigation
    navigation.navigate('RecipeDetail', { recipe });
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
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedDifficulty) count++;
    return count;
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
        {(selectedCategory || selectedDifficulty) && (
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
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard 
              recipe={item} 
              onPress={() => handleRecipePress(item)} 
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: 20,
            paddingHorizontal: 16,
            flexGrow: 1
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-8 w-full">
              <Text className="text-gray-500 text-center">
                No recipes found matching your criteria.
              </Text>
            </View>
          }
        />
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        categories={categories}
        difficulties={difficulties}
        selectedCategory={selectedCategory}
        selectedDifficulty={selectedDifficulty}
        onCategoryChange={setSelectedCategory}
        onDifficultyChange={setSelectedDifficulty}
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
          editingRecipe={editingRecipe || undefined}
          onEditComplete={handleEditComplete}
        />
      </Modal>
    </View>
  );
};
