import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRecipeStore, Recipe } from '../store/store';
import { useNavigation } from '@react-navigation/native';
import { scrapeRecipe, isValidUrl } from '../utils/recipeScraper';
import { CookingAction, InstructionSection, getApplianceById } from '../types/chefiq';
import ChefIQCookingSelector from '../components/ChefIQCookingSelector';
import { ApplianceDropdown } from '../components/ApplianceDropdown';

interface RecipeCreatorScreenProps {
  editingRecipe?: Recipe;
  onEditComplete?: () => void;
}

export default function RecipeCreatorScreen({ editingRecipe, onEditComplete }: RecipeCreatorScreenProps = {}) {
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [imageUrl, setImageUrl] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState('');
  const [cookingActions, setCookingActions] = useState<CookingAction[]>([]);
  const [instructionSections, setInstructionSections] = useState<InstructionSection[]>([]);
  const [showCookingSelector, setShowCookingSelector] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [useProbe, setUseProbe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const { addRecipe, updateRecipe } = useRecipeStore();
  const navigation = useNavigation();

  // Validation helper function
  const validateField = (fieldName: string, value: string, isRequired: boolean = false) => {
    const newErrors = { ...validationErrors };

    if (isRequired && !value.trim()) {
      newErrors[fieldName] = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    } else {
      delete newErrors[fieldName];
    }

    setValidationErrors(newErrors);
    return !newErrors[fieldName];
  };

  // Clear validation error for a field
  const clearValidationError = (fieldName: string) => {
    const newErrors = { ...validationErrors };
    delete newErrors[fieldName];
    setValidationErrors(newErrors);
  };

  // Populate form when editing a recipe
  useEffect(() => {
    if (editingRecipe) {
      setRecipeName(editingRecipe.title);
      setDescription(editingRecipe.description);
      setIngredients(editingRecipe.ingredients.length > 0 ? editingRecipe.ingredients : ['']);
      setInstructions(editingRecipe.instructions.length > 0 ? editingRecipe.instructions : ['']);
      setCookTime(editingRecipe.cookTime.toString());
      setServings(editingRecipe.servings.toString());
      setCategory(editingRecipe.category);
      setDifficulty(editingRecipe.difficulty);
      setImageUrl(editingRecipe.image || '');
      setSelectedAppliance(editingRecipe.chefiqAppliance || '');
      setCookingActions(editingRecipe.cookingActions || []);
      setInstructionSections(editingRecipe.instructionSections || []);
      setUseProbe(editingRecipe.useProbe || false);
    }
  }, [editingRecipe]);

  // Helper function to clear all form data
  const clearAllFormData = () => {
    setRecipeName('');
    setDescription('');
    setIngredients(['']);
    setInstructions(['']);
    setPrepTime('');
    setCookTime('');
    setServings('');
    setCategory('');
    setImageUrl('');
    setDifficulty('Medium');
    setSelectedAppliance('');
    setCookingActions([]);
    setInstructionSections([]);
    setUseProbe(false);
    setImportUrl('');
    setShowImportSection(false);
    setValidationErrors({}); // Clear all validation errors
  };

  // Handle clear button with confirmation
  const handleClearForm = () => {
    // Check if form has any data
    const hasData = recipeName.trim() ||
                   description.trim() ||
                   ingredients.some(i => i.trim()) ||
                   instructions.some(i => i.trim()) ||
                   prepTime.trim() ||
                   cookTime.trim() ||
                   servings.trim() ||
                   category.trim() ||
                   imageUrl.trim() ||
                   selectedAppliance ||
                   cookingActions.length > 0;

    if (!hasData) {
      // Form is already empty
      Alert.alert('Form is Empty', 'The recipe form is already clear.');
      return;
    }

    // Confirm before clearing
    Alert.alert(
      'Clear Recipe Form',
      'Are you sure you want to clear all recipe data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllFormData();
            Alert.alert('Form Cleared', 'Recipe form has been cleared. You can start fresh!');
          }
        }
      ]
    );
  };

  // Helper function to automatically assign cooking actions to appropriate steps
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
                score += 3; // Strong match
              }
            });
          }
        });

        // Prefer steps that mention time or temperature
        if (instructionLower.includes('minute') || instructionLower.includes('hour')) {
          score += 2;
        }
        if (instructionLower.includes('temperature') || instructionLower.includes('degrees') || instructionLower.includes('°f')) {
          score += 2;
        }

        // Prefer steps that mention cooking actions
        if (instructionLower.includes('cook') || instructionLower.includes('heat')) {
          score += 1;
        }

        // Avoid early prep steps
        if (instructionLower.includes('chop') || instructionLower.includes('dice') ||
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select images.');
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
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to take photos.');
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

  const enterImageUrl = () => {
    Alert.prompt(
      'Enter Image URL',
      'Paste the URL of an image from the web',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (url) => {
            if (url && url.trim()) {
              setImageUrl(url.trim());
            }
          }
        }
      ],
      'plain-text',
      imageUrl
    );
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Enter URL', onPress: enterImageUrl },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const addIngredient = () => {
    // Only add new ingredient if the last one has content
    const lastIngredient = ingredients[ingredients.length - 1];
    if (lastIngredient && lastIngredient.trim() === '') {
      Alert.alert('Validation Error', 'Please fill in the current ingredient before adding a new one.');
      return;
    }
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients.length > 0 ? newIngredients : ['']);
  };

  const addInstruction = () => {
    // Only add new instruction if the last one has content
    const lastInstruction = instructions[instructions.length - 1];
    if (lastInstruction && lastInstruction.trim() === '') {
      Alert.alert('Validation Error', 'Please fill in the current instruction before adding a new one.');
      return;
    }
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const removeInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    setInstructions(newInstructions.length > 0 ? newInstructions : ['']);
  };

  const handleCookingActionSelect = (action: CookingAction) => {
    if (currentStepIndex !== null) {
      // Add action to specific step
      const newActions = [...cookingActions];
      const existingActionIndex = newActions.findIndex(
        a => a.stepIndex === currentStepIndex
      );

      if (existingActionIndex >= 0) {
        newActions[existingActionIndex] = { ...action, stepIndex: currentStepIndex };
      } else {
        newActions.push({ ...action, stepIndex: currentStepIndex });
      }

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
      setRecipeName(scrapedRecipe.title);
      setDescription(scrapedRecipe.description);
      setIngredients(scrapedRecipe.ingredients.length > 0 ? scrapedRecipe.ingredients : ['']);
      setInstructions(scrapedRecipe.instructions.length > 0 ? scrapedRecipe.instructions : ['']);
      setCookTime(scrapedRecipe.cookTime.toString());
      setPrepTime(scrapedRecipe.prepTime.toString());
      setServings(scrapedRecipe.servings.toString());
      setCategory(scrapedRecipe.category || '');
      setImageUrl(scrapedRecipe.image || '');

      // Estimate difficulty based on cook time and number of steps
      const totalTime = scrapedRecipe.cookTime + scrapedRecipe.prepTime;
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

        let autoAssignedActions: CookingAction[] = [];
        if (suggestions.suggestedActions.length > 0) {
          try {
            // Automatically assign cooking actions to appropriate steps
            autoAssignedActions = autoAssignCookingActions(
              scrapedRecipe.instructions,
              suggestions.suggestedActions
            );
            setCookingActions(autoAssignedActions);
          } catch (error) {
            console.error('Error in auto-assigning cooking actions:', error);
            // Fallback: just use the suggested actions without step assignment
            setCookingActions(suggestions.suggestedActions);
            autoAssignedActions = suggestions.suggestedActions;
          }
        }

        // Show suggestion summary to user
        const applianceName = getApplianceById(suggestions.suggestedAppliance || '')?.name;
        const methodNames = autoAssignedActions.map(action => action.methodName).join(', ');
        const assignedSteps = autoAssignedActions.map(action =>
          action.stepIndex !== undefined
            ? `Step ${(action.stepIndex || 0) + 1}: ${action.methodName}`
            : action.methodName
        ).join('\n');

        Alert.alert(
          '🍳 ChefIQ Auto-Configuration Complete!',
          `Recipe imported and automatically configured:\n\n` +
          `• Appliance: ${applianceName || 'Not specified'}\n` +
          `• Auto-assigned methods:\n${assignedSteps}\n` +
          `${suggestions.useProbe ? '• Thermometer probe enabled\n' : ''}` +
          `\nConfidence: ${Math.round(suggestions.confidence * 100)}%\n\n` +
          `✅ Cooking actions have been automatically assigned to the most suitable recipe steps. ` +
          `Please review and adjust before saving.`,
          [
            {
              text: 'Review & Edit',
              onPress: () => {
                setShowImportSection(false);
                setImportUrl('');
              }
            }
          ]
        );
      } else {
        // Show regular success message if no good suggestions or analysis failed
        Alert.alert(
          'Recipe Imported Successfully!',
          'Recipe imported from website. You can now review and edit the details before saving.' +
          (suggestions && suggestions.confidence > 0 ? '\n\nNote: ChefIQ suggestions were found but had low confidence. You can manually configure appliance settings if desired.' : ''),
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
      }

    } catch (error) {
      Alert.alert('Import Failed', 'Could not import recipe from this URL. Please try a different URL or enter the recipe manually.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = () => {
    const filteredIngredients = ingredients.filter(i => i.trim() !== '');
    const filteredInstructions = instructions.filter(i => i.trim() !== '');

    // Validate all required fields
    const nameValid = validateField('recipeName', recipeName, true);
    const categoryValid = validateField('category', category, true);

    // Check ingredients and instructions
    let hasValidationErrors = false;

    if (filteredIngredients.length === 0) {
      setValidationErrors(prev => ({ ...prev, ingredients: 'At least one ingredient is required' }));
      hasValidationErrors = true;
    } else {
      clearValidationError('ingredients');
    }

    if (filteredInstructions.length === 0) {
      setValidationErrors(prev => ({ ...prev, instructions: 'At least one instruction is required' }));
      hasValidationErrors = true;
    } else {
      clearValidationError('instructions');
    }

    // Validate numeric fields
    if (cookTime && (isNaN(parseInt(cookTime)) || parseInt(cookTime) <= 0)) {
      setValidationErrors(prev => ({ ...prev, cookTime: 'Cook time must be a positive number' }));
      hasValidationErrors = true;
    } else {
      clearValidationError('cookTime');
    }

    if (servings && (isNaN(parseInt(servings)) || parseInt(servings) <= 0)) {
      setValidationErrors(prev => ({ ...prev, servings: 'Servings must be a positive number' }));
      hasValidationErrors = true;
    } else {
      clearValidationError('servings');
    }

    if (!nameValid || !categoryValid || hasValidationErrors) {
      Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
      return;
    }

    const recipe = {
      title: recipeName,
      description: description || 'No description provided',
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
      cookTime: parseInt(cookTime) || 30,
      servings: parseInt(servings) || 4,
      difficulty,
      category: category.trim(),
      image: imageUrl.trim() || undefined,
      chefiqAppliance: selectedAppliance || undefined,
      cookingActions: cookingActions.length > 0 ? cookingActions : undefined,
      instructionSections: instructionSections.length > 0 ? instructionSections : undefined,
      useProbe: selectedAppliance && getApplianceById(selectedAppliance)?.thing_category_name === 'oven' ? useProbe : undefined,
    };

    if (editingRecipe) {
      // Update existing recipe
      updateRecipe(editingRecipe.id, recipe);

      Alert.alert(
        'Success',
        'Recipe updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onEditComplete) {
                onEditComplete();
              } else {
                // Navigate to recipes tab
                navigation.navigate('One' as never);
              }
            }
          }
        ]
      );
    } else {
      // Create new recipe
      addRecipe(recipe);

      Alert.alert(
        'Success',
        'Recipe created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form using the clear function
              clearAllFormData();

              // Navigate to recipes tab
              navigation.navigate('One' as never);
            }
          }
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 bg-white">
        <View className="px-4 py-4">
            {/* Header */}
            <View className="mb-6">
              <Text className="text-2xl font-bold mb-3">{editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleClearForm}
                  className="bg-red-500 rounded-lg px-4 py-2 flex-1"
                >
                  <Text className="text-white font-semibold text-sm text-center">🗑️ Clear Form</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowImportSection(!showImportSection)}
                  className="bg-blue-500 rounded-lg px-4 py-2 flex-1"
                >
                  <Text className="text-white font-semibold text-sm text-center">📥 Import from URL</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recipe Image Display */}
            <View className="mb-6">
              {imageUrl ? (
                <View className="relative">
                  <TouchableOpacity
                    onPress={showImagePicker}
                    activeOpacity={0.8}
                    className="relative"
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: '100%', height: 200, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    {/* Subtle overlay hint */}
                    <View className="absolute inset-0 bg-black/0 rounded-lg justify-center items-center">
                      <View className="bg-black/50 rounded-full px-3 py-1 opacity-0">
                        <Text className="text-white text-xs font-medium">Tap to change</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Remove button - positioned absolutely in top-right */}
                  <TouchableOpacity
                    onPress={() => setImageUrl('')}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full items-center justify-center shadow-lg"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                    }}
                  >
                    <Text className="text-white font-bold text-lg leading-none">×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={showImagePicker}
                  className="border-2 border-dashed border-gray-300 rounded-lg h-48 justify-center items-center bg-gray-50 active:bg-gray-100"
                  activeOpacity={0.7}
                >
                  <Text className="text-6xl text-gray-400 mb-2">📷</Text>
                  <Text className="text-lg font-semibold text-gray-600">Add Recipe Photo</Text>
                  <Text className="text-sm text-gray-500 text-center px-4">Take a photo or choose from library</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Import from URL Section */}
            {showImportSection && (
              <View className="mb-6 p-4 bg-blue-50 rounded-lg">
                <Text className="text-lg font-semibold mb-2">Import Recipe from Website</Text>
                <Text className="text-sm text-gray-600 mb-3">
                  Enter a URL from popular recipe sites like AllRecipes, Food Network, Serious Eats, etc.
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
                    className={`rounded-lg px-4 py-2 justify-center ${
                      isImporting ? 'bg-gray-400' : 'bg-green-600'
                    }`}
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

            {/* Recipe Name */}
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">Recipe Name *</Text>
              <TextInput
                className={`border rounded-lg px-3 py-2 text-base ${
                  validationErrors.recipeName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter recipe name"
                value={recipeName}
                onChangeText={(text) => {
                  setRecipeName(text);
                  if (validationErrors.recipeName && text.trim()) {
                    clearValidationError('recipeName');
                  }
                }}
              />
              {validationErrors.recipeName && (
                <Text className="text-red-500 text-sm mt-1">{validationErrors.recipeName}</Text>
              )}
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">Description</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                placeholder="Brief description of your recipe"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>


            {/* Category and Difficulty */}
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">Category *</Text>
              <TextInput
                className={`border rounded-lg px-3 py-2 text-base ${
                  validationErrors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Italian, Asian, Dessert"
                value={category}
                onChangeText={(text) => {
                  setCategory(text);
                  if (validationErrors.category && text.trim()) {
                    clearValidationError('category');
                  }
                }}
              />
              {validationErrors.category && (
                <Text className="text-red-500 text-sm mt-1">{validationErrors.category}</Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">Difficulty *</Text>
              <View className="flex-row justify-between">
                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setDifficulty(level)}
                    className={`flex-1 mx-1 rounded-lg px-3 py-2 border ${
                      difficulty === level
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        difficulty === level ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ChefIQ Appliance Selection */}
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">ChefIQ Appliance (Optional)</Text>
              <ApplianceDropdown
                selectedAppliance={selectedAppliance}
                onSelect={(applianceId) => {
                  setSelectedAppliance(applianceId);
                  // Reset probe setting when changing appliances
                  setUseProbe(false);
                }}
                placeholder="Select ChefIQ Appliance..."
              />

              {/* Thermometer Probe Toggle for iQ MiniOven */}
              {selectedAppliance && getApplianceById(selectedAppliance)?.thing_category_name === 'oven' && (
                <View className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-orange-800">🌡️ Use Thermometer Probe</Text>
                      <Text className="text-sm text-orange-600 mt-1">
                        Cook to target temperature instead of time
                      </Text>
                    </View>
                    <Switch
                      value={useProbe}
                      onValueChange={setUseProbe}
                      trackColor={{ false: '#f3f4f6', true: '#fed7aa' }}
                      thumbColor={useProbe ? '#ea580c' : '#9ca3af'}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Recipe Details */}
            <View className="mb-4">
              <View className="flex-row justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-base font-semibold mb-1">Prep Time</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                    placeholder="e.g., 15"
                    value={prepTime}
                    onChangeText={setPrepTime}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1 mx-2">
                  <Text className="text-base font-semibold mb-1">Cook Time (min)</Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 text-base ${
                      validationErrors.cookTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 30"
                    value={cookTime}
                    onChangeText={(text) => {
                      setCookTime(text);
                      if (validationErrors.cookTime && text) {
                        clearValidationError('cookTime');
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-base font-semibold mb-1">Servings</Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 text-base ${
                      validationErrors.servings ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 4"
                    value={servings}
                    onChangeText={(text) => {
                      setServings(text);
                      if (validationErrors.servings && text) {
                        clearValidationError('servings');
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              {/* Validation error messages for cook time and servings */}
              {(validationErrors.cookTime || validationErrors.servings) && (
                <View className="flex-row justify-between mt-1">
                  <View className="flex-1 mr-2">
                    {/* Prep time has no validation, so empty space */}
                  </View>
                  <View className="flex-1 mx-2">
                    {validationErrors.cookTime && (
                      <Text className="text-red-500 text-xs">{validationErrors.cookTime}</Text>
                    )}
                  </View>
                  <View className="flex-1 ml-2">
                    {validationErrors.servings && (
                      <Text className="text-red-500 text-xs">{validationErrors.servings}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Ingredients */}
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">Ingredients *</Text>
              {ingredients.map((ingredient, index) => (
                <View key={index} className="flex-row mb-2">
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base mr-2"
                    placeholder={`Ingredient ${index + 1}`}
                    value={ingredient}
                    onChangeText={(value) => updateIngredient(index, value)}
                  />
                  {ingredients.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeIngredient(index)}
                      className="bg-red-500 rounded-lg px-3 py-2 justify-center"
                    >
                      <Text className="text-white font-semibold">Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={addIngredient}
                className="bg-blue-500 rounded-lg px-4 py-2 mt-2"
              >
                <Text className="text-white text-center font-semibold">Add Ingredient</Text>
              </TouchableOpacity>
              {validationErrors.ingredients && (
                <Text className="text-red-500 text-sm mt-2">{validationErrors.ingredients}</Text>
              )}
            </View>

            {/* Instructions */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2">Instructions *</Text>
              {instructions.map((instruction, index) => {
                const cookingAction = getCookingActionForStep(index);
                return (
                  <View key={index} className="mb-4">
                    <View className="flex-row items-start">
                      <Text className="text-base font-semibold mr-2 mt-2">{index + 1}.</Text>
                      <TextInput
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base mr-2"
                        placeholder={`Step ${index + 1}`}
                        value={instruction}
                        onChangeText={(value) => updateInstruction(index, value)}
                        multiline
                        numberOfLines={2}
                      />
                      {instructions.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeInstruction(index)}
                          className="bg-red-500 rounded-lg px-3 py-2 justify-center"
                        >
                          <Text className="text-white font-semibold">Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Cooking Action for this step */}
                    {selectedAppliance && (
                      <View className="ml-6 mt-2">
                        {cookingAction ? (
                          <View className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <View className="flex-row justify-between items-start">
                              <View className="flex-1 mr-3">
                                <Text className="text-sm font-medium text-green-800 mb-1">
                                  🍳 {cookingAction.methodName}
                                </Text>
                                <View className="flex-row flex-wrap">
                                  {Object.entries(cookingAction.parameters)
                                    .slice(0, 3) // Limit to first 3 parameters
                                    .map(([key, value], paramIndex) => (
                                      <View key={key} className="bg-green-100 rounded px-2 py-1 mr-1 mb-1">
                                        <Text className="text-xs text-green-700">
                                          {key}: {String(value).length > 10 ? String(value).substring(0, 10) + '...' : value}
                                        </Text>
                                      </View>
                                    ))}
                                  {Object.keys(cookingAction.parameters).length > 3 && (
                                    <View className="bg-green-100 rounded px-2 py-1 mb-1">
                                      <Text className="text-xs text-green-700">+{Object.keys(cookingAction.parameters).length - 3} more</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                              <TouchableOpacity
                                onPress={() => removeCookingAction(index)}
                                className="bg-red-500 rounded px-2 py-1 self-start"
                              >
                                <Text className="text-white text-xs">Remove</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              setCurrentStepIndex(index);
                              setShowCookingSelector(true);
                            }}
                            className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex-row items-center justify-center"
                          >
                            <Text className="text-blue-700 text-sm font-medium">🍳 Add Cooking Action</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
              <TouchableOpacity
                onPress={addInstruction}
                className="bg-blue-500 rounded-lg px-4 py-2 mt-2"
              >
                <Text className="text-white text-center font-semibold">Add Step</Text>
              </TouchableOpacity>
              {validationErrors.instructions && (
                <Text className="text-red-500 text-sm mt-2">{validationErrors.instructions}</Text>
              )}
            </View>

            {/* ChefIQ Cooking Selector Modal */}
            {showCookingSelector && selectedAppliance && (
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

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              className={`rounded-lg px-6 py-3 mb-8 ${
                !recipeName || !category || ingredients.filter(i => i.trim()).length === 0 || instructions.filter(i => i.trim()).length === 0
                  ? 'bg-gray-400'
                  : 'bg-green-600'
              }`}
              disabled={!recipeName || !category || ingredients.filter(i => i.trim()).length === 0 || instructions.filter(i => i.trim()).length === 0}
            >
              <Text className="text-white text-center text-lg font-bold">{editingRecipe ? 'Update Recipe' : 'Create Recipe'}</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}