import React, { useLayoutEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch, StyleSheet, Animated } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MultilineInstructionInput, { MultilineInstructionInputRef } from '@components/MultilineInstructionInput';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Recipe } from "~/types/recipe";
import { useRecipeForm } from '@hooks/useRecipeForm';
import { getApplianceById } from '~/types/chefiq';
import ChefIQCookingSelector from '@components/ChefIQCookingSelector';
import { ApplianceDropdown } from '@components/ApplianceDropdown';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { SimpleDraggableList } from '@components/DraggableList';
import { DraggableCookingAction } from '@components/DraggableCookingAction';
import { useImagePicker } from '@hooks/useImagePicker';
import { useAICoverGeneration } from '@hooks/useAICoverGeneration';
import { useCookingActions } from '@hooks/useCookingActions';
import * as recipeHelpers from '@utils/helpers/recipeFormHelpers';
import { formatCookTime } from '@utils/helpers/recipeHelpers';
import StepImage from '@components/StepImage';
import {
  ConfirmationModal,
  SavingModal,
  CoverImageRequiredModal,
  RecipeSimplificationModal,
  AIAssistantModal,
} from '~/components/modals';
import { simplifyRecipeInstructions, SimplificationResult, enhanceRecipeWithAI } from '@services/gemini.service';
import RecipeCoverImage from '@components/RecipeCoverImage';
import { haptics } from '@utils/haptics';

type RootStackParamList = {
  RecipeEdit: { recipe: Recipe; previewMode?: boolean };
};

type RecipeEditRouteProp = RouteProp<RootStackParamList, 'RecipeEdit'>;

