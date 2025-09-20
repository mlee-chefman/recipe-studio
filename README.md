# CHEF iQ Studio

A mobile app for creating and publishing recipes to the CHEF iQ platform.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/mlee-chefman/recipe-studio.git
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. To run app
   ```bash
   yarn run ios
   ```

4. Scan QR code with Expo Go app 

## Features

### ✅ Implemented
- [x] **Recipe Creation & Editing**: Complete recipe authoring with dynamic form management
- [x] **Photo Support**: Take photos, choose from library, or enter image URLs
- [x] **ChefIQ Appliance Integration**: RJ40 Smart Cooker & CQ50 Smart Mini Oven support
- [x] **Recipe Scraping**: Import recipes from websites with AI-powered ChefIQ analysis
- [x] **Recipe Management**: View, edit, delete, and organize recipes locally
- [x] **Search & Filtering**: Find recipes by title, category, and difficulty
- [x] **Cooking Method Assignment**: Assign ChefIQ cooking actions to recipe steps
- [x] **Thermometer Probe Support**: Temperature-based cooking for Mini Oven

### 🔄 In Progress
- [ ] **Recipe Publishing**: Firebase cloud storage integration
- [ ] **User Authentication**: User accounts and recipe ownership
- [ ] **Recipe Sharing**: Share recipes with other users

### 📋 Planned
- [ ] **Guided Cooking Export**: Generate ChefIQ-compatible format
- [ ] **Recipe Collections**: Organize recipes into cookbooks

## Tech Stack

- React Native (Expo)
- TypeScript
- NativeWind (Tailwind CSS)
- Firebase (Firestore + Storage)
- Zustand (State Management)

## Quick Start

### Running the App
```bash
# Install dependencies
yarn install

# Start development server
npx expo start --port 8082

# Run on iOS simulator
yarn run ios

# Run on Android emulator
yarn run android
```

### Key Files
- `store/store.ts` - Recipe state management with Zustand
- `screens/recipe-creator.tsx` - Main recipe creation screen
- `components/RecipeList.tsx` - Recipe browsing and management
- `utils/recipeScraper.ts` - Website recipe import functionality
- `utils/recipeAnalyzer.ts` - ChefIQ appliance analysis
- `types/chefiq.ts` - ChefIQ type definitions

### Documentation
- `FEATURES_PROGRESS.md` - Detailed feature implementation status
- `DEVELOPMENT_GUIDE.md` - Development patterns and standards
- `PROJECT_OVERVIEW.md` - Competition context and goals

## Competition Entry

This app is submitted for the CHEF iQ Studio App Challenge.

**Current Status**: ~60% complete with core recipe management features implemented
**Next Phase**: Firebase integration and cloud publishing workflow
