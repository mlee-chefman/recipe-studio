import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Recipe } from '../store/store';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
}

export const RecipeDetailModal = ({ recipe, visible, onClose }: RecipeDetailModalProps) => {
  if (!recipe) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
          <Text className="text-xl font-bold text-gray-800 flex-1 mr-4">{recipe.title}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-100 rounded-full w-8 h-8 items-center justify-center"
          >
            <Text className="text-gray-600 font-bold text-lg">×</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4">
          {/* Description */}
          <View className="mb-6">
            <Text className="text-base text-gray-700 leading-6">{recipe.description}</Text>
          </View>

          {/* Recipe Info */}
          <View className="flex-row justify-between mb-6 bg-gray-50 p-4 rounded-lg">
            <View className="items-center">
              <Text className="text-sm text-gray-500 mb-1">Cook Time</Text>
              <Text className="text-lg font-semibold text-gray-800">⏱️ {recipe.cookTime} min</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500 mb-1">Servings</Text>
              <Text className="text-lg font-semibold text-gray-800">👥 {recipe.servings}</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500 mb-1">Difficulty</Text>
              <View className={`px-3 py-1 rounded-full ${
                recipe.difficulty === 'Easy' ? 'bg-green-100' :
                recipe.difficulty === 'Medium' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Text className={`text-sm font-medium ${
                  recipe.difficulty === 'Easy' ? 'text-green-800' :
                  recipe.difficulty === 'Medium' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {recipe.difficulty}
                </Text>
              </View>
            </View>
          </View>

          {/* Category */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Category</Text>
            <View className="bg-blue-50 px-3 py-2 rounded-lg self-start">
              <Text className="text-blue-700 font-medium">{recipe.category}</Text>
            </View>
          </View>

          {/* Ingredients */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Ingredients</Text>
            <View className="bg-gray-50 p-4 rounded-lg">
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <Text className="text-base text-gray-700 flex-1">{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Instructions</Text>
            <View className="bg-gray-50 p-4 rounded-lg">
              {recipe.instructions.map((instruction, index) => (
                <View key={index} className="flex-row mb-3">
                  <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-sm font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-base text-gray-700 flex-1 leading-6">{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
