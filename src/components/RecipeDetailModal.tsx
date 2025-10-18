import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Recipe, useRecipeStore } from '@store/store';
import { getApplianceById, formatCookingAction } from '~/types/chefiq';
import { theme } from '@theme/index';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export const RecipeDetailModal = ({ recipe, visible, onClose, onEdit }: RecipeDetailModalProps) => {
  const { deleteRecipe } = useRecipeStore();

  if (!recipe) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(recipe.id);
            onClose();
          }
        }
      ]
    );
  };

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
          <View className="flex-row gap-2">
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                className="rounded-lg px-3 py-1.5 items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[500] }}
              >
                <Text className="text-white font-semibold">Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-500 rounded-lg px-3 py-1.5 items-center justify-center"
            >
              <Text className="text-white font-semibold">Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 rounded-full w-8 h-8 items-center justify-center"
            >
              <Text className="text-gray-600 font-bold text-lg">×</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1">
          {/* Recipe Image */}
          {recipe.image && (
            <Image
              source={{ uri: recipe.image }}
              style={{ width: '100%', height: 250 }}
              contentFit="cover"
            />
          )}

          <View className="p-4">
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
            <View className="px-3 py-2 rounded-lg self-start" style={{ backgroundColor: theme.colors.primary[100] }}>
              <Text className="font-medium" style={{ color: theme.colors.primary[600] }}>{recipe.category}</Text>
            </View>
          </View>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <View key={index} className="px-3 py-1.5 rounded-full bg-gray-100">
                    <Text className="text-sm text-gray-700">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ChefIQ Appliance Info */}
          {recipe.chefiqAppliance && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">ChefIQ Appliance</Text>
              <View className="bg-green-50 p-4 rounded-lg border border-green-200">
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl mr-2">🍳</Text>
                  <Text className="text-lg font-semibold text-green-800">
                    {getApplianceById(recipe.chefiqAppliance)?.name}
                  </Text>
                  {recipe.useProbe && (
                    <View className="ml-2 bg-orange-100 px-2 py-1 rounded-full">
                      <Text className="text-xs font-medium text-orange-800">🌡️ Probe</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-green-600 capitalize">
                  {getApplianceById(recipe.chefiqAppliance)?.thing_category_name} - Smart cooking features available
                  {recipe.useProbe && ' with thermometer probe'}
                </Text>
              </View>
            </View>
          )}

          {/* Ingredients */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Ingredients</Text>
            <View className="bg-gray-50 p-4 rounded-lg">
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: theme.colors.primary[500] }} />
                  <Text className="text-base text-gray-700 flex-1">{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Instructions</Text>
            <View className="bg-gray-50 p-4 rounded-lg">
              {recipe.steps.map((step, index) => {
                const cookingAction = step.cookingAction;
                return (
                  <View key={index} className="mb-4">
                    <View className="flex-row mb-2">
                      <View className="rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: theme.colors.primary[500] }}>
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-base text-gray-700 flex-1 leading-6">{step.text}</Text>
                    </View>

                    {/* Cooking Action for this step */}
                    {cookingAction && (
                      <View className="ml-9 bg-green-50 border border-green-200 rounded-lg p-3">
                        <View className="flex-row items-center">
                          <Text className="text-lg mr-2">🍳</Text>
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-green-800">
                              {formatCookingAction(cookingAction)}
                            </Text>
                            <Text className="text-xs text-green-600 mt-1">
                              {getApplianceById(cookingAction.applianceId)?.name}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
