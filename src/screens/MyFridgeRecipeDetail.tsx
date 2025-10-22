import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import { createStyles } from './MyFridgeRecipeDetail.styles';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { convertScrapedToRecipe, convertRecipeToScraped } from '~/utils/helpers/recipeConversion';
import { useRecipeStore, useAuthStore } from '@store/store';
import { getApplianceById } from '~/types/chefiq';
import { getCookingMethodIcon, formatKeyParameters } from '@utils/cookingActionHelpers';
import StepImage from '@components/StepImage';

interface RouteParams {
  recipe: ScrapedRecipe & {
    missingIngredients?: string[];
    substitutions?: Array<{ missing: string; substitutes: string[] }>;
    matchPercentage?: number;
  };
  source: 'my-fridge-ai';
}

export default function MyFridgeRecipeDetailScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { user } = useAuthStore();
  const { addRecipe } = useRecipeStore();

  // Initialize recipe state, handling potential undefined
  const [recipe, setRecipe] = useState(params?.recipe || {} as any);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubstitutions, setActiveSubstitutions] = useState<Record<string, string>>({});

  // Safely access properties with optional chaining
  const hasSubstitutions = recipe?.substitutions && recipe.substitutions.length > 0;
  const hasMissingIngredients = recipe?.missingIngredients && recipe.missingIngredients.length > 0;

  // Get ChefIQ appliance info from recipe suggestions
  const chefiqAppliance = recipe?.chefiqSuggestions?.suggestedAppliance;
  const hasChefIQActions = recipe?.steps?.some(step => step.cookingAction) || false;

  // Listen for edited recipe returning from RecipeEdit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('MyFridgeRecipeDetail focused, checking for editedRecipe...');
      // @ts-ignore - navigation params
      const editedRecipe = route.params?.editedRecipe;
      if (editedRecipe) {
        console.log('Found editedRecipe, updating state');
        // Convert the edited Recipe back to ScrapedRecipe format
        const updatedScrapedRecipe = convertRecipeToScraped(editedRecipe);

        // Preserve original fields that aren't in Recipe format
        setRecipe((prevRecipe: any) => ({
          ...updatedScrapedRecipe,
          missingIngredients: prevRecipe?.missingIngredients,
          substitutions: prevRecipe?.substitutions,
          matchPercentage: prevRecipe?.matchPercentage,
        }));

        // Clear the param to avoid re-applying on future focuses
        // @ts-ignore
        navigation.setParams({ editedRecipe: undefined });
      } else {
        console.log('No editedRecipe found in params');
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  // Handle applying a substitution
  const handleApplySubstitution = (missing: string, substitute: string) => {
    setActiveSubstitutions((prev) => ({
      ...prev,
      [missing]: substitute,
    }));
  };

  // Handle editing the recipe
  const handleEdit = () => {
    if (!recipe) return;

    // Convert the scraped recipe to Recipe format for editing
    let finalIngredients = [...(recipe.ingredients || [])];
    Object.entries(activeSubstitutions).forEach(([missing, substitute]) => {
      const index = finalIngredients.findIndex((ing) =>
        ing.toLowerCase().includes(missing.toLowerCase())
      );
      if (index !== -1) {
        finalIngredients[index] = finalIngredients[index].replace(
          new RegExp(missing, 'gi'),
          substitute
        );
      }
    });

    const convertedRecipe = convertScrapedToRecipe({
      ...recipe,
      ingredients: finalIngredients,
    });

    const recipeToEdit = {
      ...convertedRecipe,
      id: 'temp-preview-recipe', // Temporary ID for preview mode
      source: 'my-fridge-ai',
    };

    // @ts-ignore - navigation types
    navigation.navigate('RecipeEdit', {
      recipe: recipeToEdit,
      previewMode: true, // Flag to indicate this is a preview edit, not a save
    });
  };

  // Handle saving recipe to collection
  const handleSaveRecipe = async () => {
    if (!user?.uid) {
      alert('Please sign in to save recipes');
      return;
    }

    if (!recipe) {
      alert('No recipe to save');
      return;
    }

    setIsSaving(true);

    try {
      // Apply active substitutions to ingredients
      let finalIngredients = [...(recipe.ingredients || [])];
      Object.entries(activeSubstitutions).forEach(([missing, substitute]) => {
        const index = finalIngredients.findIndex((ing) =>
          ing.toLowerCase().includes(missing.toLowerCase())
        );
        if (index !== -1) {
          finalIngredients[index] = finalIngredients[index].replace(
            new RegExp(missing, 'gi'),
            substitute
          );
        }
      });

      // Convert to Recipe format
      const convertedRecipe = convertScrapedToRecipe({
        ...recipe,
        ingredients: finalIngredients,
      });

      // addRecipe handles createdAt, updatedAt, and userId automatically
      await addRecipe(convertedRecipe, user.uid);

      // Reset navigation stack to prevent going back and creating duplicates
      // Navigate to MyRecipes tab to show the saved recipe
      // @ts-ignore
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'TabNavigator',
            state: {
              routes: [{ name: 'MyRecipes' }],
              index: 0,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalTime = (recipe?.prepTime || 0) + (recipe?.cookTime || 0);

  // Return early if recipe is not loaded
  if (!recipe || !recipe.title) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text.secondary }}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={theme.colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Recipe Image */}
        {recipe.image && (
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        )}

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            {recipe.matchPercentage && (
              <View
                style={[
                  styles.matchBadge,
                  { backgroundColor: getMatchColor(recipe.matchPercentage, theme) },
                ]}
              >
                <Text style={styles.matchText}>{recipe.matchPercentage}%</Text>
              </View>
            )}
          </View>

          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color={theme.colors.primary.main} />
            <Text style={styles.aiBadgeText}>AI Generated Recipe</Text>
          </View>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
        </View>

        {/* Recipe Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>{totalTime} min</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="restaurant-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>{recipe.servings} servings</Text>
          </View>
          {recipe.category && (
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.infoText}>{recipe.category}</Text>
            </View>
          )}
        </View>

        {/* ChefIQ Appliance Info */}
        {chefiqAppliance && (
          <View style={styles.chefiqSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="hardware-chip" size={20} color={theme.colors.primary.main} />
              <Text style={styles.chefiqSectionTitle}>ChefIQ Appliance</Text>
            </View>
            <View style={styles.applianceCard}>
              {getApplianceById(chefiqAppliance)?.picture && (
                <Image
                  source={{ uri: getApplianceById(chefiqAppliance)?.picture }}
                  style={styles.applianceImage}
                />
              )}
              <View style={styles.applianceInfo}>
                <Text style={styles.applianceName}>
                  {getApplianceById(chefiqAppliance)?.name}
                </Text>
                {hasChefIQActions && (
                  <Text style={styles.applianceHint}>
                    Cooking actions assigned to steps
                  </Text>
                )}
              </View>
              {recipe.chefiqSuggestions?.useProbe && (
                <View style={styles.probeBadge}>
                  <Ionicons name="thermometer" size={14} color={theme.colors.warning.dark} />
                  <Text style={styles.probeText}>Probe</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Missing Ingredients Section */}
        {hasMissingIngredients && (
          <View style={styles.missingSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
              <Text style={styles.missingSectionTitle}>
                Missing Ingredients ({recipe.missingIngredients!.length})
              </Text>
            </View>
            {recipe.missingIngredients!.map((ingredient, index) => (
              <View key={index} style={styles.missingItem}>
                <Ionicons name="close-circle" size={16} color={theme.colors.error.main} />
                <Text style={styles.missingText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Substitutions Section */}
        {hasSubstitutions && (
          <View style={styles.substitutionsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="swap-horizontal" size={20} color={theme.colors.primary.main} />
              <Text style={styles.substitutionsSectionTitle}>
                Recommended Substitutions ({recipe.substitutions!.length})
              </Text>
            </View>
            <Text style={styles.substitutionsHint}>
              Tap a substitution to use it in the recipe
            </Text>
            {recipe.substitutions!.map((sub, index) => (
              <View key={index} style={styles.substitutionCard}>
                <View style={styles.substitutionHeader}>
                  <Text style={styles.substitutionMissing}>Missing: {sub.missing}</Text>
                  {activeSubstitutions[sub.missing] && (
                    <View style={styles.appliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.success.main} />
                      <Text style={styles.appliedText}>Applied</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.substitutionLabel}>Use instead:</Text>
                <View style={styles.substitutesContainer}>
                  {sub.substitutes.map((substitute, subIndex) => (
                    <TouchableOpacity
                      key={subIndex}
                      onPress={() => handleApplySubstitution(sub.missing, substitute)}
                      style={[
                        styles.substituteChip,
                        activeSubstitutions[sub.missing] === substitute && styles.substituteChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.substituteText,
                          activeSubstitutions[sub.missing] === substitute &&
                            styles.substituteTextActive,
                        ]}
                      >
                        {substitute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => {
            const isModified = Object.keys(activeSubstitutions).some((missing) =>
              ingredient.toLowerCase().includes(missing.toLowerCase())
            );
            return (
              <View key={index} style={styles.ingredientItem}>
                <Ionicons
                  name={isModified ? 'swap-horizontal' : 'ellipse'}
                  size={8}
                  color={isModified ? theme.colors.primary.main : theme.colors.text.secondary}
                />
                <Text
                  style={[styles.ingredientText, isModified && styles.ingredientTextModified]}
                >
                  {ingredient}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.steps.map((step, index) => {
            const cookingAction = typeof step === 'object' ? step.cookingAction : undefined;
            const stepText = typeof step === 'string' ? step : step.text;
            const stepImage = typeof step === 'object' ? step.image : undefined;

            return (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>{stepText}</Text>

                    {/* Step Image */}
                    {stepImage && (
                      <View style={styles.stepImageContainer}>
                        <StepImage imageUri={stepImage} editable={false} compact={true} />
                      </View>
                    )}
                  </View>
                </View>

                {/* Cooking Action for this step */}
                {cookingAction && (
                  <View style={styles.cookingActionCard}>
                    <View style={styles.cookingActionHeader}>
                      <Text style={styles.cookingActionIcon}>
                        {getCookingMethodIcon(
                          cookingAction.methodId,
                          getApplianceById(cookingAction.applianceId)?.thing_category_name
                        )}
                      </Text>
                      <View style={styles.cookingActionInfo}>
                        <Text style={styles.cookingActionMethod}>
                          {cookingAction.methodName}
                        </Text>
                        <Text style={styles.cookingActionParams}>
                          {formatKeyParameters(cookingAction)}
                        </Text>
                        <Text style={styles.cookingActionAppliance}>
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

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSaveRecipe}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Create This Recipe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getMatchColor(percentage: number, theme: any): string {
  if (percentage >= 80) return theme.colors.success.main;
  if (percentage >= 60) return theme.colors.warning.main;
  return theme.colors.error.main;
}
