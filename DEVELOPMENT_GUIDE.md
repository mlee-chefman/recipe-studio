# CHEF iQ Studio - Development Guide

## Quick Start Commands

### Setup
```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/ChefIQStudio.git
cd ChefIQStudio
npm install

# Start development
npm start

# Platform specific
npm run ios
npx run android
```

### Build Commands
```bash
# EAS builds (for final submission)
eas build --platform ios --profile preview
eas build --platform android --profile preview

## Coding Standards

### File Naming Conventions
- **Components**: PascalCase (`RecipeCard.tsx`)
- **Screens**: PascalCase with Screen suffix (`RecipeListScreen.tsx`)
- **Hooks**: camelCase with `use` prefix (`useRecipeForm.ts`)
- **Helpers**: camelCase (`recipeFormHelpers.ts`)
- **Services**: camelCase with `.service` suffix (`gemini.service.ts`)
- **Stores**: camelCase with Store suffix (`recipeStore.ts`)
- **Constants**: camelCase or UPPER_CASE (`webViewScripts.ts`)
- **Types**: PascalCase (`Recipe.ts`)

### Code Organization Patterns

#### When to Extract Components
Extract inline JSX into components when:
- The same UI pattern is used in multiple places (2+ times)
- The component has complex state or logic
- The component exceeds ~50 lines of JSX
- The component represents a distinct UI concept

**Example:**
```typescript
// ✅ Good: Extracted modal component
<ServingsPickerModal
  visible={showPicker}
  selectedValue={servings}
  onValueChange={setServings}
  onClose={() => setShowPicker(false)}
/>

// ❌ Bad: Inline modal duplicated across screens
<Modal visible={showPicker}>
  <View>{/* 50+ lines of picker UI */}</View>
</Modal>
```

#### When to Extract Custom Hooks
Create custom hooks when:
- State logic is shared across multiple components
- Complex side effects need encapsulation
- Business logic should be separated from UI

**Example:**
```typescript
// ✅ Good: Reusable hook
function useWebViewImport({ onImportSuccess }) {
  const [isImportable, setIsImportable] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleMessage = useCallback((event) => {
    // Recipe detection logic
  }, []);

  const handleImport = useCallback(async (url) => {
    // Import logic
  }, [onImportSuccess]);

  return { isImportable, isImporting, handleMessage, handleImport };
}

// Usage in component
const { isImportable, handleMessage, handleImport } = useWebViewImport({
  onImportSuccess: (recipe) => navigate('RecipeCreator', { recipe })
});
```

#### When to Extract Helper Functions
Create helper functions when:
- Pure logic is duplicated across components
- Complex calculations or transformations are needed
- Validation or formatting logic exists

**Example:**
```typescript
// utils/helpers/recipeFormHelpers.ts
export function addIngredient(
  currentIngredients: string[]
): ValidationResult<string[]> {
  const lastIngredient = currentIngredients[currentIngredients.length - 1];

  if (lastIngredient && lastIngredient.trim() === '') {
    return {
      success: false,
      error: 'Please fill in the current ingredient first.',
    };
  }

  return {
    success: true,
    value: [...currentIngredients, ''],
  };
}

// Usage in component
const result = recipeHelpers.addIngredient(formData.ingredients);
if (result.success) {
  updateFormData({ ingredients: result.value });
} else {
  Alert.alert('Validation Error', result.error);
}
```

#### When to Extract Constants
Move to constants files when:
- Values are used in multiple places
- Large string content (like scripts, templates)
- Configuration objects

**Example:**
```typescript
// constants/webViewScripts.ts
export const RECIPE_DETECTION_SCRIPT = `
  (function() {
    // 100+ lines of JavaScript
  })();
`;

// Usage
<WebView
  injectedJavaScript={RECIPE_DETECTION_SCRIPT}
/>
```

### Component Structure
```typescript
// Standard component template
import React from 'react';
import { View, Text } from 'react-native';

interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-semibold">{prop1}</Text>
    </View>
  );
}
```

### Styling with NativeWind
```typescript
// Use Tailwind utility classes
<View className="flex-1 bg-gray-50 p-4">
  <Text className="text-2xl font-bold text-gray-800 mb-4">
    Recipe Title
  </Text>
  <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg">
    <Text className="text-white font-semibold text-center">
      Create Recipe
    </Text>
  </TouchableOpacity>
</View>
```

## Key Components to Build

### 1. Recipe Builder Components
```typescript
// RecipeForm.tsx - Main form wrapper
// BasicInfoForm.tsx - Title, description, metadata
// IngredientManager.tsx - Add/edit/reorder ingredients
// SectionBuilder.tsx - Create recipe sections
// StepBuilder.tsx - Individual step creation
// PhotoUploader.tsx - Image capture and upload
// RecipePreview.tsx - Preview before publishing
```

### 2. Recipe Display Components
```typescript
// RecipeCard.tsx - List item for recipes
// RecipeDetail.tsx - Full recipe view
// SectionView.tsx - Recipe section display
// StepView.tsx - Individual step display
// IngredientList.tsx - Ingredients display
// ApplianceIndicator.tsx - Show required appliances
```

### 3. Common UI Components
```typescript
// Button.tsx - Standardized buttons
// Input.tsx - Form inputs with validation
// Card.tsx - Container component
// LoadingSpinner.tsx - Loading states
// ErrorMessage.tsx - Error displays
// Modal.tsx - Modal wrapper
```

## State Management Patterns

### Zustand Store Usage
```typescript
// In components
import { useRecipeStore } from '@/stores/recipeStore';

