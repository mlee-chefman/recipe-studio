import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch, Animated, StyleSheet } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MultilineInstructionInput, { MultilineInstructionInputRef } from '@components/MultilineInstructionInput';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { CookingAction, getApplianceById } from '~/types/chefiq';
import ChefIQCookingSelector from '@components/ChefIQCookingSelector';
import { ApplianceDropdown } from '@components/ApplianceDropdown';
import { TemperatureInfoModal ,
  ConfirmationModal,
  AIAssistantModal,
  SavingModal,
  CoverImageRequiredModal,
} from '@components/modals';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { useRecipeForm } from '@hooks/useRecipeForm';
import { useAuthStore } from '@store/store';
import { SimpleDraggableList } from '@components/DraggableList';
import { DraggableCookingAction } from '@components/DraggableCookingAction';
import { useImagePicker } from '@hooks/useImagePicker';
import { useAIRecipeGenerator } from '@hooks/useAIRecipeGenerator';
import { useCookingActions } from '@hooks/useCookingActions';
import { useAICoverGeneration } from '@hooks/useAICoverGeneration';
import * as recipeHelpers from '@utils/helpers/recipeFormHelpers';
import { formatCookTime } from '@utils/helpers/recipeHelpers';
import StepImage from '@components/StepImage';
import RecipeCoverImage from '@components/RecipeCoverImage';
import { haptics } from '@utils/haptics';

// UUID generator using expo-crypto
const uuidv4 = () => Crypto.randomUUID();

interface RecipeCreatorProps {
  onComplete?: () => void;
}

type RecipeCreatorRouteProp = RouteProp<{ RecipeCreator: { importedRecipe?: ScrapedRecipe, fromWebImport?: boolean } }, 'RecipeCreator'>;

