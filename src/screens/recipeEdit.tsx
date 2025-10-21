import React, { useLayoutEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
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
import { useCookingActions } from '@hooks/useCookingActions';
import * as recipeHelpers from '@utils/helpers/recipeFormHelpers';
import { formatCookTime } from '@utils/helpers/recipeHelpers';
import StepImage from '@components/StepImage';
import {
  ConfirmationModal,
} from '~/components/modals';

type RootStackParamList = {
  RecipeEdit: { recipe: Recipe };
};

type RecipeEditRouteProp = RouteProp<RootStackParamList, 'RecipeEdit'>;

export default function RecipeEditScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute<RecipeEditRouteProp>();
  const { recipe } = route.params;
  const [newInstructionText, setNewInstructionText] = React.useState('');

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
    removeCookingAction
  } = useRecipeForm({
    editingRecipe: recipe,
  });

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Edit Recipe',
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
          style={styles.headerButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
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
      updateFormData({
        steps: result.value
      });
    } else {
      Alert.alert('Validation Error', result.error);
    }
  };

  const removeStep = (index: number) => {
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

  return (
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
            onChangeText={(value) => updateFormData({ title: value })}
            style={styles.titleInput}
          />
        </View>

        {/* Image */}
        <View className="mb-4 border-b pb-3" style={{ borderColor: theme.colors.border.main }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-lg" style={{ color: theme.colors.text.primary }}>Image</Text>
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
                  style={styles.recipeImage}
                  contentFit="cover"
                />
                <View
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full items-center justify-center"
                  style={styles.editImageBadge}
                >
                  <Ionicons name="pencil" size={14} color="white" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={showImageOptions}
                className="w-12 h-12 border-2 rounded-lg items-center justify-center"
                style={styles.addImageButton}
              >
                <Text className="text-xl" style={styles.cameraEmoji}>📷</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recipe Info Button */}
        <TouchableOpacity
          className="mb-4 border rounded-lg px-4 py-3 bg-white"
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
        <View className="mb-4 border rounded-lg p-4 bg-white">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: theme.colors.text.primary }}>Published</Text>
              <Text className="text-sm" style={{ color: theme.colors.text.tertiary }}>Make this recipe visible to others</Text>
            </View>
            <Switch
              value={formData.published}
              onValueChange={(value) => updateFormData({ published: value })}
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
              onSelect={(appliance) => updateFormData({ selectedAppliance: appliance })}
            />
          </View>

          {/* Probe Toggle */}
          {formData.selectedAppliance && getApplianceById(formData.selectedAppliance) && (
            <View className="flex-row items-center justify-between mb-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
              <View className="flex-1">
                <Text className="text-base font-medium" style={{ color: theme.colors.text.primary }}>Use Thermometer Probe</Text>
                <Text className="text-sm" style={{ color: theme.colors.text.secondary }}>Monitor internal temperature during cooking</Text>
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
                  <View className="flex-1 border rounded-lg px-3 py-2 mr-2">
                    <Text className="text-base">{ingredient || `Ingredient ${index + 1}`}</Text>
                  </View>
                ) : (
                  <TextInput
                    ref={(ref) => (ingredientRefs.current[index] = ref)}
                    className="flex-1 border rounded-lg px-3 py-2 text-base mr-2"
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
            placeholder="Add your recipe notes"
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
    </KeyboardAwareScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
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
  titleInput: {
    fontSize: 20,
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
});
