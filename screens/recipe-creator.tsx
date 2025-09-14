import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRecipeStore } from '../store/store';
import { useNavigation } from '@react-navigation/native';

export default function RecipeCreatorScreen() {
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const { addRecipe } = useRecipeStore();
  const navigation = useNavigation();

  const addIngredient = () => {
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

  const handleSubmit = () => {
    const filteredIngredients = ingredients.filter(i => i.trim() !== '');
    const filteredInstructions = instructions.filter(i => i.trim() !== '');

    if (!recipeName.trim()) {
      Alert.alert('Error', 'Recipe name is required');
      return;
    }

    if (filteredIngredients.length === 0) {
      Alert.alert('Error', 'At least one ingredient is required');
      return;
    }

    if (filteredInstructions.length === 0) {
      Alert.alert('Error', 'At least one instruction is required');
      return;
    }

    if (!category.trim()) {
      Alert.alert('Error', 'Category is required');
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
    };

    addRecipe(recipe);

    Alert.alert(
      'Success',
      'Recipe created successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setRecipeName('');
            setDescription('');
            setIngredients(['']);
            setInstructions(['']);
            setPrepTime('');
            setCookTime('');
            setServings('');
            setCategory('');
            setDifficulty('Medium');

            // Navigate to recipes tab
            navigation.navigate('One' as never);
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 bg-white">
        <View className="px-4 py-4">
            <Text className="text-2xl font-bold mb-6">Create New Recipe</Text>

            {/* Recipe Name */}
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">Recipe Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                placeholder="Enter recipe name"
                value={recipeName}
                onChangeText={setRecipeName}
              />
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
                className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                placeholder="e.g., Italian, Asian, Dessert"
                value={category}
                onChangeText={setCategory}
              />
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

            {/* Recipe Details */}
            <View className="mb-4 flex-row justify-between">
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                  placeholder="e.g., 30"
                  value={cookTime}
                  onChangeText={setCookTime}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-base font-semibold mb-1">Servings</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                  placeholder="e.g., 4"
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="numeric"
                />
              </View>
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
            </View>

            {/* Instructions */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2">Instructions *</Text>
              {instructions.map((instruction, index) => (
                <View key={index} className="mb-2">
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
                </View>
              ))}
              <TouchableOpacity
                onPress={addInstruction}
                className="bg-blue-500 rounded-lg px-4 py-2 mt-2"
              >
                <Text className="text-white text-center font-semibold">Add Step</Text>
              </TouchableOpacity>
            </View>

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
              <Text className="text-white text-center text-lg font-bold">Create Recipe</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}