export default function RecipeEditScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute<RecipeEditRouteProp>();
  const { recipe, previewMode } = route.params;
  const [newInstructionText, setNewInstructionText] = React.useState('');
  const [showCoverImageRequiredModal, setShowCoverImageRequiredModal] = useState(false);
  const [showApplianceChangeConfirmation, setShowApplianceChangeConfirmation] = useState(false);
  const [pendingApplianceId, setPendingApplianceId] = useState<string>('');
  const [showSimplificationModal, setShowSimplificationModal] = useState(false);
  const [simplificationResult, setSimplificationResult] = useState<SimplificationResult | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAIHelperModal, setShowAIHelperModal] = useState(false);
  const [aiEnhanceDescription, setAiEnhanceDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<{ daily: number; dailyLimit: number } | null>(null);
  const fabScale = useRef(new Animated.Value(1)).current;

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
    handleDelete,
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
    isSaving
  } = useRecipeForm({
    editingRecipe: recipe,
    previewMode: previewMode || false,
    onCoverImageRequired: () => setShowCoverImageRequiredModal(true)
  });

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: previewMode ? 'Edit Preview' : 'Edit Recipe',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.lg,
      },
      headerTitleAlign: 'center',
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.headerButton}
          disabled={isSaving}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isSaving ? theme.colors.text.disabled : theme.colors.text.primary}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={isSaving}
        >
          <Text style={[styles.saveText, isSaving && styles.disabledText]}>
            {previewMode ? 'Apply' : 'Save'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, handleCancel, previewMode, isSaving, theme]);

  // Image picker hook
  const { showImageOptions } = useImagePicker({
    onImageSelected: (uri) => updateFormData({ imageUrl: uri }),
  });

  // AI Cover Generation hook
  const { isGenerating: isGeneratingCover, generateAndUploadCover } = useAICoverGeneration();

  const handleGenerateAICover = async () => {
    if (!formData.title || formData.title.trim() === '') {
      Alert.alert('Missing Title', 'Please add a recipe title before generating an AI cover image.');
      return;
    }

    const downloadURL = await generateAndUploadCover({
      title: formData.title,
      description: formData.notes,
      ingredients: formData.ingredients.filter(i => i.trim() !== ''),
      category: formData.category,
      tags: formData.tags || [],
    });

    if (downloadURL) {
      updateFormData({ imageUrl: downloadURL });
      Alert.alert('Success', 'AI cover image generated successfully!');
    } else {
      console.log('AI cover generation skipped (quota exceeded or failed)');
      Alert.alert(
        'Image Generation Unavailable',
        'AI cover generation is currently unavailable. You can upload a photo manually instead.'
      );
    }
  };

  // Handle uploading image from modal (triggered when saving published recipe without image)
  const handleUploadFromModal = () => {
    setShowCoverImageRequiredModal(false);
    showImageOptions();
  };

  // Handle AI generation from modal (triggered when saving published recipe without image)
  const handleGenerateAIFromModal = async () => {
    setShowCoverImageRequiredModal(false);
    await handleGenerateAICover();
  };

  // Handler for appliance change with confirmation
  const handleApplianceChange = (newApplianceId: string) => {
    // Check if there are any cooking actions in the steps
    const hasCookingActions = formData.steps.some(step => step.cookingAction);

    if (hasCookingActions && newApplianceId !== formData.selectedAppliance) {
      // Show confirmation modal
      setPendingApplianceId(newApplianceId);
      setShowApplianceChangeConfirmation(true);
    } else {
      // No cooking actions, just change the appliance
      updateFormData({ selectedAppliance: newApplianceId, useProbe: false });
    }
  };

  // Confirm appliance change and remove all cooking actions
  const confirmApplianceChange = () => {
    haptics.warning();
    // Remove all cooking actions from steps
    const updatedSteps = formData.steps.map(step => {
      const { cookingAction, ...stepWithoutAction } = step;
      return stepWithoutAction;
    });

    updateFormData({
      steps: updatedSteps,
      selectedAppliance: pendingApplianceId,
      useProbe: false
    });

    setShowApplianceChangeConfirmation(false);
    setPendingApplianceId('');
  };

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
      haptics.light();
      updateFormData({ ingredients: result.value });
    } else {
      haptics.warning();
      Alert.alert('Validation Error', result.error);
    }
  };

  const removeIngredient = (index: number) => {
    haptics.light();
    const newIngredients = recipeHelpers.removeIngredient(formData.ingredients, index);
    updateFormData({ ingredients: newIngredients });
  };

  const addStep = () => {
    const result = recipeHelpers.addStep(formData.steps);
    if (result.success) {
      haptics.light();
      updateFormData({
        steps: result.value
      });
    } else {
      haptics.warning();
      Alert.alert('Validation Error', result.error);
    }
  };

  const removeStep = (index: number) => {
    haptics.light();
    const newSteps = recipeHelpers.removeStep(formData.steps, index);
    updateFormData({
      steps: newSteps
    });
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

  // Handle AI simplification
  const handleSimplifyRecipe = async () => {
    if (!formData.title || formData.title.trim() === '') {
      Alert.alert('Missing Title', 'Please add a recipe title before simplifying.');
      return;
    }

    if (formData.steps.length === 0 || (formData.steps.length === 1 && formData.steps[0].text.trim() === '')) {
      Alert.alert('No Steps', 'Please add recipe steps before simplifying.');
      return;
    }

    setIsSimplifying(true);
    haptics.medium();

    try {
      console.log('Starting recipe simplification...');
      console.log('Recipe title:', formData.title);
      console.log('Steps count:', formData.steps.length);

      const result = await simplifyRecipeInstructions(
        formData.title,
        formData.ingredients.filter(i => i.trim() !== ''),
        formData.steps,
        formData.notes
      );

      console.log('Simplification completed:', result.success);

      if (!result.success) {
        console.error('Simplification failed:', result.error);
        Alert.alert('Simplification Failed', result.error || 'Could not simplify recipe. Please try again.');
        return;
      }

      if (!result.simplified) {
        console.log('No simplification needed');
        Alert.alert('No Changes Needed', result.changesSummary || 'Your recipe is already concise and well-written!');
        return;
      }

      console.log('Showing comparison modal');
      console.log('Result data:', {
        simplified: result.simplified,
        simplifiedStepsCount: result.simplifiedSteps?.length,
        originalStepsCount: formData.steps.length,
        hasSummary: !!result.changesSummary,
      });

      // Show comparison modal
      setSimplificationResult(result);
      // Small delay to ensure state is updated
      setTimeout(() => {
        setShowSimplificationModal(true);
      }, 100);
    } catch (error) {
      console.error('Simplification unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      // ALWAYS clear loading state, no matter what happens
      console.log('Clearing simplification loading state');
      setIsSimplifying(false);
    }
  };

  // Accept simplified version
  const handleAcceptSimplification = () => {
    if (simplificationResult && simplificationResult.simplifiedSteps) {
      haptics.success();
      const updates: any = { steps: simplificationResult.simplifiedSteps };
      if (simplificationResult.simplifiedNotes) {
        updates.notes = simplificationResult.simplifiedNotes;
      }
      updateFormData(updates);
      setShowSimplificationModal(false);
      setSimplificationResult(null);
      Alert.alert('Success', 'Recipe has been simplified!');
    }
  };

  // Reject simplified version
  const handleRejectSimplification = () => {
    haptics.light();
    setShowSimplificationModal(false);
    setSimplificationResult(null);
  };

  // Regenerate simplification with different result
  const handleRegenerate = async () => {
    if (!formData.title || formData.title.trim() === '') {
      Alert.alert('Missing Title', 'Please add a recipe title before regenerating.');
      return;
    }

    setIsRegenerating(true);
    haptics.medium();

    try {
      console.log('Regenerating recipe simplification with higher creativity...');

      // Use higher temperature (0.7) for more variety in results
      const result = await simplifyRecipeInstructions(
        formData.title,
        formData.ingredients.filter(i => i.trim() !== ''),
        formData.steps,
        formData.notes,
        0.7  // Higher temperature for more creative/varied results
      );

      if (!result.success) {
        Alert.alert('Regeneration Failed', result.error || 'Could not regenerate. Please try again.');
        return;
      }

      if (!result.simplified) {
        Alert.alert('No Changes', result.changesSummary || 'No different simplification was found.');
        return;
      }

      // Update with new result
      setSimplificationResult(result);
      haptics.success();
    } catch (error) {
      console.error('Regeneration error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle AI Enhancement
  const handleEnhanceRecipe = async () => {
    if (!aiEnhanceDescription.trim()) {
      Alert.alert('Missing Instructions', 'Please describe how you want to enhance this recipe.');
      return;
    }

    // Detect if recipe is empty (user is starting from scratch)
    const isEmptyRecipe = !formData.title.trim() &&
                          !formData.ingredients.some(i => i.trim()) &&
                          !formData.steps.some(s => s.text.trim());

    setIsEnhancing(true);
    haptics.medium();

    try {
      console.log('Starting recipe enhancement...');
      console.log('Enhancement request:', aiEnhanceDescription);
      console.log('Is empty recipe (draft mode):', isEmptyRecipe);

      const result = await enhanceRecipeWithAI(
        {
          title: formData.title,
          ingredients: formData.ingredients,
          steps: formData.steps,
          notes: formData.notes,
          selectedAppliance: formData.selectedAppliance,
        },
        aiEnhanceDescription
      );

      console.log('Enhancement completed:', result.success);

      if (!result.success || !result.recipe) {
        console.error('Enhancement failed:', result.error);
        Alert.alert('Enhancement Failed', result.error || 'Could not enhance recipe. Please try again.');
        return;
      }

      const enhancedRecipe = result.recipe;

      // Update form with enhanced data
      if (enhancedRecipe.cookTime) {
        setCookTimeFromMinutes(enhancedRecipe.cookTime);
      }

      updateFormData({
        title: enhancedRecipe.title,
        notes: enhancedRecipe.description || formData.notes,
        ingredients: enhancedRecipe.ingredients.length > 0 ? enhancedRecipe.ingredients : formData.ingredients,
        steps: enhancedRecipe.steps.length > 0 ? enhancedRecipe.steps : formData.steps,
        servings: enhancedRecipe.servings || formData.servings,
        category: enhancedRecipe.category || formData.category,
      });

      // Handle ChefIQ suggestions if AI changed the appliance/methods
      const suggestions = enhancedRecipe.chefiqSuggestions;
      if (suggestions) {
        // Apply cooking actions to the enhanced steps
        let updatedSteps = [...enhancedRecipe.steps];

        if (suggestions.suggestedActions && suggestions.suggestedActions.length > 0) {
          console.log(`Applying ${suggestions.suggestedActions.length} cooking actions to enhanced recipe`);

          // Clear existing cooking actions first
          updatedSteps = updatedSteps.map(step => {
            if (typeof step === 'object' && 'cookingAction' in step) {
              const { cookingAction, ...stepWithoutAction } = step as any;
              return stepWithoutAction;
            }
            return step;
          });

          // Apply new cooking actions
          suggestions.suggestedActions.forEach(action => {
            if (action.stepIndex >= 0 && action.stepIndex < updatedSteps.length) {
              const currentStep = updatedSteps[action.stepIndex];
              if (typeof currentStep === 'object') {
                (updatedSteps[action.stepIndex] as any).cookingAction = action;
              }
            }
          });
        }

        // Update appliance if changed
        if (suggestions.suggestedAppliance && suggestions.suggestedAppliance !== formData.selectedAppliance) {
          console.log(`Switching appliance from ${formData.selectedAppliance} to ${suggestions.suggestedAppliance}`);
          updateFormData({
            selectedAppliance: suggestions.suggestedAppliance,
            useProbe: suggestions.useProbe || false,
            steps: updatedSteps,
          });
        } else if (suggestions.suggestedActions && suggestions.suggestedActions.length > 0) {
          // Just update steps with new cooking actions (same appliance)
          updateFormData({
            steps: updatedSteps,
          });
        }
      }

      // Close modal and clear description
      setShowAIHelperModal(false);
      setAiEnhanceDescription('');

      haptics.success();

      // Check if recipe has an image after AI processing
      const hasImage = formData.imageUrl && formData.imageUrl.trim() !== '';

      // If no image exists, automatically generate one
      if (!hasImage && enhancedRecipe.title) {
        console.log('Recipe has no cover image - automatically generating one...');

        // Show success message with image generation notice
        Alert.alert(
          isEmptyRecipe ? 'Recipe Created!' : 'Recipe Enhanced!',
          isEmptyRecipe
            ? 'Your recipe has been generated! Now generating a cover image...'
            : 'Your recipe has been enhanced! Now generating a cover image...',
          [{ text: 'OK' }]
        );

        // Generate cover image automatically (don't await - let it run in background)
        setTimeout(async () => {
          try {
            await handleGenerateAICover();
          } catch (error) {
            console.log('Auto cover generation failed (user can still add manually):', error);
          }
        }, 500); // Small delay to let the recipe data settle
      } else {
        // Show standard success message (recipe already has image)
        Alert.alert(
          isEmptyRecipe ? 'Recipe Created!' : 'Recipe Enhanced!',
          isEmptyRecipe
            ? 'Your recipe has been generated! Review and save when ready.'
            : 'Your recipe has been enhanced based on your instructions. Review the changes and save when ready.'
        );
      }
    } catch (error) {
      console.error('Enhancement unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFabPress = () => {
    // Animate the FAB
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setShowAIHelperModal(true);
  };

  return (
    <View style={styles.rootContainer} pointerEvents={isSaving ? 'none' : 'auto'}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={40}
      >
        {/* Title */}
        <View className="mb-4">
          <TextInput
            className="text-xl font-medium border-b pb-2"
            placeholder="Title"
            value={formData.title}
            placeholderTextColor={theme.colors.text.secondary}
            onChangeText={(value) => updateFormData({ title: value })}
            style={styles.titleInput}
          />
        </View>

        {/* Image */}
        <View className="mb-4 border-b pb-3" style={{ borderColor: theme.colors.border.main }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-lg" style={{ color: theme.colors.text.primary }}>Image</Text>
            <RecipeCoverImage
              imageUri={formData.imageUrl}
              onImageChange={(uri) => updateFormData({ imageUrl: uri || '' })}
              editable={true}
              size="small"
              onGenerateAI={handleGenerateAICover}
              isGeneratingAI={isGeneratingCover}
            />
          </View>
        </View>

        {/* Recipe Info Button */}
        <TouchableOpacity
          className="mb-4 border rounded-lg px-4 py-3 bg-white"
          style={{ borderColor: theme.colors.border.main }}
          onPress={() => {
            // @ts-ignore - Navigation typing issue with static navigation
            navigation.navigate('RecipeInfo', {
              cookTimeHours: formData.cookTimeHours,
              cookTimeMinutes: formData.cookTimeMinutes,
              servings: formData.servings,
              category: formData.category,
              difficulty: formData.difficulty,
              tags: formData.tags || [],
              onUpdate: (data: any) => updateFormData(data),
            });
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-medium" style={{ color: theme.colors.text.primary }}>Recipe Info</Text>
            <View className="flex-row items-center">
              <Text className="text-sm mr-2" style={{ color: theme.colors.text.tertiary }}>
                {formatCookTime(formData.cookTimeHours, formData.cookTimeMinutes)} • {formData.servings} servings
              </Text>
              <Feather name="chevron-right" size={20} color={theme.colors.text.secondary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Published Toggle */}
        <View className="mb-4 border rounded-lg p-4 bg-white" style={{ borderColor: theme.colors.border.main }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: theme.colors.text.primary }}>Published</Text>
              <Text className="text-sm" style={{ color: theme.colors.text.tertiary }}>Make this recipe visible to others</Text>
            </View>
            <Switch
              value={formData.published}
              onValueChange={(value) => {
                haptics.light();
                updateFormData({ published: value });
              }}
              trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary[500] }}
              thumbColor={theme.colors.background.primary}
            />
          </View>
        </View>

        {/* ChefIQ Smart Cooking */}
        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>CHEF iQ SMART COOKING</Text>

          {/* Appliance Selection */}
          <View className="mb-3">
            <ApplianceDropdown
              selectedAppliance={formData.selectedAppliance}
              onSelect={handleApplianceChange}
            />
          </View>

          {/* Probe Toggle - Only show for iQ MiniOven */}
          {formData.selectedAppliance &&
           getApplianceById(formData.selectedAppliance)?.thing_category_name === 'oven' &&
           getApplianceById(formData.selectedAppliance)?.supports_probe && (
            <View className="flex-row items-center justify-between mb-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
              <View className="flex-1">
                <Text className="text-base font-medium" style={{ color: theme.colors.text.primary }}>Use Thermometer Probe</Text>
                <Text className="text-sm" style={{ color: theme.colors.text.secondary }}>Monitor internal temperature during cooking</Text>
              </View>
              <Switch
                value={formData.useProbe}
                onValueChange={(value) => {
                  haptics.light();
                  updateFormData({ useProbe: value });
                }}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary[500] }}
                thumbColor={theme.colors.background.primary}
              />
            </View>
          )}
        </View>

        {/* Ingredients */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>INGREDIENTS</Text>
            {formData.ingredients.length >= 3 && (
              <TouchableOpacity
                onPress={() => setIsIngredientsReorderMode(!isIngredientsReorderMode)}
                className="px-3 py-1 rounded-lg"
                style={isIngredientsReorderMode ? styles.reorderButtonActive : styles.reorderButtonInactive}
              >
                <Text style={isIngredientsReorderMode ? styles.reorderTextActive : styles.reorderTextInactive}>
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
                  <View className="flex-1 border rounded-lg px-3 py-2 mr-2" style={{ borderColor: theme.colors.border.main }}>
                    <Text className="text-base">{ingredient || `Ingredient ${index + 1}`}</Text>
                  </View>
                ) : (
                  <TextInput
                    ref={(ref) => (ingredientRefs.current[index] = ref)}
                    className="flex-1 border rounded-lg px-3 py-2 text-base mr-2"
                    style={{ borderColor: theme.colors.border.main }}
                    placeholder={`Ingredient ${index + 1}`}
                    placeholderTextColor={theme.colors.text.secondary}
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
                    className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.error.light }}
                  >
                    <Text className="font-bold" style={{ color: theme.colors.error.dark }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>

        {/* Instructions */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>INSTRUCTIONS</Text>
            <View className="flex-row gap-2">
              {/* AI Simplify Button - Shows for all recipes with steps */}
              {formData.steps.length > 0 && formData.steps.some(s => s.text.trim() !== '') && !isStepsReorderMode && (
                <TouchableOpacity
                  onPress={handleSimplifyRecipe}
                  disabled={isSimplifying}
                  className="px-3 py-2 rounded-lg flex-row items-center"
                  style={[styles.simplifyButton]}
                >
                  <MaterialCommunityIcons
                    name={isSimplifying ? "loading" : "auto-fix"}
                    size={16}
                    color="white"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.simplifyButtonText}>
                    {isSimplifying ? 'Simplifying...' : 'AI Simplify'}
                  </Text>
                </TouchableOpacity>
              )}
              {/* Reorder Button */}
              {formData.steps.length >= 3 && (
                <TouchableOpacity
                  onPress={() => setIsStepsReorderMode(!isStepsReorderMode)}
                  className="px-3 py-1 rounded-lg"
                  style={isStepsReorderMode ? styles.reorderButtonActive : styles.reorderButtonInactive}
                >
                  <Text style={isStepsReorderMode ? styles.reorderTextActive : styles.reorderTextInactive}>
                    {isStepsReorderMode ? 'Done' : 'Reorder'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
                    <View className="flex-1 border rounded-lg px-3 py-2 mr-2" style={styles.stepReorderView}>
                      <Text className="text-base">{step.text || `Step ${index + 1}`}</Text>
                    </View>
                  ) : (
                    <MultilineInstructionInput
                      ref={(ref) => (instructionRefs.current[index] = ref)}
                      className="flex-1 border rounded-lg px-3 py-2 text-base mr-2"
                      style={{ borderColor: theme.colors.border.main }}
                      placeholder={`Step ${index + 1}`}
                      placeholderTextColor={theme.colors.text.secondary}
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
                        style={getCookingActionForStep(index) ? styles.cookingActionButtonActive : styles.cookingActionButtonInactive}
                      >
                        {getCookingActionForStep(index) ? (
                          <Text className="text-sm">🍳</Text>
                        ) : (
                          <Image
                            source={{ uri: getApplianceById(formData.selectedAppliance)?.icon }}
                            style={styles.applianceIcon}
                            contentFit="contain"
                          />
                        )}
                      </TouchableOpacity>
                    )}

                      {/* Remove Instruction Button */}
                      {formData.steps.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeStep(index)}
                          className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.error.light }}
                        >
                          <Text className="font-bold" style={{ color: theme.colors.error.dark }}>×</Text>
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
              className="flex-1 border border-dashed rounded-lg px-3 py-2 text-base mr-2"
              placeholder="+ Add new instruction step"
              placeholderTextColor={theme.colors.text.secondary}
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
              style={styles.addInstructionInput}
            />
          </View>
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>NOTES</Text>
          <TextInput
            className="border rounded-lg p-3 text-base min-h-[80px]"
            style={{ borderColor: theme.colors.border.main }}
            placeholder="Add your recipe notes"
            placeholderTextColor={theme.colors.text.secondary}
            value={formData.notes}
            onChangeText={(value) => updateFormData({ notes: value })}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Delete Button */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleDelete}
            className="border rounded-lg py-3 px-4 items-center"
            style={styles.deleteButton}
          >
            <Text className="font-medium text-base" style={{ color: theme.colors.error.dark }}>Delete Recipe</Text>
          </TouchableOpacity>
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

      {/* Appliance Change Confirmation Modal */}
      <ConfirmationModal
        visible={showApplianceChangeConfirmation}
        title="Change Appliance?"
        message="Changing the appliance will remove all cooking actions from your recipe steps. This cannot be undone."
        confirmText="Change"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={confirmApplianceChange}
        onCancel={() => {
          setShowApplianceChangeConfirmation(false);
          setPendingApplianceId('');
        }}
      />
      </KeyboardAwareScrollView>

      {/* Floating Action Button for AI Assistant - Always available to help */}
      <Animated.View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={handleFabPress}
          style={styles.fabButton}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="robot-excited-outline" size={24} color="white" />
          <Text style={styles.fabText}>
            AI Assistant
          </Text>
        </TouchableOpacity>
        {/* Badge for remaining generations */}
        {remainingGenerations && remainingGenerations.daily > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>
              {remainingGenerations.daily}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        visible={showAIHelperModal}
        onClose={() => {
          setShowAIHelperModal(false);
          setAiEnhanceDescription('');
        }}
        aiDescription={aiEnhanceDescription}
        onChangeDescription={setAiEnhanceDescription}
        onGenerate={handleEnhanceRecipe}
        isGenerating={isEnhancing}
        remainingGenerations={remainingGenerations}
        enhanceMode={true}
        recipeContext={{
          title: formData.title,
          ingredients: formData.ingredients,
          steps: formData.steps.map(s => s.text),
        }}
      />

      {/* Saving Modal */}
      <SavingModal visible={isSaving} message="Updating recipe..." />

      {/* Cover Image Required Modal */}
      <CoverImageRequiredModal
        visible={showCoverImageRequiredModal}
        onUpload={handleUploadFromModal}
        onGenerateAI={handleGenerateAIFromModal}
        onCancel={() => setShowCoverImageRequiredModal(false)}
      />

      {/* Recipe Simplification Modal */}
      <RecipeSimplificationModal
        visible={showSimplificationModal && simplificationResult !== null}
        onClose={() => setShowSimplificationModal(false)}
        originalSteps={formData.steps}
        simplifiedSteps={simplificationResult?.simplifiedSteps || []}
        changesSummary={simplificationResult?.changesSummary || ''}
        onAccept={handleAcceptSimplification}
        onReject={handleRejectSimplification}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  headerButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  cancelText: {
    color: theme.colors.info.main,
    fontSize: theme.typography.fontSize.lg,
  },
  saveText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  titleInput: {
    fontSize: 20,
    borderColor: theme.colors.border.main,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  editImageBadge: {
    backgroundColor: theme.colors.primary[500],
  },
  addImageButton: {
    borderColor: theme.colors.primary[500],
  },
  cameraEmoji: {
    color: theme.colors.primary[500],
  },
  reorderButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },
  reorderButtonInactive: {
    backgroundColor: theme.colors.gray[100],
  },
  reorderTextActive: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  reorderTextInactive: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  simplifyButton: {
    backgroundColor: theme.colors.primary[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simplifyButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  stepReorderView: {
    minHeight: 40,
  },
  cookingActionButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },
  cookingActionButtonInactive: {
    backgroundColor: theme.colors.primary[100],
  },
  applianceIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary[600],
  },
  addInstructionInput: {
    opacity: 0.6,
    minHeight: 40,
    borderColor: theme.colors.border.main,
  },
  deleteButton: {
    backgroundColor: theme.colors.error.light,
    borderColor: theme.colors.error.main,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    transform: [{ scale: 1 }],
    ...theme.shadows.lg,
  },
  fabButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.secondary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  fabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
