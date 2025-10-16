# CHEF iQ Studio - Technical Architecture

## Tech Stack

### Frontend
- **React Native** with **Expo** (managed workflow)
- **TypeScript** for type safety
- **NativeWind** (Tailwind CSS) for styling
- **Expo Router** for file-based navigation (tabs + stack)

### Backend
- **Firebase Firestore** for recipe database
- **Firebase Storage** for photo uploads
- **No authentication** (guest mode for MVP)

### State Management
- **Zustand** for global state
- **React Hook Form** for form management
- **AsyncStorage** for local persistence

### Key Dependencies
```json
{
  "@react-navigation/native": "^6.1.0",
  "expo-camera": "~14.0.0",
  "expo-image-picker": "~14.7.0",
  "expo-file-system": "~16.0.0",
  "firebase": "^10.7.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.47.0",
  "react-native-uuid": "^2.0.0"
}
```

## Project Structure
```
recipe-studio/
├── components/
│   ├── modals/              # Reusable modal components
│   │   ├── ServingsPickerModal.tsx
│   │   ├── CookTimePickerModal.tsx
│   │   ├── CategoryPickerModal.tsx
│   │   ├── TagsPickerModal.tsx
│   │   ├── ConfirmationModal.tsx
│   │   └── index.ts         # Barrel exports
│   ├── DraggableList.tsx
│   ├── RecipeList.tsx
│   ├── ApplianceDropdown.tsx
│   └── ...                  # Other UI components
│
├── screens/                 # Screen components
│   ├── recipeCreator.tsx    # Recipe creation screen
│   ├── recipeEdit.tsx       # Recipe editing screen
│   ├── RecipeWebImport.tsx  # Web recipe import
│   └── ...                  # Other screens
│
├── hooks/                   # Custom React hooks
│   ├── useRecipeForm.ts     # Form state management
│   ├── useImagePicker.ts    # Image selection logic
│   ├── useAIRecipeGenerator.ts  # AI recipe generation
│   ├── useCookingActions.ts # Cooking action management
│   ├── useWebViewImport.ts  # WebView recipe detection
│   ├── useOCRImport.ts      # OCR import logic
│   ├── usePDFImport.ts      # PDF import logic
│   └── useTextImport.ts     # Text import logic
│
├── services/                # External API services
│   ├── gemini.service.ts    # Google Gemini AI integration
│   └── googleVision.service.ts  # Google Vision OCR
│
├── utils/
│   └── helpers/             # Pure utility functions
│       ├── recipeFormHelpers.ts    # Ingredient/instruction helpers
│       ├── recipeParser.ts         # Recipe text parsing
│       ├── recipeConversion.ts     # Recipe format conversion
│       └── urlHelpers.ts           # URL validation/formatting
│
├── constants/               # App constants and configs
│   ├── recipeDefaults.ts    # Default recipe options
│   ├── importMessages.ts    # Import UI messages
│   └── webViewScripts.ts    # WebView injected scripts
│
├── store/                   # Zustand state management
│   └── store.ts             # Recipe store
│
├── types/                   # TypeScript type definitions
│   └── chefiq.ts            # ChefIQ type definitions
│
└── theme.ts                 # App theme configuration
```

## Code Architecture & Refactoring

### Design Principles
The codebase follows these key architectural principles:

