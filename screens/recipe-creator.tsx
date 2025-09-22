import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, Switch, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRecipeStore, Recipe } from '../store/store';
import { useNavigation } from '@react-navigation/native';
import { scrapeRecipe, isValidUrl } from '../utils/recipeScraper';
import { CookingAction, InstructionSection, getApplianceById } from '../types/chefiq';
import ChefIQCookingSelector from '../components/ChefIQCookingSelector';
import { ApplianceDropdown } from '../components/ApplianceDropdown';
import { theme } from '../theme';

interface SimpleRecipeCreatorProps {
  editingRecipe?: Recipe;
  onEditComplete?: () => void;
}

export default function SimpleRecipeCreator({ editingRecipe, onEditComplete }: SimpleRecipeCreatorProps = {}) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [cookTime, setCookTime] = useState(0);
  const [cookTimeHours, setCookTimeHours] = useState(0);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(0);
  const [servings, setServings] = useState(4);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [notes, setNotes] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);

  // ChefIQ features
  const [selectedAppliance, setSelectedAppliance] = useState('');
  const [cookingActions, setCookingActions] = useState<CookingAction[]>([]);
  const [instructionSections, setInstructionSections] = useState<InstructionSection[]>([]);
  const [showCookingSelector, setShowCookingSelector] = useState(false);
  const [showServingsPicker, setShowServingsPicker] = useState(false);
  const [showCookTimePicker, setShowCookTimePicker] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [useProbe, setUseProbe] = useState(false);

  const { addRecipe, updateRecipe } = useRecipeStore();
  const navigation = useNavigation();

  // Populate form when editing
  useEffect(() => {
    if (editingRecipe) {
      setTitle(editingRecipe.title);
      setImageUrl(editingRecipe.image || '');
      setCategory(editingRecipe.category);
      setCookTimeFromMinutes(editingRecipe.cookTime);
      setServings(editingRecipe.servings);
      setDifficulty(editingRecipe.difficulty);
      setIngredients(editingRecipe.ingredients.length > 0 ? editingRecipe.ingredients : ['']);
      setInstructions(editingRecipe.instructions.length > 0 ? editingRecipe.instructions : ['']);
      setNotes(editingRecipe.description);
      setSelectedAppliance(editingRecipe.chefiqAppliance || '');
      setCookingActions(editingRecipe.cookingActions || []);
      setInstructionSections(editingRecipe.instructionSections || []);
      setUseProbe(editingRecipe.useProbe || false);
    }
  }, [editingRecipe]);

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: editingRecipe ? 'Edit' : 'Create',
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowImportSection(!showImportSection)}
            style={{
              backgroundColor: showImportSection ? theme.colors.primary[500] : theme.colors.gray[100],
              borderRadius: theme.borderRadius.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              marginRight: theme.spacing.md
            }}
          >
            <Text style={{
              color: showImportSection ? theme.colors.text.inverse : theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium
            }}>
              Import
            </Text>
          </TouchableOpacity>
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
        </View>
      ),
    });
  }, [navigation, editingRecipe, showImportSection, handleSave, handleCancel]);

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
      setImageUrl(result.assets[0].uri);
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
      setImageUrl(result.assets[0].uri);
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

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    if (!isValidUrl(importUrl)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsImporting(true);

    try {
      const scrapedRecipe = await scrapeRecipe(importUrl);

      // Populate form fields with scraped data
      setTitle(scrapedRecipe.title);
      setNotes(scrapedRecipe.description);
      setIngredients(scrapedRecipe.ingredients.length > 0 ? scrapedRecipe.ingredients : ['']);
      setInstructions(scrapedRecipe.instructions.length > 0 ? scrapedRecipe.instructions : ['']);
      setCookTime(scrapedRecipe.cookTime.toString());
      setServings(scrapedRecipe.servings.toString());
      setCategory(scrapedRecipe.category || '');
      setImageUrl(scrapedRecipe.image || '');

      // Estimate difficulty based on cook time and number of steps
      const totalTime = scrapedRecipe.cookTime;
      const numSteps = scrapedRecipe.instructions.length;

      if (totalTime < 30 && numSteps < 5) {
        setDifficulty('Easy');
      } else if (totalTime > 60 || numSteps > 10) {
        setDifficulty('Hard');
      } else {
        setDifficulty('Medium');
      }

      // Handle ChefIQ suggestions
      const suggestions = scrapedRecipe.chefiqSuggestions;
      if (suggestions && suggestions.confidence > 0.3 && suggestions.suggestedActions.length > 0) {
        // Auto-apply suggestions
        if (suggestions.suggestedAppliance) {
          setSelectedAppliance(suggestions.suggestedAppliance);
        }
        if (suggestions.useProbe) {
          setUseProbe(true);
        }

        // Automatically assign cooking actions to appropriate steps
        try {
          const autoAssignedActions = autoAssignCookingActions(
            scrapedRecipe.instructions,
            suggestions.suggestedActions
          );
          setCookingActions(autoAssignedActions);
        } catch (error) {
          console.error('Error in auto-assigning cooking actions:', error);
          // Fallback: just use the suggested actions without step assignment
          setCookingActions(suggestions.suggestedActions);
        }
      }

      Alert.alert(
        'Recipe Imported Successfully!',
        'Recipe imported from website. You can now review and edit the details before saving.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowImportSection(false);
              setImportUrl('');
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Import Failed', 'Could not import recipe from this URL. Please try a different URL or enter the recipe manually.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Recipe title is required');
      return;
    }

    const validIngredients = ingredients.filter(i => i.trim() !== '');
    if (validIngredients.length === 0) {
      Alert.alert('Error', 'At least one ingredient is required');
      return;
    }

    const validInstructions = instructions.filter(i => i.trim() !== '');
    if (validInstructions.length === 0) {
      Alert.alert('Error', 'At least one instruction is required');
      return;
    }

    const recipe = {
      title: title.trim(),
      description: notes.trim() || 'No description provided',
      ingredients: validIngredients,
      instructions: validInstructions,
      cookTime: parseInt(cookTime) || 30,
      servings: parseInt(servings) || 4,
      difficulty,
      category: category.trim() || 'Uncategorized',
      image: imageUrl.trim() || undefined,
      chefiqAppliance: selectedAppliance || undefined,
      cookingActions: cookingActions.length > 0 ? cookingActions : undefined,
      instructionSections: instructionSections.length > 0 ? instructionSections : undefined,
      useProbe: useProbe || undefined,
    };

    if (editingRecipe) {
      updateRecipe(editingRecipe.id, recipe);
      Alert.alert('Success', 'Recipe updated!', [
        { text: 'OK', onPress: onEditComplete }
      ]);
    } else {
      addRecipe(recipe);
      Alert.alert('Success', 'Recipe created!', [
        { text: 'OK', onPress: () => navigation.navigate('One' as never) }
      ]);
    }
  };

  const handleCancel = () => {
    if (onEditComplete) {
      onEditComplete();
    } else {
      navigation.goBack();
    }
  };

  // Helper functions for ingredients and instructions
  const addIngredient = () => {
    const lastIngredient = ingredients[ingredients.length - 1];
    if (lastIngredient && lastIngredient.trim() === '') {
      Alert.alert('Validation Error', 'Please fill in the current ingredient before adding a new one.');
      return;
    }
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients.length > 0 ? newIngredients : ['']);
  };

  const addInstruction = () => {
    const lastInstruction = instructions[instructions.length - 1];
    if (lastInstruction && lastInstruction.trim() === '') {
      Alert.alert('Validation Error', 'Please fill in the current instruction before adding a new one.');
      return;
    }
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    setInstructions(newInstructions.length > 0 ? newInstructions : ['']);
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  // Refs for managing focus
  const ingredientRefs = useRef<(TextInput | null)[]>([]);
  const instructionRefs = useRef<(TextInput | null)[]>([]);

  // Helper functions for Enter key submission
  const handleIngredientSubmit = (index: number) => {
    const currentIngredient = ingredients[index];
    if (currentIngredient && currentIngredient.trim() !== '') {
      if (index === ingredients.length - 1) {
        // If it's the last ingredient and has content, add a new one
        addIngredient();
        // Focus on the new ingredient field after a brief delay
        setTimeout(() => {
          const newIndex = ingredients.length;
          ingredientRefs.current[newIndex]?.focus();
        }, 100);
      } else {
        // Focus on the next ingredient field
        ingredientRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleInstructionSubmit = (index: number) => {
    const currentInstruction = instructions[index];
    if (currentInstruction && currentInstruction.trim() !== '') {
      if (index === instructions.length - 1) {
        // If it's the last instruction and has content, add a new one
        addInstruction();
        // Focus on the new instruction field after a brief delay
        setTimeout(() => {
          const newIndex = instructions.length;
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
    if (currentStepIndex !== null) {
      // Remove any existing action for this step
      const newActions = cookingActions.filter(a => a.stepIndex !== currentStepIndex);
      // Add the new action
      newActions.push({
        ...action,
        stepIndex: currentStepIndex,
        id: `step_${currentStepIndex}_${Date.now()}`
      });
      setCookingActions(newActions);
    }
    setShowCookingSelector(false);
    setCurrentStepIndex(null);
  };

  const removeCookingAction = (stepIndex: number) => {
    setCookingActions(cookingActions.filter(action => action.stepIndex !== stepIndex));
  };

  const getCookingActionForStep = (stepIndex: number) => {
    return cookingActions.find(action => action.stepIndex === stepIndex);
  };

  // Auto-assign cooking actions to recipe steps
  const autoAssignCookingActions = (instructions: string[], suggestedActions: CookingAction[]) => {
    const assignedActions: CookingAction[] = [];
    suggestedActions.forEach(action => {
      // Find the best step to assign this cooking action to
      let bestStepIndex = -1;
      let bestScore = 0;

      instructions.forEach((instruction, index) => {
        const instructionLower = instruction.toLowerCase();
        let score = 0;

        // Score based on cooking method keywords
        const methodKeywords = {
          'pressure': ['pressure', 'instant pot', 'cook under pressure'],
          'sauté': ['sauté', 'saute', 'brown', 'sear', 'fry', 'heat oil'],
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
        {/* Import from URL Section */}
        {showImportSection && (
          <View
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: theme.colors.secondary[50] }}
          >
            <Text
              className="text-lg font-semibold mb-2"
              style={{ color: theme.colors.primary[500] }}
            >Import Recipe from Website</Text>
            <Text className="text-sm text-gray-600 mb-3">
              Enter a URL from popular recipe sites like AllRecipes, Food Network, etc.
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base bg-white"
                placeholder="https://www.example.com/recipe"
                value={importUrl}
                onChangeText={setImportUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                onPress={handleImportFromUrl}
                disabled={isImporting}
                className="rounded-lg px-4 py-2 justify-center"
                style={{ backgroundColor: isImporting ? theme.colors.gray[400] : theme.colors.primary[500] }}
              >
                {isImporting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-semibold">Import</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Title */}
        <View className="mb-4">
          <TextInput
            className="text-xl font-medium text-gray-800 border-b border-gray-200 pb-2"
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
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
          {imageUrl && (
            <View className="relative mb-2">
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: 120, borderRadius: 8 }}
                contentFit="cover"
              />
              <TouchableOpacity
                onPress={() => setImageUrl('')}
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
              value={category}
              onChangeText={setCategory}
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
                onPress={() => setShowCookTimePicker(true)}
                className="border-b border-gray-200 py-1 px-2 min-w-[100px]"
              >
                <Text className="text-base text-gray-800 text-right">
                  {cookTimeHours > 0 ? `${cookTimeHours}h ${cookTimeMinutes}m` : `${cookTimeMinutes}m`}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-600">Servings</Text>
              <TouchableOpacity
                onPress={() => setShowServingsPicker(true)}
                className="border-b border-gray-200 py-1 px-2 min-w-[60px]"
              >
                <Text className="text-base text-gray-800 text-right">{servings}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-600">Difficulty</Text>
              <View className="flex-row space-x-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setDifficulty(level)}
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: difficulty === level ? theme.colors.primary[100] : theme.colors.gray[100]
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: difficulty === level ? theme.colors.primary[600] : theme.colors.text.secondary
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
              selectedAppliance={selectedAppliance}
              onSelect={setSelectedAppliance}
            />
          </View>

          {/* Probe Toggle */}
          {selectedAppliance && getApplianceById(selectedAppliance)?.supports_probe && (
            <View className="flex-row items-center justify-between mb-3 bg-gray-50 p-3 rounded-lg">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Use Thermometer Probe</Text>
                <Text className="text-sm text-gray-600">Monitor internal temperature during cooking</Text>
              </View>
              <Switch
                value={useProbe}
                onValueChange={setUseProbe}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary[500] }}
                thumbColor={theme.colors.background.primary}
              />
            </View>
          )}
        </View>

        {/* Ingredients */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">INGREDIENTS</Text>
          {ingredients.map((ingredient, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                ref={(ref) => (ingredientRefs.current[index] = ref)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base mr-2"
                placeholder={`Ingredient ${index + 1}`}
                value={ingredient}
                onChangeText={(value) => updateIngredient(index, value)}
                onSubmitEditing={() => handleIngredientSubmit(index)}
                returnKeyType={index === ingredients.length - 1 ? "done" : "next"}
                blurOnSubmit={false}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeIngredient(index)}
                  className="w-8 h-8 bg-red-100 rounded-full items-center justify-center"
                >
                  <Text className="text-red-600 font-bold">×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">INSTRUCTIONS</Text>
          {instructions.map((instruction, index) => {
            const cookingAction = getCookingActionForStep(index);
            return (
              <View key={index} className="mb-3">
                <View className="flex-row items-center mb-1">
                  <TextInput
                    ref={(ref) => (instructionRefs.current[index] = ref)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base mr-2"
                    placeholder={`Step ${index + 1}`}
                    value={instruction}
                    onChangeText={(value) => updateInstruction(index, value)}
                    onSubmitEditing={() => handleInstructionSubmit(index)}
                    returnKeyType={index === instructions.length - 1 ? "done" : "next"}
                    blurOnSubmit={false}
                    style={{ minHeight: 40 }}
                  />
                  <View className="flex-row gap-1 items-center">
                    {/* Add Cooking Method Button - Only show if appliance is selected */}
                    {selectedAppliance && (
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentStepIndex(index);
                          setShowCookingSelector(true);
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
                            source={{ uri: getApplianceById(selectedAppliance)?.icon }}
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
                    {instructions.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeInstruction(index)}
                        className="w-8 h-8 bg-red-100 rounded-full items-center justify-center"
                      >
                        <Text className="text-red-600 font-bold">×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Cooking Action Display */}
                {cookingAction && (
                  <View className="ml-9 bg-green-50 border border-green-200 rounded-lg p-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-green-800">
                          🍳 {cookingAction.methodName}
                        </Text>
                        <Text className="text-xs text-green-600 mt-1">
                          {selectedAppliance && getApplianceById(selectedAppliance)?.name}
                          {cookingAction.temperature && ` • ${cookingAction.temperature}°F`}
                          {cookingAction.duration && ` • ${cookingAction.duration} min`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeCookingAction(index)}
                        className="w-6 h-6 bg-red-100 rounded-full items-center justify-center ml-2"
                      >
                        <Text className="text-red-600 text-xs font-bold">×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">NOTES</Text>
          <TextInput
            className="border border-gray-200 rounded-lg p-3 text-base min-h-[80px]"
            placeholder="Add your recipe notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* ChefIQ Cooking Selector Modal */}
      {selectedAppliance && (
        <ChefIQCookingSelector
          visible={showCookingSelector}
          onClose={() => {
            setShowCookingSelector(false);
            setCurrentStepIndex(null);
          }}
          onSelect={handleCookingActionSelect}
          applianceId={selectedAppliance}
          useProbe={useProbe}
        />
      )}

      {/* Servings Picker Modal */}
      <Modal
        visible={showServingsPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowServingsPicker(false)}
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
            onPress={() => setShowServingsPicker(false)}
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
              <TouchableOpacity onPress={() => setShowServingsPicker(false)}>
                <Text className="text-base" style={{ color: theme.colors.primary[500] }}>Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Servings</Text>
              <TouchableOpacity onPress={() => setShowServingsPicker(false)}>
                <Text className="text-base font-semibold" style={{ color: theme.colors.primary[500] }}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={servings}
              onValueChange={(value) => setServings(value)}
              style={{ height: 200 }}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <Picker.Item key={num} label={`${num} serving${num > 1 ? 's' : ''}`} value={num} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Cook Time Picker Modal */}
      <Modal
        visible={showCookTimePicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCookTimePicker(false)}
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
            onPress={() => setShowCookTimePicker(false)}
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
              <TouchableOpacity onPress={() => setShowCookTimePicker(false)}>
                <Text className="text-base" style={{ color: theme.colors.primary[500] }}>Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Cook Time</Text>
              <TouchableOpacity onPress={() => setShowCookTimePicker(false)}>
                <Text className="text-base font-semibold" style={{ color: theme.colors.primary[500] }}>Done</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row" style={{ height: 250 }}>
              {/* Hours Picker */}
              <View className="flex-1">
                <Text className="text-center p-3 font-medium text-gray-600">Hours</Text>
                <Picker
                  selectedValue={cookTimeHours}
                  onValueChange={(value) => setCookTimeHours(value)}
                  style={{ height: 180 }}
                >
                  {Array.from({ length: 13 }, (_, i) => i).map((num) => (
                    <Picker.Item key={num} label={`${num}`} value={num} />
                  ))}
                </Picker>
              </View>
              {/* Minutes Picker */}
              <View className="flex-1">
                <Text className="text-center p-3 font-medium text-gray-600">Minutes</Text>
                <Picker
                  selectedValue={cookTimeMinutes}
                  onValueChange={(value) => setCookTimeMinutes(value)}
                  style={{ height: 180 }}
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((num) => (
                    <Picker.Item key={num} label={`${num}`} value={num} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}