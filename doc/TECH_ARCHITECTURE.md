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
src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── recipe/           # Recipe-specific components
│   └── forms/            # Form components
├── screens/              # Screen components
├── stores/               # Zustand stores
├── services/             # Firebase and API services
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
└── constants/            # App constants

app/                      # Expo Router screens
├── (tabs)/              # Tab navigation
├── recipe/              # Recipe-related screens
└── modals/              # Modal screens
```

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