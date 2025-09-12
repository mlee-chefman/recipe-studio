import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useRecipeStore, Recipe } from '../store/store';
import { RecipeDetailModal } from './RecipeDetailModal';
import { FilterModal } from './FilterModal';

const RecipeCard = ({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
        <Text className="text-lg font-bold text-gray-800 mb-2">{recipe.title}</Text>
        <Text className="text-gray-600 mb-2">{recipe.description}</Text>
        
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
          <Text className="text-sm text-blue-600 font-medium">{recipe.category}</Text>
          <Text className="text-xs text-gray-400">Tap for details →</Text>
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
        isSelected ? 'bg-blue-500' : 'bg-gray-200'
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
  const {
    filteredRecipes,
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    recipes
  } = useRecipeStore();

  // Modal state
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);

  // Get unique categories and difficulties for filter options
  const categories = Array.from(new Set(recipes.map(recipe => recipe.category)));
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecipe(null);
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
            className="bg-blue-500 rounded-lg px-4 py-3 items-center justify-center min-w-[80px]"
          >
            <View className="flex-row items-center">
              <Text className="text-white font-medium text-sm mr-1">Filter</Text>
              {getActiveFiltersCount() > 0 && (
                <View className="bg-white rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-blue-500 text-xs font-bold">{getActiveFiltersCount()}</Text>
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
                <View className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center">
                  <Text className="text-blue-800 text-sm mr-1">Category: {selectedCategory}</Text>
                  <TouchableOpacity onPress={() => setSelectedCategory('')}>
                    <Text className="text-blue-600 font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              )}
              {selectedDifficulty && (
                <View className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center">
                  <Text className="text-blue-800 text-sm mr-1">Difficulty: {selectedDifficulty}</Text>
                  <TouchableOpacity onPress={() => setSelectedDifficulty('')}>
                    <Text className="text-blue-600 font-bold">×</Text>
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

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        visible={modalVisible}
        onClose={handleCloseModal}
      />

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
    </View>
  );
};
