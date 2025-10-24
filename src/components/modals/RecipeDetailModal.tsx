import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRecipeStore, useAuthStore } from '@store/store';
import { Recipe } from '~/types/recipe';
import { getApplianceById, formatCookingAction } from '~/types/chefiq';
import { theme, useAppTheme } from '@theme/index';
import { haptics } from '@utils/haptics';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export const RecipeDetailModal = ({ recipe, visible, onClose, onEdit }: RecipeDetailModalProps) => {
  const { deleteRecipe } = useRecipeStore();
  const { user } = useAuthStore();
  const appTheme = useAppTheme();

  if (!recipe) return null;

  const handleDelete = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete a recipe.');
      return;
    }

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
            haptics.heavy();
            deleteRecipe(recipe.id, user.uid);
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
      <View className="flex-1" style={{ backgroundColor: appTheme.colors.background.primary }}>
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b" style={{
          backgroundColor: appTheme.colors.background.primary,
          borderBottomColor: appTheme.colors.border.main
        }}>
          <Text className="text-xl font-bold flex-1 mr-4" style={{ color: appTheme.colors.text.primary }}>{recipe.title}</Text>
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
              className="rounded-lg px-3 py-1.5 items-center justify-center"
              style={{ backgroundColor: appTheme.colors.error.main }}
            >
              <Text className="text-white font-semibold">Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full w-8 h-8 items-center justify-center"
              style={{ backgroundColor: appTheme.colors.gray[100] }}
            >
              <Text className="font-bold text-lg" style={{ color: appTheme.colors.text.secondary }}>×</Text>
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
              <Text className="text-base leading-6" style={{ color: appTheme.colors.text.secondary }}>{recipe.description}</Text>
            </View>

          {/* Recipe Info */}
          <View className="flex-row justify-between mb-6 p-4 rounded-lg" style={{ backgroundColor: appTheme.colors.background.secondary }}>
            <View className="items-center">
              <Text className="text-sm mb-1" style={{ color: appTheme.colors.text.tertiary }}>Cook Time</Text>
              <Text className="text-lg font-semibold" style={{ color: appTheme.colors.text.primary }}>⏱️ {recipe.cookTime} min</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm mb-1" style={{ color: appTheme.colors.text.tertiary }}>Servings</Text>
              <Text className="text-lg font-semibold" style={{ color: appTheme.colors.text.primary }}>👥 {recipe.servings}</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm mb-1" style={{ color: appTheme.colors.text.tertiary }}>Difficulty</Text>
              <View className="px-3 py-1 rounded-full" style={{
                backgroundColor: recipe.difficulty === 'Easy' ? appTheme.colors.success.light :
                  recipe.difficulty === 'Medium' ? appTheme.colors.warning.light : appTheme.colors.error.light
              }}>
                <Text className="text-sm font-medium" style={{
                  color: recipe.difficulty === 'Easy' ? appTheme.colors.success.dark :
                    recipe.difficulty === 'Medium' ? appTheme.colors.warning.dark : appTheme.colors.error.dark
                }}>
                  {recipe.difficulty}
                </Text>
              </View>
            </View>
          </View>

          {/* Category */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-2" style={{ color: appTheme.colors.text.primary }}>Category</Text>
            <View className="px-3 py-2 rounded-lg self-start" style={{ backgroundColor: theme.colors.primary[100] }}>
              <Text className="font-medium" style={{ color: theme.colors.primary[600] }}>{recipe.category}</Text>
            </View>
          </View>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: appTheme.colors.text.primary }}>Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <View key={index} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: appTheme.colors.gray[100] }}>
                    <Text className="text-sm" style={{ color: appTheme.colors.text.secondary }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ChefIQ Appliance Info */}
          {recipe.chefiqAppliance && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: appTheme.colors.text.primary }}>ChefIQ Appliance</Text>
              <View className="p-4 rounded-lg border" style={{
                backgroundColor: appTheme.colors.primary[50],
                borderColor: appTheme.colors.primary[200]
              }}>
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl mr-2">🍳</Text>
                  <Text className="text-lg font-semibold" style={{ color: appTheme.colors.primary[800] }}>
                    {getApplianceById(recipe.chefiqAppliance)?.name}
                  </Text>
                  {recipe.useProbe && (
                    <View className="ml-2 px-2 py-1 rounded-full" style={{ backgroundColor: appTheme.colors.warning.light }}>
                      <Text className="text-xs font-medium" style={{ color: appTheme.colors.warning.dark }}>🌡️ Probe</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm capitalize" style={{ color: appTheme.colors.primary[600] }}>
                  {getApplianceById(recipe.chefiqAppliance)?.thing_category_name} - Smart cooking features available
                  {recipe.useProbe && ' with thermometer probe'}
                </Text>
              </View>
            </View>
          )}

          {/* Ingredients */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: appTheme.colors.text.primary }}>Ingredients</Text>
            <View className="p-4 rounded-lg" style={{ backgroundColor: appTheme.colors.background.secondary }}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: theme.colors.primary[500] }} />
                  <Text className="text-base flex-1" style={{ color: appTheme.colors.text.secondary }}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: appTheme.colors.text.primary }}>Instructions</Text>
            <View className="p-4 rounded-lg" style={{ backgroundColor: appTheme.colors.background.secondary }}>
              {recipe.steps.map((step, index) => {
                const cookingAction = step.cookingAction;
                return (
                  <View key={index} className="mb-4">
                    <View className="flex-row mb-2">
                      <View className="rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: theme.colors.primary[500] }}>
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-base flex-1 leading-6" style={{ color: appTheme.colors.text.secondary }}>{step.text}</Text>
                    </View>

                    {/* Cooking Action for this step */}
                    {cookingAction && (
                      <View className="ml-9 border rounded-lg p-3" style={{
                        backgroundColor: appTheme.colors.primary[50],
                        borderColor: appTheme.colors.primary[200]
                      }}>
                        <View className="flex-row items-center">
                          <Text className="text-lg mr-2">🍳</Text>
                          <View className="flex-1">
                            <Text className="text-sm font-medium" style={{ color: appTheme.colors.primary[800] }}>
                              {formatCookingAction(cookingAction)}
                            </Text>
                            <Text className="text-xs mt-1" style={{ color: appTheme.colors.primary[600] }}>
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
