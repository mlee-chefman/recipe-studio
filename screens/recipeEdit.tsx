import React, { useLayoutEffect, useRef } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RECIPE_OPTIONS } from '../constants/recipeDefaults';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Recipe } from '../store/store';
import { useRecipeForm } from '../hooks/useRecipeForm';
import { CookingAction, getApplianceById } from '../types/chefiq';
import ChefIQCookingSelector from '../components/ChefIQCookingSelector';
import { ApplianceDropdown } from '../components/ApplianceDropdown';
import { theme } from '../theme';
import { SimpleDraggableList } from '../components/DraggableList';
import { DraggableCookingAction } from '../components/DraggableCookingAction';

type RootStackParamList = {
  RecipeEdit: { recipe: Recipe };
};

type RecipeEditRouteProp = RouteProp<RootStackParamList, 'RecipeEdit'>;

export default function RecipeEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<RecipeEditRouteProp>();
  const { recipe } = route.params;
  const [editingCookingAction, setEditingCookingAction] = React.useState<{ action: CookingAction, stepIndex: number } | null>(null);

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
    handleDelete,
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
    removeCookingAction
  } = useRecipeForm({
    editingRecipe: recipe,
    onComplete: () => navigation.goBack()
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
          style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs }}
        >
          <Text style={{
            color: theme.colors.info.main,
            fontSize: theme.typography.fontSize.lg
          }}>Cancel</Text>
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
  const instructionRefs = useRef<(TextInput | null)[]>([]);

  // Helper functions for Enter key submission
  const handleIngredientSubmit = (index: number) => {
    const currentIngredient = formData.ingredients[index];
    if (currentIngredient && currentIngredient.trim() !== '') {
      if (index === formData.ingredients.length - 1) {
        // If it's the last ingredient and has content, add a new one
        addIngredient();
        // Focus on the new ingredient field after a brief delay
        setTimeout(() => {
          const newIndex = formData.ingredients.length;
          ingredientRefs.current[newIndex]?.focus();
        }, 100);
      } else {
        // Focus on the next ingredient field
        ingredientRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleInstructionSubmit = (index: number) => {
    const currentInstruction = formData.instructions[index];
    if (currentInstruction && currentInstruction.trim() !== '') {
      if (index === formData.instructions.length - 1) {
        // If it's the last instruction and has content, add a new one
        addInstruction();
        // Focus on the new instruction field after a brief delay
        setTimeout(() => {
          const newIndex = formData.instructions.length;
          instructionRefs.current[newIndex]?.focus();
        }, 100);
      } else {
        // Focus on the next instruction field
        instructionRefs.current[index + 1]?.focus();
      }
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg
        }}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Category */}
        <TouchableOpacity className="mb-4 border-b border-gray-200 pb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg text-gray-800">Category</Text>
            <TextInput
              className="text-lg text-gray-500 text-right flex-1 ml-4"
              placeholder="Uncategorized"
              value={formData.category}
              onChangeText={(value) => updateFormData({ category: value })}
              textAlign="right"
            />
          </View>
        </TouchableOpacity>

        {/* Info Section */}
        <View className="mb-4 border-b border-gray-200 pb-3">
          <Text className="text-lg text-gray-800 mb-3">Info</Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-600">Cook Time</Text>
              <TouchableOpacity
                onPress={() => updateModalStates({ showCookTimePicker: true })}
                className="border-b border-gray-200 py-1 px-2 min-w-[100px]"
              >
                <Text className="text-base text-gray-800 text-right">
                  {formData.cookTimeHours > 0 ? `${formData.cookTimeHours}h ${formData.cookTimeMinutes}m` : `${formData.cookTimeMinutes}m`}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-600">Servings</Text>
              <TouchableOpacity
                onPress={() => updateModalStates({ showServingsPicker: true })}
                className="border-b border-gray-200 py-1 px-2 min-w-[60px]"
              >
                <Text className="text-base text-gray-800 text-right">{formData.servings}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-600">Difficulty</Text>
              <View className="flex-row space-x-2">
                {RECIPE_OPTIONS.DIFFICULTIES.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => updateFormData({ difficulty: level })}
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: formData.difficulty === level ? theme.colors.primary[100] : theme.colors.gray[100]
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: formData.difficulty === level ? theme.colors.primary[600] : theme.colors.text.secondary
                      }}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
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
          {formData.selectedAppliance && getApplianceById(formData.selectedAppliance) && (
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
            keyExtractor={(item, index) => `ingredient-${index}-${item.substring(0, 10)}`}
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
                    returnKeyType={index === formData.ingredients.length - 1 ? "done" : "next"}
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
            keyExtractor={(item, index) => `instruction-${index}-${item.substring(0, 10)}`}
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
                    <TextInput
                      ref={(ref) => (instructionRefs.current[index] = ref)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base mr-2"
                      placeholder={`Step ${index + 1}`}
                      value={instruction}
                      onChangeText={(value) => updateInstruction(index, value)}
                      onSubmitEditing={() => handleInstructionSubmit(index)}
                      returnKeyType={index === formData.instructions.length - 1 ? "done" : "next"}
                      blurOnSubmit={false}
                      style={{ minHeight: 40 }}
                      scrollEnabled={false}
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

        {/* Delete Button */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleDelete}
            className="border border-red-300 rounded-lg py-3 px-4 items-center"
            style={{ backgroundColor: '#fef2f2' }}
          >
            <Text className="text-red-600 font-medium text-base">Delete Recipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}