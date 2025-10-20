import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MultilineInstructionInput, { MultilineInstructionInputRef } from '@components/MultilineInstructionInput';
import { RECIPE_OPTIONS } from '@constants/recipeDefaults';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { CookingAction, getApplianceById } from '~/types/chefiq';
import ChefIQCookingSelector from '@components/ChefIQCookingSelector';
import { ApplianceDropdown } from '@components/ApplianceDropdown';
import { TemperatureInfoModal } from '@components/TemperatureInfoModal';
import { theme } from '@theme/index';
import { useRecipeForm } from '@hooks/useRecipeForm';
import { SimpleDraggableList } from '@components/DraggableList';
import { DraggableCookingAction } from '@components/DraggableCookingAction';
import { useImagePicker } from '@hooks/useImagePicker';
import { useAIRecipeGenerator } from '@hooks/useAIRecipeGenerator';
import { useCookingActions } from '@hooks/useCookingActions';
import * as recipeHelpers from '@utils/helpers/recipeFormHelpers';
import StepImage from '@components/StepImage';
import {
  ServingsPickerModal,
  CookTimePickerModal,
  CategoryPickerModal,
  TagsPickerModal,
  ConfirmationModal,
} from '@components/modals';

interface RecipeCreatorProps {
  onComplete?: () => void;
}

type RecipeCreatorRouteProp = RouteProp<{ RecipeCreator: { importedRecipe?: ScrapedRecipe, fromWebImport?: boolean } }, 'RecipeCreator'>;

