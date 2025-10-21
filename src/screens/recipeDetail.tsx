import { useLayoutEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useRecipeStore, useAuthStore } from '@store/store';
import { Recipe } from '~/types/recipe';
import { getApplianceById } from '~/types/chefiq';
import { getCookingMethodIcon, formatKeyParameters } from '@utils/cookingActionHelpers';
import { generateExportJSON } from '@utils/chefiqExport';
import { ChefIQExportModal } from '@components/ChefIQExportModal';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import StepImage from '@components/StepImage';

type RootStackParamList = {
  RecipeDetail: { recipe: Recipe };
  RecipeEdit: { recipe: Recipe };
};

type RecipeDetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipe: routeRecipe } = route.params;
  const { allRecipes, userRecipes } = useRecipeStore();
  const { user } = useAuthStore();

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJSON, setExportJSON] = useState('');

  // Get the latest recipe data from store instead of route params
  // Check both allRecipes and userRecipes arrays
  const recipe = allRecipes.find(r => r.id === routeRecipe.id) ||
                 userRecipes.find(r => r.id === routeRecipe.id) ||
                 routeRecipe;

  // Check if current user owns this recipe
  const isOwner = user?.uid === recipe.userId;

  const handleEdit = () => {
    // @ts-ignore - Navigation typing issue with static navigation
    navigation.navigate('RecipeEdit', { recipe });
  };

  const handleExportToChefIQ = async () => {
    try {
      // Generate export
      const json = generateExportJSON(recipe);
      setExportJSON(json);
      setShowExportModal(true);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export recipe'
      );
    }
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
      headerRight: () => isOwner ? (
        <TouchableOpacity
          onPress={handleEdit}
          style={styles.headerButton}
        >
          <Feather
            name="edit-3"
            size={20}
            color={theme.colors.primary[500]}
          />
        </TouchableOpacity>
      ) : null,
    });
  }, [navigation, recipe, handleEdit, isOwner]);

  return (
    <View style={styles.container}>
      <ScrollView className="flex-1">
        {/* Recipe Image */}
        {recipe.image && (
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            contentFit="cover"
          />
        )}

        <View className="p-4">
          {/* Description */}
          <View className="mb-4">
            <Text className="text-base leading-6" style={{ color: theme.colors.text.secondary }}>{recipe.description}</Text>
          </View>

          {/* Author */}
          {recipe.authorName && (
            <View className="mb-6 flex-row items-center">
              {recipe.authorProfilePicture && (
                <Image
                  source={{ uri: recipe.authorProfilePicture }}
                  style={styles.authorProfilePicture}
                  contentFit="cover"
                />
              )}
              <View>
                <Text className="text-xs" style={{ color: theme.colors.text.tertiary }}>Created by</Text>
                <Text className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>{recipe.authorName}</Text>
              </View>
            </View>
          )}

          {/* Recipe Info */}
          <View className="flex-row justify-between mb-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
            <View className="items-center">
              <Text className="text-sm mb-1" style={{ color: theme.colors.text.tertiary }}>Cook Time</Text>
              <Text className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>⏱️ {recipe.cookTime} min</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm mb-1" style={{ color: theme.colors.text.tertiary }}>Servings</Text>
              <Text className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>👥 {recipe.servings}</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm mb-1" style={{ color: theme.colors.text.tertiary }}>Difficulty</Text>
              <View className="px-3 py-1 rounded-full" style={{
                backgroundColor: recipe.difficulty === 'Easy' ? theme.colors.success.light :
                  recipe.difficulty === 'Medium' ? theme.colors.warning.light : theme.colors.error.light
              }}>
                <Text className="text-sm font-medium" style={{
                  color: recipe.difficulty === 'Easy' ? theme.colors.success.dark :
                    recipe.difficulty === 'Medium' ? theme.colors.warning.dark : theme.colors.error.dark
                }}>
                  {recipe.difficulty}
                </Text>
              </View>
            </View>
          </View>

          {/* Category */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Category</Text>
            <View className="px-3 py-2 rounded-lg self-start" style={styles.categoryBadge}>
              <Text className="font-medium" style={styles.categoryText}>{recipe.category}</Text>
            </View>
          </View>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <View key={index} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: theme.colors.gray[100] }}>
                    <Text className="text-sm" style={{ color: theme.colors.text.secondary }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ChefIQ Appliance Info */}
          {recipe.chefiqAppliance && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>ChefIQ Appliance</Text>
              <View className="p-4 rounded-lg border" style={{
                backgroundColor: theme.colors.primary[50],
                borderColor: theme.colors.primary[200]
              }}>
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: getApplianceById(recipe.chefiqAppliance)?.picture }}
                    style={styles.applianceImage}
                    contentFit="contain"
                  />
                  <Text className="text-lg font-semibold" style={{ color: theme.colors.primary[800] }}>
                    {getApplianceById(recipe.chefiqAppliance)?.name}
                  </Text>
                  {recipe.useProbe && (
                    <View className="ml-2 px-2 py-1 rounded-full" style={{ backgroundColor: theme.colors.warning.light }}>
                      <Text className="text-xs font-medium" style={{ color: theme.colors.warning.dark }}>🌡️ Probe</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Export to ChefIQ Button */}
              <TouchableOpacity
                onPress={handleExportToChefIQ}
                className="mt-3 flex-row items-center justify-center py-3 rounded-lg"
                style={styles.exportButton}
              >
                <Feather name="download" size={18} color="white" style={styles.exportButtonIcon} />
                <Text className="text-white font-semibold text-base">Export to ChefIQ Format</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ingredients */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.text.primary }}>Ingredients</Text>
            <View className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <View className="w-2 h-2 rounded-full mr-3" style={styles.ingredientBullet} />
                  <Text className="text-base flex-1" style={{ color: theme.colors.text.secondary }}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.text.primary }}>Instructions</Text>
            <View className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
              {recipe.steps.map((step, index) => {
                const cookingAction = step.cookingAction;
                const stepImage = step.image;

                return (
                  <View key={index} className="mb-4">
                    <View className="flex-row mb-2">
                      <View className="rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5" style={styles.stepNumberBadge}>
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-base leading-6 flex-1" style={{ color: theme.colors.text.secondary }}>{step.text}</Text>

                      {/* Step Image - inline */}
                      {stepImage && (
                        <View className="ml-2">
                          <StepImage imageUri={stepImage} editable={false} compact={true} />
                        </View>
                      )}
                    </View>

                    {/* Cooking Action for this step */}
                    {cookingAction && (
                      <View className="ml-9 border rounded-lg p-3" style={{
                        backgroundColor: theme.colors.primary[50],
                        borderColor: theme.colors.primary[200]
                      }}>
                        <View className="flex-row items-center">
                          <Text className="text-lg mr-2">
                            {getCookingMethodIcon(
                              cookingAction.methodId,
                              getApplianceById(cookingAction.applianceId)?.thing_category_name
                            )}
                          </Text>
                          <View className="flex-1">
                            <Text className="text-sm font-medium" style={{ color: theme.colors.primary[800] }}>
                              {cookingAction.methodName}
                            </Text>
                            <Text className="text-xs mt-1" style={{ color: theme.colors.primary[600] }}>
                              {formatKeyParameters(cookingAction)}
                            </Text>
                            <Text className="text-xs mt-0.5" style={{ color: theme.colors.primary[500] }}>
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

      {/* Export Modal */}
      <ChefIQExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportJSON={exportJSON}
        recipeName={recipe.title}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  recipeImage: {
    width: '100%',
    height: 250,
  },
  authorProfilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary[100],
  },
  categoryText: {
    color: theme.colors.primary[600],
  },
  applianceImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  exportButton: {
    backgroundColor: theme.colors.primary[500],
  },
  exportButtonIcon: {
    marginRight: 8,
  },
  ingredientBullet: {
    backgroundColor: theme.colors.primary[500],
  },
  stepNumberBadge: {
    backgroundColor: theme.colors.primary[500],
  },
});
