import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch, ActivityIndicator, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MultilineInstructionInput, { MultilineInstructionInputRef } from '../components/MultilineInstructionInput';
import { Picker } from '@react-native-picker/picker';
import { RECIPE_OPTIONS } from '../constants/recipeDefaults';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { ScrapedRecipe } from '../utils/recipeScraper';
import { CookingAction, getApplianceById } from '../types/chefiq';
import ChefIQCookingSelector from '../components/ChefIQCookingSelector';
import { ApplianceDropdown } from '../components/ApplianceDropdown';
import { theme } from '../theme';
import { useRecipeForm } from '../hooks/useRecipeForm';
import { SimpleDraggableList } from '../components/DraggableList';
import { DraggableCookingAction } from '../components/DraggableCookingAction';
import { generateRecipeFromDescription } from '../utils/geminiRecipeParser';
import { checkUsageLimit, recordGeneration, getRemainingGenerations } from '../utils/aiUsageTracker';

interface RecipeCreatorProps {
  onComplete?: () => void;
}

type RecipeCreatorRouteProp = RouteProp<{ RecipeCreator: { importedRecipe?: ScrapedRecipe, fromWebImport?: boolean } }, 'RecipeCreator'>;

export default function RecipeCreatorScreen({ onComplete }: RecipeCreatorProps = {}) {
  const navigation = useNavigation();
  const route = useRoute<RecipeCreatorRouteProp>();
  const [editingCookingAction, setEditingCookingAction] = React.useState<{ action: CookingAction, stepIndex: number } | null>(null);
  const [newInstructionText, setNewInstructionText] = React.useState('');

  // AI Helper states
  const [showAIHelper, setShowAIHelper] = useState(true);
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<{
    daily: number;
    monthly: number;
    dailyLimit: number;
    monthlyLimit: number;
  } | null>(null);

  const {
    formData,
    modalStates,
    instructionSections,
    setInstructionSections,
    updateFormData,
    updateModalStates,
    setCookTimeFromMinutes,
    handleSave,
    handleCancel,
    confirmCancel,
    reorderIngredients,
    reorderInstructions,
    moveCookingAction,
    isIngredientsReorderMode,
    setIsIngredientsReorderMode,
    isInstructionsReorderMode,
    setIsInstructionsReorderMode,
    isDraggingCookingAction,
    draggingCookingAction,
    handleCookingActionDragStart,
    handleCookingActionDragEnd,
    removeCookingAction,
    resetForm
  } = useRecipeForm({
    onComplete: onComplete || (() => navigation.goBack())
  });

  // Load remaining AI generations when AI helper is shown
  useEffect(() => {
    if (showAIHelper) {
      loadRemainingGenerations();
    }
  }, [showAIHelper]);

  const loadRemainingGenerations = async () => {
    try {
      const remaining = await getRemainingGenerations();
      setRemainingGenerations(remaining);
    } catch (error) {
      console.error('Error loading remaining generations:', error);
    }
  };

  // Handle imported recipe from web import
  useEffect(() => {
    if (route.params?.importedRecipe && route.params?.fromWebImport) {
      const scrapedRecipe = route.params.importedRecipe;

      // Estimate difficulty based on cook time and number of steps
      const totalTime = scrapedRecipe.cookTime;
      const numSteps = scrapedRecipe.instructions.length;
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
        instructions: scrapedRecipe.instructions.length > 0 ? scrapedRecipe.instructions : [''],
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

        // Automatically assign cooking actions to appropriate steps
        try {
          const autoAssignedActions = autoAssignCookingActions(
            scrapedRecipe.instructions,
            suggestions.suggestedActions
          );
          updateFormData({ cookingActions: autoAssignedActions });
        } catch (error) {
          console.error('Error in auto-assigning cooking actions:', error);
          // Fallback: just use the suggested actions without step assignment
          updateFormData({ cookingActions: suggestions.suggestedActions });
        }
      }

      // Clear the route params to prevent re-triggering
      navigation.setParams({ importedRecipe: undefined, fromWebImport: undefined } as never);
    }
  }, [route.params?.importedRecipe, route.params?.fromWebImport]);

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Create Recipe',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.lg,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleCancel}
          style={{
            paddingLeft: theme.spacing.lg,
            paddingRight: theme.spacing.md,
            paddingVertical: theme.spacing.xs
          }}
        >
          <Text style={{
            color: theme.colors.text.primary,
            fontSize: 28,
            fontWeight: '300',
            lineHeight: 28
          }}>×</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs }}
        >
          <Text style={{
            color: theme.colors.primary[500],
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold
          }}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, handleCancel]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData({ imageUrl: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permissions required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData({ imageUrl: result.assets[0].uri });
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // AI Recipe Generation
  const handleGenerateRecipe = async () => {
    if (!aiDescription.trim()) {
      Alert.alert('Missing Information', 'Please describe what you want to cook.');
      return;
    }

    // Check usage limits before generating
    const usageCheck = await checkUsageLimit();
    if (!usageCheck.allowed) {
      Alert.alert('Generation Limit Reached', usageCheck.message || 'Please try again later.');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateRecipeFromDescription(aiDescription);

      if (!result.success || !result.recipe) {
        Alert.alert('Generation Failed', result.error || 'Could not generate recipe. Please try again.');
        setIsGenerating(false);
        return;
      }

      const generatedRecipe = result.recipe;

      // Estimate difficulty based on cook time and number of steps
      const totalTime = generatedRecipe.cookTime;
      const numSteps = generatedRecipe.instructions.length;
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
        instructions: generatedRecipe.instructions.length > 0 ? generatedRecipe.instructions : [''],
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

        try {
          const autoAssignedActions = autoAssignCookingActions(
            generatedRecipe.instructions,
            suggestions.suggestedActions
          );
          updateFormData({ cookingActions: autoAssignedActions });
        } catch (error) {
          console.error('Error in auto-assigning cooking actions:', error);
          updateFormData({ cookingActions: suggestions.suggestedActions });
        }
      }

      // Record successful generation
      await recordGeneration();

      // Update remaining generations display
      await loadRemainingGenerations();

      // Hide the AI helper after successful generation
      setShowAIHelper(false);
      setAiDescription('');

      Alert.alert('Success', 'Recipe generated! Review and edit as needed.');
    } catch (error) {
      console.error('Recipe generation error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  // Helper functions for ingredients and instructions
  const addIngredient = () => {
    const lastIngredient = formData.ingredients[formData.ingredients.length - 1];
    if (lastIngredient && lastIngredient.trim() === '') {
      Alert.alert('Validation Error', 'Please fill in the current ingredient before adding a new one.');
      return;
    }
    updateFormData({ ingredients: [...formData.ingredients, ''] });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    updateFormData({ ingredients: newIngredients.length > 0 ? newIngredients : [''] });
  };

  const addInstruction = () => {
    const lastInstruction = formData.instructions[formData.instructions.length - 1];
    if (lastInstruction && lastInstruction.trim() === '') {
      Alert.alert('Validation Error', 'Please fill in the current instruction before adding a new one.');
      return;
    }
    updateFormData({ instructions: [...formData.instructions, ''] });
  };

  const removeInstruction = (index: number) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    updateFormData({ instructions: newInstructions.length > 0 ? newInstructions : [''] });
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    updateFormData({ ingredients: newIngredients });
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    updateFormData({ instructions: newInstructions });
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


  // Cooking action handlers
  const handleCookingActionSelect = (action: CookingAction) => {
    if (editingCookingAction) {
      // Update existing action
      const newActions = formData.cookingActions.map(a =>
        a.stepIndex === editingCookingAction.stepIndex
          ? { ...action, stepIndex: editingCookingAction.stepIndex, id: a.id }
          : a
      );
      updateFormData({ cookingActions: newActions });
      setEditingCookingAction(null);
    } else if (formData.currentStepIndex !== null) {
      // Remove any existing action for this step
      const newActions = formData.cookingActions.filter(a => a.stepIndex !== formData.currentStepIndex);
      // Add the new action
      newActions.push({
        ...action,
        stepIndex: formData.currentStepIndex,
        id: `step_${formData.currentStepIndex}_${Date.now()}`
      });
      updateFormData({ cookingActions: newActions });
    }
    updateModalStates({ showCookingSelector: false });
    updateFormData({ currentStepIndex: null });
  };

  const handleEditCookingAction = (stepIndex: number) => {
    const action = getCookingActionForStep(stepIndex);
    if (action) {
      setEditingCookingAction({ action, stepIndex });
      updateModalStates({ showCookingSelector: true });
    }
  };


  const getCookingActionForStep = (stepIndex: number) => {
    return formData.cookingActions.find(action => action.stepIndex === stepIndex);
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
        if (action.temperature && instructionLower.includes('temperature') ||
            instructionLower.includes('degrees') || instructionLower.includes('°f')) {
          score += 2;
        }

        // Boost score for time mentions if action has duration
        if (action.duration && (instructionLower.includes('minutes') ||
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
              onPress={handleGenerateRecipe}
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
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg text-gray-800">Image</Text>
            <TouchableOpacity
              onPress={showImagePicker}
              className="w-12 h-12 border-2 rounded-lg items-center justify-center"
              style={{ borderColor: theme.colors.primary[500] }}
            >
              <Text className="text-xl" style={{ color: theme.colors.primary[500] }}>📷</Text>
            </TouchableOpacity>
          </View>
          {formData.imageUrl && (
            <View className="relative mb-2">
              <Image
                source={{ uri: formData.imageUrl }}
                style={{ width: '100%', height: 120, borderRadius: 8 }}
                contentFit="cover"
              />
              <TouchableOpacity
                onPress={() => updateFormData({ imageUrl: '' })}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
              >
                <Text className="text-white text-sm font-bold">×</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View className="mb-4 border-b border-gray-200 pb-3">
          <Text className="text-lg text-gray-800 mb-3">Info</Text>
          <View className="flex-row items-center justify-between gap-4">
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
            {formData.instructions.length >= 3 && (
              <TouchableOpacity
                onPress={() => setIsInstructionsReorderMode(!isInstructionsReorderMode)}
                className="px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: isInstructionsReorderMode ? theme.colors.primary[500] : theme.colors.gray[100]
                }}
              >
                <Text style={{
                  color: isInstructionsReorderMode ? theme.colors.text.inverse : theme.colors.primary[500],
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium
                }}>
                  {isInstructionsReorderMode ? 'Done' : 'Reorder'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <SimpleDraggableList
            data={formData.instructions}
            onReorder={reorderInstructions}
            keyExtractor={(item, index) => `instruction-${index}`}
            isReorderMode={isInstructionsReorderMode}
            renderItem={(instruction, index, isReorderMode) => {
              const cookingAction = getCookingActionForStep(index);
              return (
                <View>
                  <View className="flex-row items-center mb-1">
                    {isReorderMode ? (
                      <View className="flex-1 border border-gray-200 rounded-lg px-3 py-2 mr-2" style={{ minHeight: 40 }}>
                        <Text className="text-base">{instruction || `Step ${index + 1}`}</Text>
                      </View>
                    ) : (
                      <MultilineInstructionInput
                        ref={(ref) => (instructionRefs.current[index] = ref)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base mr-2"
                        placeholder={`Step ${index + 1}`}
                        value={instruction}
                        onChangeText={(value) => updateInstruction(index, value)}
                        onAddNewStep={() => {
                          addInstruction();
                          // Focus on the new instruction field after a brief delay
                          setTimeout(() => {
                            const newIndex = formData.instructions.length;
                            instructionRefs.current[newIndex]?.focus();
                          }, 100);
                        }}
                        onFocusNext={() => instructionRefs.current[index + 1]?.focus()}
                        isLastStep={index === formData.instructions.length - 1}
                        keyboardShouldPersistTaps="handled"
                      />
                    )}
                    {!isReorderMode && (
                      <View className="flex-row gap-1 items-center">
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
                        {formData.instructions.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeInstruction(index)}
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
                        selectedAppliance={formData.selectedAppliance}
                        isReorderMode={isInstructionsReorderMode}
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
                  updateFormData({ instructions: [...formData.instructions, textToAdd] });
                  setNewInstructionText('');
                  setTimeout(() => {
                    const newIndex = formData.instructions.length;
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
      <Modal
        visible={modalStates.showServingsPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => updateModalStates({ showServingsPicker: false })}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
            activeOpacity={1}
            onPress={() => updateModalStates({ showServingsPicker: false })}
          />
          {/* Bottom Sheet */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 20,
              maxHeight: 350,
            }}
          >
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => updateModalStates({ showServingsPicker: false })}>
                <Text className="text-base" style={{ color: theme.colors.primary[500] }}>Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Servings</Text>
              <TouchableOpacity onPress={() => updateModalStates({ showServingsPicker: false })}>
                <Text className="text-base font-semibold" style={{ color: theme.colors.primary[500] }}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={formData.servings}
              onValueChange={(value) => updateFormData({ servings: value })}
              style={{ height: 200 }}
            >
              {Array.from({ length: RECIPE_OPTIONS.MAX_SERVINGS }, (_, i) => i + 1).map((num) => (
                <Picker.Item key={num} label={`${num} serving${num > 1 ? 's' : ''}`} value={num} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Cook Time Picker Modal */}
      <Modal
        visible={modalStates.showCookTimePicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => updateModalStates({ showCookTimePicker: false })}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
            activeOpacity={1}
            onPress={() => updateModalStates({ showCookTimePicker: false })}
          />
          {/* Bottom Sheet */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 20,
              maxHeight: 400,
            }}
          >
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => updateModalStates({ showCookTimePicker: false })}>
                <Text className="text-base" style={{ color: theme.colors.primary[500] }}>Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Cook Time</Text>
              <TouchableOpacity onPress={() => updateModalStates({ showCookTimePicker: false })}>
                <Text className="text-base font-semibold" style={{ color: theme.colors.primary[500] }}>Done</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row" style={{ height: 250 }}>
              {/* Hours Picker */}
              <View className="flex-1">
                <Text className="text-center p-3 font-medium text-gray-600">Hours</Text>
                <Picker
                  selectedValue={formData.cookTimeHours}
                  onValueChange={(value) => updateFormData({ cookTimeHours: value })}
                  style={{ height: 180 }}
                >
                  {Array.from({ length: RECIPE_OPTIONS.MAX_HOURS + 1 }, (_, i) => i).map((num) => (
                    <Picker.Item key={num} label={`${num}`} value={num} />
                  ))}
                </Picker>
              </View>
              {/* Minutes Picker */}
              <View className="flex-1">
                <Text className="text-center p-3 font-medium text-gray-600">Minutes</Text>
                <Picker
                  selectedValue={formData.cookTimeMinutes}
                  onValueChange={(value) => updateFormData({ cookTimeMinutes: value })}
                  style={{ height: 180 }}
                >
                  {Array.from({ length: 12 }, (_, i) => i * RECIPE_OPTIONS.MINUTE_INTERVALS).map((num) => (
                    <Picker.Item key={num} label={`${num}`} value={num} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={modalStates.showCategoryPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => updateModalStates({ showCategoryPicker: false })}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
            activeOpacity={1}
            onPress={() => updateModalStates({ showCategoryPicker: false })}
          />
          {/* Bottom Sheet */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 20,
              maxHeight: 450,
            }}
          >
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => updateModalStates({ showCategoryPicker: false })}>
                <Text className="text-base" style={{ color: theme.colors.primary[500] }}>Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Category</Text>
              <TouchableOpacity onPress={() => updateModalStates({ showCategoryPicker: false })}>
                <Text className="text-base font-semibold" style={{ color: theme.colors.primary[500] }}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => updateFormData({ category: value })}
              style={{ height: 200 }}
            >
              <Picker.Item label="Uncategorized" value="" />
              {RECIPE_OPTIONS.CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Tags Picker Modal */}
      <Modal
        visible={modalStates.showTagsPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => updateModalStates({ showTagsPicker: false })}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
            activeOpacity={1}
            onPress={() => updateModalStates({ showTagsPicker: false })}
          />
          {/* Bottom Sheet */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 20,
              maxHeight: '70%',
            }}
          >
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <View />
              <Text className="text-lg font-semibold">Add Tags</Text>
              <TouchableOpacity onPress={() => updateModalStates({ showTagsPicker: false })}>
                <Text className="text-base font-semibold" style={{ color: theme.colors.primary[500] }}>Done</Text>
              </TouchableOpacity>
            </View>
            <KeyboardAwareScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: theme.spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                Common Tags
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {RECIPE_OPTIONS.COMMON_TAGS.map((tag) => {
                  const isSelected = formData.tags && formData.tags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => {
                        if (isSelected) {
                          updateFormData({ tags: (formData.tags || []).filter(t => t !== tag) });
                        } else {
                          updateFormData({ tags: [...(formData.tags || []), tag] });
                        }
                      }}
                      className="px-3 py-2 rounded-full"
                      style={{
                        backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[100],
                        borderWidth: 1,
                        borderColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[300]
                      }}
                    >
                      <Text
                        className="text-sm"
                        style={{
                          color: isSelected ? 'white' : theme.colors.text.primary,
                          fontWeight: isSelected ? '600' : '400'
                        }}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                Custom Tag
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border rounded-lg px-3 py-2"
                  style={{
                    borderColor: theme.colors.gray[300],
                    fontSize: theme.typography.fontSize.base
                  }}
                  placeholder="Enter custom tag"
                  onSubmitEditing={(e) => {
                    const customTag = e.nativeEvent.text.trim();
                    const currentTags = formData.tags || [];
                    if (customTag && !currentTags.includes(customTag)) {
                      updateFormData({ tags: [...currentTags, customTag] });
                      e.target.clear();
                    }
                  }}
                  returnKeyType="done"
                />
              </View>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={modalStates.showCancelConfirmation}
        animationType="fade"
        transparent={true}
        onRequestClose={() => updateModalStates({ showCancelConfirmation: false })}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            width: '85%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: 12,
              color: theme.colors.text.primary
            }}>
              Discard Changes?
            </Text>
            <Text style={{
              fontSize: 15,
              textAlign: 'center',
              marginBottom: 20,
              color: theme.colors.text.secondary
            }}>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => updateModalStates({ showCancelConfirmation: false })}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: theme.colors.gray[100],
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors.text.primary
                }}>
                  Keep Editing
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCancel}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: theme.colors.error.main,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'white'
                }}>
                  Discard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}