function RecipeBuilder() {
  const { 
    currentRecipe, 
    setCurrentRecipe, 
    saveDraft 
  } = useRecipeStore();
  
  // Use state and actions
}
```

### Form Management with React Hook Form
```typescript
import { useForm, Controller } from 'react-hook-form';

interface RecipeFormData {
  title: string;
  description: string;
  cookTime: number;
}

function RecipeForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<RecipeFormData>();
  
  const onSubmit = (data: RecipeFormData) => {
    // Handle form submission
  };
}
```

## Firebase Integration Patterns

### Recipe CRUD Operations
```typescript
// services/recipeService.ts
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export const recipeService = {
  async create(recipe: Recipe): Promise<string> {
    const docRef = doc(collection(db, 'recipes'));
    await setDoc(docRef, recipe);
    return docRef.id;
  },
  
  async get(id: string): Promise<Recipe | null> {
    const docRef = doc(db, 'recipes', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as Recipe : null;
  },
  
  async update(id: string, updates: Partial<Recipe>): Promise<void> {
    const docRef = doc(db, 'recipes', id);
    await updateDoc(docRef, updates);
  },
  
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'recipes', id);
    await deleteDoc(docRef);
  }
};
```

### Photo Upload Service
```typescript
// services/imageService.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const imageService = {
  async uploadRecipePhoto(recipeId: string, imageUri: string): Promise<string> {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `recipes/${recipeId}/hero-image.jpg`);
    await uploadBytes(storageRef, blob);
    
    return await getDownloadURL(storageRef);
  },
  
  async uploadStepPhoto(recipeId: string, stepId: string, imageUri: string): Promise<string> {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `recipes/${recipeId}/steps/${stepId}.jpg`);
    await uploadBytes(storageRef, blob);
    
    return await getDownloadURL(storageRef);
  }
};
```

## Navigation Patterns

### Screen Navigation
```typescript
import { useRouter } from 'expo-router';

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/recipe/${recipe.id}`);
  };
  
  return (
    <TouchableOpacity onPress={handlePress}>
      {/* Recipe card content */}
    </TouchableOpacity>
  );
}
```

### Modal Navigation
```typescript
import { useRouter } from 'expo-router';

function CreateButton() {
  const router = useRouter();
  
  const openCamera = () => {
    router.push('/modals/camera');
  };
}
```

## Error Handling Patterns

### Async Operations
```typescript
import { useState } from 'react';

function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { execute, loading, error };
}
```

### Form Validation
```typescript
import { z } from 'zod';

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  cookTime: z.number().min(1, 'Cook time must be at least 1 minute'),
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Ingredient name required'),
    amount: z.string().min(1, 'Amount required')
  })).min(1, 'At least one ingredient required')
});

export const validateRecipe = (recipe: Partial<Recipe>) => {
  return recipeSchema.safeParse(recipe);
};
```

## Testing Patterns

### Component Testing
```typescript
// __tests__/RecipeCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecipeCard from '@/components/recipe/RecipeCard';

describe('RecipeCard', () => {
  const mockRecipe = {
    id: '1',
    title: 'Test Recipe',
    description: 'Test Description'
  };

  it('displays recipe title', () => {
    const { getByText } = render(<RecipeCard recipe={mockRecipe} />);
    expect(getByText('Test Recipe')).toBeTruthy();
  });
});
```

## Performance Optimization

### Image Optimization
```typescript
import { Image } from 'expo-image';

// Use expo-image for better performance
<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  transition={200}
/>
```

### List Optimization
```typescript
import { FlashList } from '@shopify/flash-list';

// Use FlashList for better performance with large lists
<FlashList
  data={recipes}
  renderItem={({ item }) => <RecipeCard recipe={item} />}
  estimatedItemSize={120}
/>
```

## Git Workflow

### Branch Strategy
```bash
# Main branches
main          # Production ready code
develop       # Integration branch

# Feature branches
feature/recipe-builder
feature/photo-upload
feature/appliance-integration

# Hotfix branches
hotfix/critical-bug-fix
```

### Commit Messages
```bash
# Format: type(scope): description
feat(recipe): add recipe creation form
fix(upload): resolve photo upload validation
ui(card): improve recipe card styling
docs(readme): update setup instructions
test(recipe): add recipe validation tests
```

## Common Debugging Tips

### Expo/React Native
```bash
# Clear cache
npx expo start --clear

# Reset Metro bundler
npx expo start --reset-cache

# Check logs
npx expo logs
```

### Firebase Debugging
```typescript
// Enable Firestore debug logging
import { connectFirestoreEmulator, enableNetwork } from 'firebase/firestore';

// In development, use emulator
if (__DEV__) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## Deployment Checklist

### Pre-deployment
- [ ] All TypeScript errors resolved
- [ ] Firebase security rules updated
- [ ] Environment variables configured
- [ ] App icons and splash screen updated
- [ ] App.json configuration complete

### EAS Build
- [ ] EAS CLI installed and authenticated
- [ ] eas.json configured
- [ ] Build profiles setup for preview/production
- [ ] TestFlight/Google Play Console access ready