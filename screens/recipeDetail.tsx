import React, { useLayoutEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Recipe, useRecipeStore } from '../store/store';
import { getApplianceById, formatCookingAction, CookingAction } from '../types/chefiq';
import { getCookingMethodIcon, formatKeyParameters } from '../utils/cookingActionHelpers';
import { theme } from '../theme';

type RootStackParamList = {
  RecipeDetail: { recipe: Recipe };
  RecipeEdit: { recipe: Recipe };
};

type RecipeDetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipe: routeRecipe } = route.params;
  const { recipes } = useRecipeStore();

  // Get the latest recipe data from store instead of route params
  const recipe = recipes.find(r => r.id === routeRecipe.id) || routeRecipe;

  const handleEdit = () => {
    // @ts-ignore - Navigation typing issue with static navigation
    navigation.navigate('RecipeEdit', { recipe });
  };

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.title,
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.lg,
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={handleEdit}
          style={{
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Feather
            name="edit-3"
            size={20}
            color={theme.colors.primary[500]}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, recipe, handleEdit]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
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

          {/* ChefIQ Appliance Info */}
          {recipe.chefiqAppliance && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">ChefIQ Appliance</Text>
              <View className="bg-green-50 p-4 rounded-lg border border-green-200">
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: getApplianceById(recipe.chefiqAppliance)?.picture }}
                    style={{ width: 40, height: 40, marginRight: 12 }}
                    contentFit="contain"
                  />
                  <Text className="text-lg font-semibold text-green-800">
                    {getApplianceById(recipe.chefiqAppliance)?.name}
                  </Text>
                  {recipe.useProbe && (
                    <View className="ml-2 bg-orange-100 px-2 py-1 rounded-full">
                      <Text className="text-xs font-medium text-orange-800">🌡️ Probe</Text>
                    </View>
                  )}
                </View>
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
              {recipe.instructions.map((instruction, index) => {
                const cookingAction = recipe.cookingActions?.find(action => action.stepIndex === index);
                return (
                  <View key={index} className="mb-4">
                    <View className="flex-row mb-2">
                      <View className="rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: theme.colors.primary[500] }}>
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-base text-gray-700 flex-1 leading-6">{instruction}</Text>
                    </View>

                    {/* Cooking Action for this step */}
                    {cookingAction && (
                      <View className="ml-9 bg-green-50 border border-green-200 rounded-lg p-3">
                        <View className="flex-row items-center">
                          <Text className="text-lg mr-2">
                            {getCookingMethodIcon(
                              cookingAction.methodId,
                              getApplianceById(cookingAction.applianceId)?.thing_category_name
                            )}
                          </Text>
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-green-800">
                              {cookingAction.methodName}
                            </Text>
                            <Text className="text-xs text-green-600 mt-1">
                              {formatKeyParameters(cookingAction)}
                            </Text>
                            <Text className="text-xs text-green-500 mt-0.5">
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
  );
}