export default function RecipeCreatorScreen({ onComplete }: RecipeCreatorProps = {}) {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<RecipeCreatorRouteProp>();
  const [newInstructionText, setNewInstructionText] = React.useState('');
  const [showAIHelperModal, setShowAIHelperModal] = useState(false);
  const [showTempInfo, setShowTempInfo] = useState(false);
  const [tempInfoStepIndex, setTempInfoStepIndex] = useState<number | null>(null);
  const [tempRecipeId] = useState(() => uuidv4()); // Generate temp ID for new recipes
  const [showCoverImageRequiredModal, setShowCoverImageRequiredModal] = useState(false);
  const [showApplianceChangeConfirmation, setShowApplianceChangeConfirmation] = useState(false);
  const [pendingApplianceId, setPendingApplianceId] = useState<string>('');
  const fabScale = useRef(new Animated.Value(1)).current;
  const styles = useStyles((theme) => createStyles(theme, fabScale));
  const { user } = useAuthStore();
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
    resetForm,
    isSaving
  } = useRecipeForm({
    onComplete: onComplete || (() => navigation.goBack()),
    onCoverImageRequired: () => setShowCoverImageRequiredModal(true)
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
    userId: user?.uid,
    recipeId: tempRecipeId,
    autoGenerateImage: true,
    onRecipeGenerated: (generatedRecipe, imageUrl) => {
      // Estimate difficulty based on cook time and number of steps
      const totalTime = generatedRecipe.cookTime;
      const numSteps = generatedRecipe.steps.length;
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (totalTime < 30 && numSteps < 5) {
        difficulty = 'Easy';
      } else if (totalTime > 60 || numSteps > 10) {
        difficulty = 'Hard';
      }

      // Populate form fields with generated data (including auto-generated image)
      setCookTimeFromMinutes(generatedRecipe.cookTime);
      updateFormData({
        title: generatedRecipe.title,
        notes: generatedRecipe.description,
        ingredients: generatedRecipe.ingredients.length > 0 ? generatedRecipe.ingredients : [''],
        steps: generatedRecipe.steps.length > 0 ? generatedRecipe.steps : [{ text: '' }],
        servings: generatedRecipe.servings,
        category: generatedRecipe.category || '',
        imageUrl: imageUrl || '', // Set auto-generated image
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

      // Close the AI helper modal after successful generation
      setShowAIHelperModal(false);
      setAiDescription(''); // Clear the description for next use
    }
  });

  // Reload remaining generations when AI helper modal is opened
  useEffect(() => {
    if (showAIHelperModal) {
      loadRemainingGenerations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAIHelperModal]);

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

      console.log(`📸 Recipe Creator: Received ${scrapedRecipe.steps.length} steps from web import`);
      console.log(`📸 Recipe Creator: ${scrapedRecipe.steps.filter(s => s.image).length} steps have images`);
      if (scrapedRecipe.steps.some(s => s.image)) {
        console.log(`📸 Sample step images:`, scrapedRecipe.steps.filter(s => s.image).slice(0, 2).map(s => s.image));
      }

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
          style={styles.headerLeftButton}
        >
          <Feather name="x" size={28} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerRightButton}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, handleCancel]);

  // Image picker hook
  const { showImageOptions } = useImagePicker({
    onImageSelected: (uri) => updateFormData({ imageUrl: uri }),
  });

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
      // Silently skip if quota exceeded - user can try uploading manually
      console.log('AI cover generation skipped (quota exceeded or failed)');
      // Optionally show a gentle message
      Alert.alert(
        'Image Generation Unavailable',
        'AI cover generation is currently unavailable. You can upload a photo manually instead.'
      );
    }
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
      updateFormData({ steps: result.value });
    } else {
      haptics.warning();
      Alert.alert('Validation Error', result.error);
    }
  };

  const removeStep = (index: number) => {
    haptics.light();
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
          id: action.id || uuidv4()
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
          id: uuidv4()
        });
      } else {
        // Default to assigning to the main cooking step (usually step 3-4)
        const defaultStepIndex = Math.min(Math.max(2, Math.floor(instructions.length / 2)), instructions.length - 1);
        assignedActions.push({
          ...action,
          stepIndex: defaultStepIndex,
          id: uuidv4()
        });
      }
    });

    return assignedActions;
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
        style={styles.scrollView}
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
          className="mb-4 border rounded-lg px-4 py-3"
          style={{ borderColor: theme.colors.border.main, backgroundColor: theme.colors.surface.primary }}
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
        <View className="mb-4 border rounded-lg p-4" style={{ borderColor: theme.colors.border.main, backgroundColor: theme.colors.surface.primary }}>
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
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: theme.colors.error.light }}
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
                            className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: theme.colors.error.light }}
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

    {/* Floating Action Button for AI Helper */}
    <Animated.View style={styles.fabContainer}>
      <TouchableOpacity
        onPress={handleFabPress}
        style={styles.fabButton}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="robot-excited" size={28} color="white" />
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

    {/* AI Helper Modal */}
    <AIAssistantModal
      visible={showAIHelperModal}
      onClose={() => setShowAIHelperModal(false)}
      aiDescription={aiDescription}
      onChangeDescription={setAiDescription}
      onGenerate={generateRecipe}
      isGenerating={isGenerating}
      remainingGenerations={remainingGenerations}
    />

    {/* Saving Modal */}
    <SavingModal visible={isSaving} message="Creating recipe..." />

    {/* Cover Image Required Modal */}
    <CoverImageRequiredModal
      visible={showCoverImageRequiredModal}
      onUpload={handleUploadFromModal}
      onGenerateAI={handleGenerateAIFromModal}
      onCancel={() => setShowCoverImageRequiredModal(false)}
    />
  </View>
  );
}

const createStyles = (theme: Theme, fabScale: Animated.Value) => StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  headerLeftButton: {
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerRightButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  saveText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  titleInput: {
    fontSize: 20,
    borderColor: theme.colors.border.main,
    color: theme.colors.text.primary,
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
  stepReorderView: {
    minHeight: 40,
    borderColor: theme.colors.border.main,
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
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    transform: [{ scale: fabScale }],
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
