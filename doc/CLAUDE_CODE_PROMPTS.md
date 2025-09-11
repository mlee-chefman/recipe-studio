# Claude Code Prompts for CHEF iQ Studio

## Setup and Configuration Prompts

### Initial Project Setup
```
I'm building a React Native app with Expo for a recipe creation platform. The tech stack is:
- React Native with Expo (TypeScript)
- NativeWind for styling
- Firebase (Firestore + Storage)
- Zustand for state management
- Expo Router for navigation

Can you help me set up the basic project structure and configuration files? I need:
1. Proper TypeScript configuration
2. NativeWind setup
3. Firebase configuration
4. Basic Zustand stores
5. Expo Router navigation structure

The app should have tab navigation with three tabs: "My Recipes", "Create", and "Published".
```

### Firebase Integration
```
I need to integrate Firebase into my React Native Expo app for recipe storage. Please help me:

1. Set up Firebase configuration with environment variables
2. Create a recipe service for CRUD operations
3. Set up Firebase Storage for photo uploads
4. Create TypeScript interfaces for the recipe data model

The recipe schema should include:
- Basic info (title, description, metadata)
- Ingredients array
- Sections array (each containing steps)
- Photo URLs
- CHEF iQ appliance integration data

Please create the complete Firebase service layer.
```

## Component Development Prompts

### Recipe Builder Form
```
I need to create a multi-step recipe builder form for my React Native app. The form should:

1. Use React Hook Form for form management
2. Have multiple tabs/steps: Basic Info, Ingredients, Sections & Steps, Preview
3. Include photo upload functionality
4. Support adding/removing/reordering ingredients and steps
5. Integrate with Zustand store for state management
6. Use NativeWind for styling

The recipe data structure includes sections that contain multiple steps, and each step can have appliance instructions for CHEF iQ devices (MiniOven, AirFryer, etc.).

Can you create the complete recipe builder component with all sub-components?
```

### Photo Upload Component
```
I need a photo upload component for my recipe app that:

1. Uses expo-camera and expo-image-picker
2. Allows users to take photos or select from gallery
3. Compresses images before upload
4. Shows upload progress
5. Integrates with Firebase Storage
6. Handles both recipe hero images and step-by-step photos
7. Includes error handling and retry logic

The component should work within the recipe creation flow and store photo URLs in the recipe data structure.
```

### Recipe List and Cards
```
Create a recipe list component that displays user's recipes in a clean, organized way:

1. Use FlashList for performance with large lists
2. Show recipe cards with photo, title, cook time, difficulty
3. Include search and filter functionality
4. Support pull-to-refresh
5. Handle empty states
6. Include draft vs published status indicators
7. Navigation to recipe detail screens

Style with NativeWind and make it responsive for different screen sizes.
```

## State Management Prompts

### Zustand Store Setup
```
Help me create comprehensive Zustand stores for my recipe app:

1. Recipe Store: Managing current recipe, drafts, published recipes, CRUD operations
2. UI Store: Loading states, modal visibility, upload progress
3. User Store: Guest user management, preferences

The stores should:
- Use TypeScript interfaces
- Include persistence for important data
- Handle async operations
- Integrate with Firebase services
- Support optimistic updates

Please create the complete store implementations with all necessary actions and selectors.
```

### Form State Management
```
I need help integrating React Hook Form with my Zustand store for complex recipe forms:

1. Multi-step form with navigation between steps
2. Auto-save drafts functionality
3. Form validation with real-time feedback
4. Handle dynamic arrays (ingredients, steps)
5. Integration with photo upload states
6. Persist form data across app sessions

The form should handle the complex recipe data structure with sections and steps.
```

## Feature Implementation Prompts

### CHEF iQ Appliance Integration
```
I need to implement CHEF iQ appliance integration features:

1. Appliance selector components (MiniOven, AirFryer, PressureCooker, SmartThermometer)
2. Step-by-step appliance instructions
3. Temperature and timer controls
4. Recipe export format for CHEF iQ platform
5. Visual indicators for appliance requirements

Create components that allow users to:
- Select appliances for each recipe step
- Set temperatures, times, and cooking modes
- Preview how the recipe will work in Guided Cooking
- Validate appliance compatibility

The integration should be intuitive for recipe creators and useful for recipe consumers.
```