export default function RecipeCreatorScreen({ onComplete }: RecipeCreatorProps = {}) {
  const navigation = useNavigation();
  const route = useRoute<RecipeCreatorRouteProp>();
  const [newInstructionText, setNewInstructionText] = React.useState('');
  const [showAIHelper, setShowAIHelper] = useState(true);
  const [showTempInfo, setShowTempInfo] = useState(false);
  const [tempInfoStepIndex, setTempInfoStepIndex] = useState<number | null>(null);

  const {
    formData,
    modalStates,
    stepSections,
    setStepSections,
    updateFormData,
    updateModalStates,
    setCookTimeFromMinutes,
    handleSave,
    handleCancel,
    confirmCancel,
    reorderIngredients,
    reorderSteps,
    moveCookingAction,
    isIngredientsReorderMode,
    setIsIngredientsReorderMode,
    isStepsReorderMode,
    setIsStepsReorderMode,
    isDraggingCookingAction,
    draggingCookingAction,
    handleCookingActionDragStart,
    handleCookingActionDragEnd,
    removeCookingAction,
    resetForm
  } = useRecipeForm({
    onComplete: onComplete || (() => navigation.goBack())
  });

  // AI Recipe Generator hook
  const {
    aiDescription,
    setAiDescription,
    isGenerating,
    remainingGenerations,
    generateRecipe,
    loadRemainingGenerations,
  } = useAIRecipeGenerator({
    autoLoadGenerations: true,
    onRecipeGenerated: (generatedRecipe) => {
      // Estimate difficulty based on cook time and number of steps
      const totalTime = generatedRecipe.cookTime;
      const numSteps = generatedRecipe.steps.length;
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (totalTime < 30 && numSteps < 5) {
        difficulty = 'Easy';
      } else if (totalTime > 60 || numSteps > 10) {
        difficulty = 'Hard';
      }

      // Populate form fields with generated data
      setCookTimeFromMinutes(generatedRecipe.cookTime);
      updateFormData({
        title: generatedRecipe.title,
        notes: generatedRecipe.description,
        ingredients: generatedRecipe.ingredients.length > 0 ? generatedRecipe.ingredients : [''],
        steps: generatedRecipe.steps.length > 0 ? generatedRecipe.steps : [{ text: '' }],
        servings: generatedRecipe.servings,
        category: generatedRecipe.category || '',
        difficulty
      });

      // Handle ChefIQ suggestions if present
      const suggestions = generatedRecipe.chefiqSuggestions;
      if (suggestions && suggestions.confidence > 0.3 && suggestions.suggestedActions.length > 0) {
        updateFormData({
          selectedAppliance: suggestions.suggestedAppliance || formData.selectedAppliance,
          useProbe: suggestions.useProbe || formData.useProbe
        });
        // Note: Cooking actions can be manually assigned to steps using the ChefIQ selector
      }

      // Hide the AI helper after successful generation
      setShowAIHelper(false);
    }
  });

  // Reload remaining generations when AI helper is shown
  useEffect(() => {
    if (showAIHelper) {
      loadRemainingGenerations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAIHelper]);

  // Handle imported recipe from web import
  useEffect(() => {
    if (route.params?.importedRecipe && route.params?.fromWebImport) {
      const scrapedRecipe = route.params.importedRecipe;

      // Estimate difficulty based on cook time and number of steps
      const totalTime = scrapedRecipe.cookTime;
      const numSteps = scrapedRecipe.steps.length;
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (totalTime < 30 && numSteps < 5) {
        difficulty = 'Easy';
      } else if (totalTime > 60 || numSteps > 10) {
        difficulty = 'Hard';
      }

      // Populate form fields with scraped data
      setCookTimeFromMinutes(scrapedRecipe.cookTime);
      updateFormData({
        title: scrapedRecipe.title,
        notes: scrapedRecipe.description,
        ingredients: scrapedRecipe.ingredients.length > 0 ? scrapedRecipe.ingredients : [''],
        steps: scrapedRecipe.steps.length > 0 ? scrapedRecipe.steps : [{ text: '' }],
        servings: scrapedRecipe.servings,
        category: scrapedRecipe.category || '',
        imageUrl: scrapedRecipe.image || '',
        difficulty
      });

      // Handle ChefIQ suggestions
      const suggestions = scrapedRecipe.chefiqSuggestions;
      if (suggestions && suggestions.confidence > 0.3 && suggestions.suggestedActions.length > 0) {
        // Auto-apply suggestions
        updateFormData({
          selectedAppliance: suggestions.suggestedAppliance || formData.selectedAppliance,
          useProbe: suggestions.useProbe || formData.useProbe
        });

        // Note: Cooking actions can be manually assigned to steps using the ChefIQ selector
      }

      // Clear the route params to prevent re-triggering
      navigation.setParams({ importedRecipe: undefined, fromWebImport: undefined } as never);
    }
  }, [route.params?.importedRecipe, route.params?.fromWebImport]);

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Create Recipe',
      presentation: 'fullScreenModal',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontWeight: theme.typography.fontWeight.semibold as any,
        fontSize: theme.typography.fontSize.xl,
      },
      headerTitleAlign: 'center',
      headerShadowVisible: true,
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleCancel}
          style={{
            paddingLeft: theme.spacing.lg,
            paddingRight: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Feather name="x" size={28} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Text style={{
            color: theme.colors.primary[500],
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold as any,
          }}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, handleCancel]);

  // Image picker hook
  const { showImageOptions } = useImagePicker({
    onImageSelected: (uri) => updateFormData({ imageUrl: uri }),
  });

  // Cooking actions hook
  const {
    editingCookingAction,
    setEditingCookingAction,
    handleCookingActionSelect,
    handleEditCookingAction,
    getCookingActionForStep,
  } = useCookingActions({
    formData,
    updateFormData,
    updateModalStates,
  });

  // Helper functions for ingredients and instructions
  const addIngredient = () => {
    const result = recipeHelpers.addIngredient(formData.ingredients);
    if (result.success) {
      updateFormData({ ingredients: result.value });
    } else {
      Alert.alert('Validation Error', result.error);
    }
  };

  const removeIngredient = (index: number) => {
    const newIngredients = recipeHelpers.removeIngredient(formData.ingredients, index);
    updateFormData({ ingredients: newIngredients });
  };

  const addStep = () => {
    const result = recipeHelpers.addStep(formData.steps);
    if (result.success) {
      updateFormData({ steps: result.value });
    } else {
      Alert.alert('Validation Error', result.error);
    }
  };

  const removeStep = (index: number) => {
    const newInstructions = recipeHelpers.removeStep(formData.steps, index);
    updateFormData({ steps: newInstructions });
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = recipeHelpers.updateIngredient(formData.ingredients, index, value);
    updateFormData({ ingredients: newIngredients });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = recipeHelpers.updateStepText(formData.steps, index, value);
    updateFormData({ steps: newSteps });
  };

  const updateStepImage = (index: number, imageUri: string | undefined) => {
    const newSteps = recipeHelpers.updateStepImage(formData.steps, index, imageUri);
    updateFormData({ steps: newSteps });
  };

  // Refs for managing focus
  const ingredientRefs = useRef<(TextInput | null)[]>([]);
  const instructionRefs = useRef<(MultilineInstructionInputRef | null)[]>([]);

  // Helper functions for Enter key submission
  const handleIngredientSubmit = (index: number) => {
    const currentIngredient = formData.ingredients[index];
    if (!currentIngredient || currentIngredient.trim() === '') {
      // If empty, just move focus or dismiss
      if (index < formData.ingredients.length - 1) {
        ingredientRefs.current[index + 1]?.focus();
      }
      return;
    }

    if (index === formData.ingredients.length - 1) {
      // If it's the last ingredient and has content, add a new one
      addIngredient();
      setTimeout(() => {
        const newIndex = formData.ingredients.length;
        ingredientRefs.current[newIndex]?.focus();
      }, 100);
    } else {
      // Move to next field
      ingredientRefs.current[index + 1]?.focus();
    }
  };

  // Auto-assign cooking actions to recipe steps
  const autoAssignCookingActions = (instructions: string[], suggestedActions: CookingAction[]) => {
    const assignedActions: CookingAction[] = [];
    suggestedActions.forEach(action => {
      // If the action already has a stepIndex from ChefIQ analyzer, use that
      if (action.stepIndex !== undefined && action.stepIndex >= 0 && action.stepIndex < instructions.length) {
        assignedActions.push({
          ...action,
          id: action.id || `auto_${Date.now()}_${action.stepIndex}`
        });
        return;
      }

      // Otherwise, find the best step to assign this cooking action to
      let bestStepIndex = -1;
      let bestScore = 0;

      instructions.forEach((instruction, index) => {
        const instructionLower = instruction.toLowerCase();
        let score = 0;

        // Score based on cooking method keywords
        const methodKeywords = {
          'pressure': ['pressure', 'instant pot', 'cook under pressure'],
          'sauté': ['sauté', 'saute', 'brown', 'sear', 'fry', 'heat oil', 'cook over medium heat', 'cook over high heat'],
          'bake': ['bake', 'oven', 'preheat', 'degrees', '°f', 'baking'],
          'air fry': ['air fry', 'crispy', 'golden', 'crunchy'],
          'roast': ['roast', 'roasted', 'roasting'],
          'broil': ['broil', 'broiled', 'grill', 'char', 'top rack'],
          'steam': ['steam', 'steamer', 'steamed'],
          'slow cook': ['slow cook', 'simmer', 'low heat', 'cover and cook'],
          'toast': ['toast', 'toasted', 'golden brown'],
          'sous vide': ['sous vide', 'water bath', 'vacuum']
        };

        const methodName = action.methodName.toLowerCase();

        // Check if this instruction mentions the cooking method
        Object.entries(methodKeywords).forEach(([method, keywords]) => {
          if (methodName.includes(method)) {
            keywords.forEach(keyword => {
              if (instructionLower.includes(keyword)) {
                score += 3;
              }
            });
          }
        });

        // Boost score for temperature mentions if action has temperature
        if ((action.parameters.target_cavity_temp || action.parameters.target_probe_temp || action.parameters.cooking_temp) &&
            (instructionLower.includes('temperature') || instructionLower.includes('degrees') || instructionLower.includes('°f'))) {
          score += 2;
        }

        // Boost score for time mentions if action has cooking time
        if (action.parameters.cooking_time && (instructionLower.includes('minutes') ||
            instructionLower.includes('min') || instructionLower.includes('hours'))) {
          score += 2;
        }

        // Penalize prep steps (usually early steps)
        if (instructionLower.includes('prep') || instructionLower.includes('prepare') ||
            instructionLower.includes('wash') || instructionLower.includes('rinse') ||
            instructionLower.includes('combine') || instructionLower.includes('mix') ||
            index < 2) {
          score -= 1;
        }

        if (score > bestScore) {
          bestScore = score;
          bestStepIndex = index;
        }
      });

      // If we found a good match, assign the action to that step
      if (bestStepIndex >= 0 && bestScore > 0) {
        assignedActions.push({
          ...action,
          stepIndex: bestStepIndex,
          id: `auto_${Date.now()}_${bestStepIndex}`
        });
      } else {
        // Default to assigning to the main cooking step (usually step 3-4)
        const defaultStepIndex = Math.min(Math.max(2, Math.floor(instructions.length / 2)), instructions.length - 1);
        assignedActions.push({
          ...action,
          stepIndex: defaultStepIndex,
          id: `auto_${Date.now()}_${defaultStepIndex}`
        });
      }
    });

    return assignedActions;
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg
      }}
      showsVerticalScrollIndicator={false}
      bottomOffset={40}
    >
        {/* AI Helper Section */}
        {showAIHelper && (
          <View
            className="mb-6 p-4 rounded-xl"
            style={{
              backgroundColor: theme.colors.primary[50],
              borderWidth: 1,
              borderColor: theme.colors.primary[200],
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-lg font-semibold"
                style={{ color: theme.colors.primary[700] }}
              >
                ✨ AI Recipe Assistant
              </Text>
              <TouchableOpacity
                onPress={() => setShowAIHelper(false)}
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[200] }}
              >
                <Text style={{ color: theme.colors.primary[700], fontSize: 14 }}>×</Text>
              </TouchableOpacity>
            </View>
            <Text
              className="text-sm mb-2"
              style={{ color: theme.colors.text.secondary }}
            >
              Don't know where to start? Describe what you want to cook and let AI generate a recipe for you!
            </Text>
            {remainingGenerations && (
              <Text
                className="text-xs mb-3"
                style={{ color: theme.colors.primary[600], fontWeight: '600' }}
              >
                ✨ {remainingGenerations.daily} of {remainingGenerations.dailyLimit} generations remaining today
              </Text>
            )}
            <TextInput
              className="border rounded-lg px-3 py-2 mb-3 text-base"
              style={{
                backgroundColor: 'white',
                borderColor: theme.colors.gray[300],
              }}
              placeholder='e.g., "simple pork chop" or "easy chicken pasta"'
              value={aiDescription}
              onChangeText={setAiDescription}
              editable={!isGenerating}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={generateRecipe}
              disabled={isGenerating || !aiDescription.trim()}
              className="py-3 px-4 rounded-lg items-center"
              style={{
                backgroundColor: isGenerating || !aiDescription.trim()
                  ? theme.colors.gray[300]
                  : theme.colors.primary[500],
              }}
            >
              {isGenerating ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-semibold ml-2">Generating...</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold">Generate Recipe</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Show "Bring back AI Helper" button if hidden */}
        {!showAIHelper && (
          <TouchableOpacity
            onPress={() => setShowAIHelper(true)}
            className="mb-4 py-2 px-3 rounded-lg self-start"
            style={{
              backgroundColor: theme.colors.primary[100],
              borderWidth: 1,
              borderColor: theme.colors.primary[300],
            }}
          >
            <Text style={{ color: theme.colors.primary[700], fontSize: 14 }}>
              ✨ Show AI Helper
            </Text>
          </TouchableOpacity>
        )}

        {/* Title */}
        <View className="mb-4">
          <TextInput
            className="text-xl font-medium text-gray-800 border-b border-gray-200 pb-2"
            placeholder="Title"
            value={formData.title}
            onChangeText={(value) => updateFormData({ title: value })}
            style={{ fontSize: 20 }}
          />
        </View>

        {/* Image */}
        <View className="mb-4 border-b border-gray-200 pb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg text-gray-800">Image</Text>
            {formData.imageUrl ? (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Image Options',
                    'Choose an action',
                    [
                      { text: 'Replace', onPress: showImageOptions },
                      {
                        text: 'Remove',
                        onPress: () => updateFormData({ imageUrl: '' }),
                        style: 'destructive'
                      },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
                className="relative"
              >
                <Image
                  source={{ uri: formData.imageUrl }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                  contentFit="cover"
                />
                <View
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.colors.primary[500] }}
                >
                  <Ionicons name="pencil" size={14} color="white" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={showImageOptions}
                className="w-12 h-12 border-2 rounded-lg items-center justify-center"
                style={{ borderColor: theme.colors.primary[500] }}
              >
                <Text className="text-xl" style={{ color: theme.colors.primary[500] }}>📷</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View className="mb-4 border-b border-gray-200 pb-3">
          <Text className="text-lg text-gray-800 mb-3">Info</Text>
          <View className="flex-row items-center justify-between gap-4 mb-3">
            {/* Cook Time */}
            <View className="flex-1 flex-row items-center justify-between">
              <Text className="text-base text-gray-600">Cook Time</Text>
              <TouchableOpacity
                onPress={() => updateModalStates({ showCookTimePicker: true })}
                className="border-b border-gray-200 py-1 px-2"
              >
                <Text className="text-base text-gray-800 text-right">
                  {formData.cookTimeHours > 0 ? `${formData.cookTimeHours}h ${formData.cookTimeMinutes}m` : `${formData.cookTimeMinutes}m`}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Servings */}
            <View className="flex-1 flex-row items-center justify-between">
              <Text className="text-base text-gray-600">Servings</Text>
              <TouchableOpacity
                onPress={() => updateModalStates({ showServingsPicker: true })}
                className="border-b border-gray-200 py-1 px-2"
              >
                <Text className="text-base text-gray-800 text-right">{formData.servings}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Published Toggle */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base text-gray-600">Published</Text>
              <Text className="text-sm text-gray-500">Make this recipe visible to others</Text>
            </View>
            <Switch
              value={formData.published}
              onValueChange={(value) => updateFormData({ published: value })}
              trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary[500] }}
              thumbColor={theme.colors.background.primary}
            />
          </View>
        </View>

        {/* Category */}
        <TouchableOpacity
          className="mb-4 border-b border-gray-200 pb-3"
          onPress={() => updateModalStates({ showCategoryPicker: true })}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-lg text-gray-800">Category</Text>
            <Text className="text-lg text-gray-500">
              {formData.category || 'Uncategorized'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tags */}
        <View className="mb-4 border-b border-gray-200 pb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg text-gray-800">Tags</Text>
            <TouchableOpacity
              onPress={() => updateModalStates({ showTagsPicker: true })}
              className="px-3 py-1 rounded-lg"
              style={{ backgroundColor: theme.colors.primary[100] }}
            >
              <Text style={{ color: theme.colors.primary[700], fontSize: theme.typography.fontSize.sm }}>
                + Add
              </Text>
            </TouchableOpacity>
          </View>
          {formData.tags && formData.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <View
                  key={index}
                  className="flex-row items-center px-3 py-1 rounded-full"
                  style={{ backgroundColor: theme.colors.primary[100] }}
                >
                  <Text style={{ color: theme.colors.primary[700], fontSize: theme.typography.fontSize.sm }}>
                    {tag}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newTags = (formData.tags || []).filter((_, i) => i !== index);
                      updateFormData({ tags: newTags });
                    }}
                    className="ml-1"
                  >
                    <Text style={{ color: theme.colors.primary[700], fontSize: 16, fontWeight: 'bold' }}>
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {(!formData.tags || formData.tags.length === 0) && (
            <Text className="text-sm" style={{ color: theme.colors.text.secondary }}>
              No tags added
            </Text>
          )}
        </View>

        {/* ChefIQ Smart Cooking */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">CHEF iQ SMART COOKING</Text>

          {/* Appliance Selection */}
          <View className="mb-3">
            <ApplianceDropdown
              selectedAppliance={formData.selectedAppliance}
              onSelect={(appliance) => updateFormData({ selectedAppliance: appliance })}
            />
          </View>

          {/* Probe Toggle */}
          {formData.selectedAppliance && getApplianceById(formData.selectedAppliance)?.supports_probe && (
            <View className="flex-row items-center justify-between mb-3 bg-gray-50 p-3 rounded-lg">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Use Thermometer Probe</Text>
                <Text className="text-sm text-gray-600">Monitor internal temperature during cooking</Text>
              </View>
              <Switch
                value={formData.useProbe}
                onValueChange={(value) => updateFormData({ useProbe: value })}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary[500] }}
                thumbColor={theme.colors.background.primary}
              />
            </View>
          )}
        </View>

        {/* Ingredients */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-gray-800">INGREDIENTS</Text>
            {formData.ingredients.length >= 3 && (
              <TouchableOpacity
                onPress={() => setIsIngredientsReorderMode(!isIngredientsReorderMode)}
                className="px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: isIngredientsReorderMode ? theme.colors.primary[500] : theme.colors.gray[100]
                }}
              >
                <Text style={{
                  color: isIngredientsReorderMode ? theme.colors.text.inverse : theme.colors.primary[500],
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium
                }}>
                  {isIngredientsReorderMode ? 'Done' : 'Reorder'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <SimpleDraggableList
            data={formData.ingredients}
            onReorder={reorderIngredients}
            keyExtractor={(item, index) => `ingredient-${index}`}
            isReorderMode={isIngredientsReorderMode}
            renderItem={(ingredient, index, isReorderMode) => (
              <View className="flex-row items-center">
                {isReorderMode ? (
                  <View className="flex-1 border border-gray-200 rounded-lg px-3 py-2 mr-2">
                    <Text className="text-base">{ingredient || `Ingredient ${index + 1}`}</Text>
                  </View>
                ) : (
                  <TextInput
                    ref={(ref) => (ingredientRefs.current[index] = ref)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base mr-2"
                    placeholder={`Ingredient ${index + 1}`}
                    value={ingredient}
                    onChangeText={(value) => updateIngredient(index, value)}
                    onSubmitEditing={() => handleIngredientSubmit(index)}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    scrollEnabled={false}
                    keyboardShouldPersistTaps="handled"
                  />
                )}
                {formData.ingredients.length > 1 && !isReorderMode && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(index)}
                    className="w-8 h-8 bg-red-100 rounded-full items-center justify-center"
                  >
                    <Text className="text-red-600 font-bold">×</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>

        {/* Instructions */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-gray-800">INSTRUCTIONS</Text>
            {formData.steps.length >= 3 && (
              <TouchableOpacity
                onPress={() => setIsStepsReorderMode(!isStepsReorderMode)}
                className="px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: isStepsReorderMode ? theme.colors.primary[500] : theme.colors.gray[100]
                }}
              >
                <Text style={{
                  color: isStepsReorderMode ? theme.colors.text.inverse : theme.colors.primary[500],
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium
                }}>
                  {isStepsReorderMode ? 'Done' : 'Reorder'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <SimpleDraggableList
            data={formData.steps}
            onReorder={reorderSteps}
            keyExtractor={(item, index) => `instruction-${index}`}
            isReorderMode={isStepsReorderMode}
            renderItem={(step, index, isReorderMode) => {
              const cookingAction = getCookingActionForStep(index);
              return (
                <View>
                  <View className="flex-row items-center mb-1">
                    {isReorderMode ? (
                      <View className="flex-1 border border-gray-200 rounded-lg px-3 py-2 mr-2" style={{ minHeight: 40 }}>
                        <Text className="text-base">{step.text || `Step ${index + 1}`}</Text>
                      </View>
                    ) : (
                      <MultilineInstructionInput
                        ref={(ref) => (instructionRefs.current[index] = ref)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base mr-2"
                        placeholder={`Step ${index + 1}`}
                        value={step.text}
                        onChangeText={(value) => updateStep(index, value)}
                        onAddNewStep={() => {
                          addStep();
                          // Focus on the new instruction field after a brief delay
                          setTimeout(() => {
                            const newIndex = formData.steps.length;
                            instructionRefs.current[newIndex]?.focus();
                          }, 100);
                        }}
                        onFocusNext={() => instructionRefs.current[index + 1]?.focus()}
                        isLastStep={index === formData.steps.length - 1}
                        keyboardShouldPersistTaps="handled"
                      />
                    )}
                    {!isReorderMode && (
                      <View className="flex-row gap-1 items-center">
                        {/* Step Image Button */}
                        <StepImage
                          imageUri={step.image}
                          onImageChange={(uri) => updateStepImage(index, uri)}
                          editable={true}
                          compact={true}
                        />

                        {/* Add Cooking Method Button - Only show if appliance is selected */}
                        {formData.selectedAppliance && (
                          <TouchableOpacity
                            onPress={() => {
                              updateFormData({ currentStepIndex: index });
                              updateModalStates({ showCookingSelector: true });
                            }}
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{
                              backgroundColor: getCookingActionForStep(index) ? theme.colors.primary[500] : theme.colors.primary[100]
                            }}
                          >
                            {getCookingActionForStep(index) ? (
                              <Text className="text-sm">🍳</Text>
                            ) : (
                              <Image
                                source={{ uri: getApplianceById(formData.selectedAppliance)?.icon }}
                                style={{
                                  width: 16,
                                  height: 16,
                                  tintColor: theme.colors.primary[600]
                                }}
                                contentFit="contain"
                              />
                            )}
                          </TouchableOpacity>
                        )}

                        {/* Remove Instruction Button */}
                        {formData.steps.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeStep(index)}
                            className="w-8 h-8 bg-red-100 rounded-full items-center justify-center"
                          >
                            <Text className="text-red-600 font-bold">×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Draggable Cooking Action */}
                  {cookingAction && (
                    <View className="ml-9">
                      <DraggableCookingAction
                        cookingAction={cookingAction}
                        currentStepIndex={index}
                        onDragStart={() => handleCookingActionDragStart(index)}
                        onDragEnd={handleCookingActionDragEnd}
                        onRemove={() => removeCookingAction(index)}
                        onEdit={() => handleEditCookingAction(index)}
                        onShowTempInfo={() => {
                          setTempInfoStepIndex(index);
                          setShowTempInfo(true);
                        }}
                        selectedAppliance={formData.selectedAppliance}
                        isReorderMode={isStepsReorderMode}
                      />
                    </View>
                  )}
                </View>
              );
            }}
          />

          {/* Add New Instruction Input */}
          <View className="flex-row items-center mt-2">
            <MultilineInstructionInput
              key="add-new-instruction"
              className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-base mr-2"
              placeholder="+ Add new instruction step"
              value={newInstructionText}
              onChangeText={setNewInstructionText}
              onAddNewStep={() => {
                const textToAdd = newInstructionText.trim();
                if (textToAdd) {
                  // Add new instruction and focus on it
                  updateFormData({ steps: [...formData.steps, { text: textToAdd }] });
                  setNewInstructionText('');
                  setTimeout(() => {
                    const newIndex = formData.steps.length;
                    instructionRefs.current[newIndex]?.focus();
                  }, 100);
                }
              }}
              isLastStep={true}
              style={{ opacity: 0.6, minHeight: 40 }}
            />
          </View>
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">NOTES</Text>
          <TextInput
            className="border border-gray-200 rounded-lg p-3 text-base min-h-[80px]"
            placeholder="Add your recipe notes"
            value={formData.notes}
            onChangeText={(value) => updateFormData({ notes: value })}
            multiline
            textAlignVertical="top"
          />
        </View>

      {/* ChefIQ Cooking Selector Modal */}
      {formData.selectedAppliance && (
        <ChefIQCookingSelector
          visible={modalStates.showCookingSelector}
          onClose={() => {
            updateModalStates({ showCookingSelector: false });
            updateFormData({ currentStepIndex: null });
            setEditingCookingAction(null);
          }}
          onSelect={handleCookingActionSelect}
          applianceId={formData.selectedAppliance}
          useProbe={formData.useProbe}
          initialAction={editingCookingAction?.action}
        />
      )}

      {/* Servings Picker Modal */}
      <ServingsPickerModal
        visible={modalStates.showServingsPicker}
        selectedValue={formData.servings}
        onValueChange={(value) => updateFormData({ servings: value })}
        onClose={() => updateModalStates({ showServingsPicker: false })}
      />

      {/* Cook Time Picker Modal */}
      <CookTimePickerModal
        visible={modalStates.showCookTimePicker}
        hours={formData.cookTimeHours}
        minutes={formData.cookTimeMinutes}
        onHoursChange={(value) => updateFormData({ cookTimeHours: value })}
        onMinutesChange={(value) => updateFormData({ cookTimeMinutes: value })}
        onClose={() => updateModalStates({ showCookTimePicker: false })}
      />

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={modalStates.showCategoryPicker}
        selectedValue={formData.category}
        onValueChange={(value) => updateFormData({ category: value })}
        onClose={() => updateModalStates({ showCategoryPicker: false })}
      />

      {/* Tags Picker Modal */}
      <TagsPickerModal
        visible={modalStates.showTagsPicker}
        selectedTags={formData.tags || []}
        onToggleTag={(tag) => {
          const isSelected = formData.tags && formData.tags.includes(tag);
          if (isSelected) {
            updateFormData({ tags: (formData.tags || []).filter(t => t !== tag) });
          } else {
            updateFormData({ tags: [...(formData.tags || []), tag] });
          }
        }}
        onAddCustomTag={(tag) => {
          updateFormData({ tags: [...(formData.tags || []), tag] });
        }}
        onClose={() => updateModalStates({ showTagsPicker: false })}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        visible={modalStates.showCancelConfirmation}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        confirmStyle="danger"
        onConfirm={confirmCancel}
        onCancel={() => updateModalStates({ showCancelConfirmation: false })}
      />

      {/* Temperature Info Modal for imported recipes */}
      {showTempInfo && tempInfoStepIndex !== null && (
        <TemperatureInfoModal
          visible={showTempInfo}
          onClose={() => {
            setShowTempInfo(false);
            setTempInfoStepIndex(null);
          }}
          currentTemperature={
            formData.steps[tempInfoStepIndex]?.cookingAction?.parameters.target_probe_temp || 165
          }
          recipeText={`${formData.title} ${formData.steps.map(i => i.text).join(' ')}`}
          onTemperatureChange={(newTemp, doneness, removeTemp) => {
            const cookingAction = formData.steps[tempInfoStepIndex]?.cookingAction;
            if (cookingAction) {
              const updatedAction = {
                ...cookingAction,
                parameters: {
                  ...cookingAction.parameters,
                  target_probe_temp: newTemp,
                  remove_probe_temp: removeTemp || newTemp
                }
              };
              const newInstructions = recipeHelpers.updateStepCookingAction(
                formData.steps,
                tempInfoStepIndex,
                updatedAction
              );
              updateFormData({ steps: newInstructions });
            }
            setShowTempInfo(false);
            setTempInfoStepIndex(null);
          }}
        />
      )}
    </KeyboardAwareScrollView>
  );
}