1. **Separation of Concerns**: UI components, business logic, and data access are cleanly separated
2. **DRY (Don't Repeat Yourself)**: Shared logic is extracted into reusable hooks and helpers
3. **Single Responsibility**: Each module has a clear, focused purpose
4. **Composition**: Complex functionality is built from smaller, composable pieces

### Recent Refactoring (2024)

The codebase underwent significant refactoring to improve maintainability and reduce code duplication:

#### Modal Components Extraction
**Files Created:**
- `components/modals/ServingsPickerModal.tsx`
- `components/modals/CookTimePickerModal.tsx`
- `components/modals/CategoryPickerModal.tsx`
- `components/modals/TagsPickerModal.tsx`
- `components/modals/ConfirmationModal.tsx`
- `components/modals/index.ts` (barrel exports)

**Impact:**
- Removed ~300 lines of duplicate modal code from `recipeCreator.tsx`
- Removed ~270 lines of duplicate modal code from `recipeEdit.tsx`
- Created 5 reusable modal components

#### Custom Hooks Extraction

**`hooks/useCookingActions.ts`**
- Manages cooking action state and handlers
- Used by both `recipeCreator.tsx` and `recipeEdit.tsx`
- Encapsulates: action selection, editing, and retrieval logic

**`hooks/useWebViewImport.ts`**
- Handles recipe detection from web pages
- Manages import state and error handling
- Used by `RecipeWebImport.tsx`

**Impact:**
- Removed ~70 lines of duplicate code from recipe screens
- Better testability and reusability

#### Helper Functions Extraction

**`utils/helpers/recipeFormHelpers.ts`**
- Pure functions for ingredient/instruction management
- Validation logic with typed results
- Functions: `addIngredient`, `removeIngredient`, `updateIngredient`, etc.

**`utils/helpers/urlHelpers.ts`**
- URL validation and formatting utilities
- Functions: `isExcludedUrl`, `formatUrl`, `isValidUrl`, `formatAndValidateUrl`

**Impact:**
- Removed ~80 lines of duplicate helper code
- Easier to unit test
- Consistent behavior across screens

#### Constants Extraction

**`constants/webViewScripts.ts`**
- Injected JavaScript for recipe detection
- Extracted ~105 lines of script code from `RecipeWebImport.tsx`

**Impact:**
- Cleaner screen components
- Easier to maintain and test scripts
- Potential for reuse in other screens

### File Size Reductions
| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `recipeCreator.tsx` | ~1,316 lines | ~994 lines | -24% |
| `recipeEdit.tsx` | ~995 lines | ~725 lines | -27% |
| `RecipeWebImport.tsx` | ~517 lines | ~330 lines | -36% |

**Total Lines Removed:** ~779 lines of duplicate/inline code
**Total Lines Added (reusable):** ~473 lines in hooks, helpers, and constants

### Benefits Achieved
1. **Reduced Duplication**: Shared logic centralized in one place
2. **Improved Testability**: Pure functions and isolated hooks are easier to test
3. **Better Maintainability**: Changes to shared logic automatically affect all consumers
4. **Cleaner Components**: Screen components focus on UI and composition
5. **Consistent Behavior**: All screens use identical logic for shared functionality

## Data Models

### Recipe Schema
```typescript
interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  sections: RecipeSection[];
  metadata: RecipeMetadata;
  photos: PhotoUrls;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

interface RecipeSection {
  id: string;
  title: string;
  description?: string;
  steps: Step[];
  estimatedTime?: number;
  applianceRequired?: string;
  order: number;
}

interface Step {
  id: string;
  instruction: string;
  photoUrl?: string;
  appliance?: ApplianceAction;
  estimatedTime?: number;
  order: number;
  temperature?: number;
  notes?: string;
}

interface ApplianceAction {
  appliance: 'MiniOven' | 'SmartThermometer' | 'PressureCooker' | 'AirFryer';
  action: 'start' | 'stop' | 'setTemp' | 'setTime' | 'monitor';
  parameters?: {
    temperature?: number;
    time?: number;
    mode?: string;
  };
}
```

## Navigation Architecture
```
Root Stack Navigator
├── Tab Navigator (Main App)
│   ├── Tab: My Recipes (index.tsx)
│   ├── Tab: Create (create.tsx)
│   └── Tab: Published (published.tsx)
├── Recipe Stack
│   ├── recipe/[id].tsx (Recipe Detail)
│   ├── recipe/edit/[id].tsx (Edit Recipe)
│   └── recipe/preview/[id].tsx (Preview)
└── Modal Stack
    ├── modals/camera.tsx
    └── modals/settings.tsx
```

## State Management Strategy

### Zustand Stores
```typescript
// Main recipe store
interface RecipeStore {
  currentRecipe: Recipe | null;
  recipes: Recipe[];
  drafts: Recipe[];
  
  setCurrentRecipe: (recipe: Recipe) => void;
  saveRecipe: (recipe: Recipe) => void;
  saveDraft: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
}

// UI state store
interface UIStore {
  isLoading: boolean;
  uploadProgress: number;
  activeSection: string | null;
  
  setLoading: (loading: boolean) => void;
  setUploadProgress: (progress: number) => void;
}
```

## Firebase Configuration

### Firestore Collections
```
recipes/
├── {recipeId}/
│   ├── title: string
│   ├── description: string
│   ├── ingredients: Ingredient[]
│   ├── sections: RecipeSection[]
│   ├── metadata: RecipeMetadata
│   ├── authorId: string (guest UUID)
│   ├── status: 'draft' | 'in progress' | 'in review' | 'approved'
│   └── timestamps

users/ (future)
├── {userId}/
│   ├── profile: UserProfile
│   └── recipes: string[] (recipe IDs)
```

### Firebase Storage Structure
```
recipes/
├── {recipeId}/
│   ├── hero-image.jpg
│   └── steps/
│       ├── step-1.jpg
│       ├── step-2.jpg
│       └── ...
```

## Development Phases

### Phase 1: Foundation (Week 1)
- Expo project setup with TypeScript
- Navigation structure (tabs + stack)
- Basic UI components with NativeWind
- Firebase configuration
- Zustand stores setup

### Phase 2: Core Features (Weeks 2-3)
- Recipe creation form
- Ingredient management
- Section and step builders
- Photo upload functionality
- Local draft saving

### Phase 3: Data & Integration (Weeks 4-5)
- Firebase integration
- Recipe publishing flow
- Recipe list and detail views
- CHEF iQ appliance integration
- Search and filtering

### Phase 4: Polish & Demo (Weeks 6-8)
- UI polish and animations
- Error handling and validation
- Demo recipe content
- Testing and bug fixes
- EAS build and deployment

## CHEF iQ Integration Points

### Appliance Types
- **MiniOven**: Temperature, time, cooking modes
- **SmartThermometer**: Target temperature, monitoring
- **PressureCooker**: Pressure levels, cooking programs
- **AirFryer**: Temperature, time, basket management

### Recipe Export Format
```typescript
interface ChefIQRecipe {
  // Standard recipe data
  ...recipe,
  
  // CHEF iQ specific
  applianceInstructions: {
    [stepId: string]: ApplianceAction
  },
  
  // Guided cooking metadata
  totalTime: number,
  activeTime: number,
  equipment: string[],
  difficulty: 'Easy' | 'Medium' | 'Hard'
}
```

## Performance Considerations
- Image optimization and compression
- Lazy loading for recipe lists
- Offline support for drafts
- Efficient Firebase queries
- Memory management for photos

## Security & Privacy
- No authentication reduces security complexity
- Guest UUIDs for user identification
- Public Firebase rules for MVP (secure for production)
- No sensitive user data collection

## Testing Strategy
- Component testing with Jest
- E2E testing with Detox (if time permits)
- Manual testing on multiple devices
- Firebase emulator for development