### Search and Filter System
```
Implement a comprehensive search and filter system for recipes:

1. Text search across recipe titles, descriptions, ingredients
2. Filter by appliance compatibility
3. Filter by cooking time, difficulty, cuisine type
4. Sort by date created, popularity, cook time
5. Save search preferences
6. Real-time search results

Use efficient algorithms and consider Firebase query limitations. The UI should be intuitive with clear filter indicators and easy reset options.
```

### Offline Support
```
Add offline functionality to the recipe app:

1. Cache recipes locally using AsyncStorage
2. Allow creating and editing recipes offline
3. Sync when connection is restored
4. Handle photo uploads when back online
5. Show connection status
6. Queue failed operations for retry

The offline support should be seamless and not break the user experience when connectivity is poor.
```

## Testing and Quality Prompts

### Component Testing
```
Help me set up comprehensive testing for my React Native components:

1. Jest and React Native Testing Library setup
2. Test utilities for Zustand stores
3. Mock Firebase services
4. Component tests for recipe forms
5. Integration tests for photo upload
6. Snapshot tests for UI components

Create example tests for the key components and establish testing patterns for the team to follow.
```

### Performance Optimization
```
Optimize my React Native app for performance:

1. Image optimization and lazy loading
2. List virtualization improvements
3. Memory management for photo uploads
4. Bundle size optimization
5. Startup time improvements
6. Smooth animations and transitions

Analyze the current implementation and suggest specific optimizations for a recipe creation app with heavy image usage.
```

## Deployment and Build Prompts

### EAS Build Configuration
```
Help me set up EAS Build for deploying to TestFlight and Google Play:

1. Configure eas.json for different build profiles
2. Set up environment variables for Firebase
3. Configure app signing and certificates
4. Set up build automation
5. Create preview builds for testing
6. Configure app store metadata

I need builds ready for competition judges to test on iOS and Android devices.
```

### Documentation Generation
```
Create comprehensive documentation for the competition submission:

1. Technical architecture documentation
2. User experience design rationale
3. Business impact analysis
4. Setup and deployment instructions
5. API documentation for CHEF iQ integration
6. Code structure and patterns guide

The documentation should demonstrate the thinking behind design decisions and show how the app meets competition criteria.
```

## Debugging and Troubleshooting Prompts

### Firebase Debugging
```
I'm having issues with Firebase in my React Native app. Help me debug:

1. Connection problems
2. Firestore query optimization
3. Storage upload failures
4. Security rules configuration
5. Performance monitoring
6. Error tracking and logging

Provide debugging strategies and tools for identifying and fixing Firebase-related issues quickly.
```

### React Native Debugging
```
Help me set up comprehensive debugging for React Native development:

1. Flipper integration
2. Remote debugging setup
3. Performance profiling
4. Memory leak detection
5. Network request monitoring
6. Crash reporting

I need efficient debugging workflows for a 2-person team working on tight deadlines.
```

## Competition-Specific Prompts

### Demo Preparation
```
Help me prepare compelling demo content for the competition:

1. Create 5 diverse recipe examples showcasing different appliances
2. Prepare user flow demonstrations
3. Create presentation slides highlighting key features
4. Develop talking points for live demo
5. Prepare for Q&A sessions
6. Create backup plans for technical issues

The demo should highlight innovation, user experience, and business value to impress the judges.
```

### Business Case Development
```
Help me develop the business case for this recipe platform:

1. Market analysis for user-generated recipe content
2. Revenue model possibilities
3. User engagement strategies
4. Competitive analysis vs existing platforms
5. Scalability considerations
6. Integration benefits for CHEF iQ ecosystem

Create compelling arguments for why this approach will drive business value and user adoption.
```

## Quick Reference Commands

### Common Development Tasks
```bash
# Start development
npx expo start

# Run tests
npm test

# Build for testing
eas build --platform ios --profile preview

# Deploy to Firebase
firebase deploy

# Generate documentation
npm run docs

# Run linting
npm run lint

# Check TypeScript
npm run type-check
```

Use these prompts with Claude Code to get specific, contextual help for your CHEF iQ Studio app development. Each prompt provides enough context for Claude to understand your project structure and requirements.