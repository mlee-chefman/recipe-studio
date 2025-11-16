# Recipe Studio

**An AI-powered mobile app for creating, managing, and publishing recipes to the ChefIQ platform**

Built for the ChefIQ Studio App Challenge using React Native, Expo, Google Gemini AI, and Firebase.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Building the App](#building-the-app)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Important Documentation](#important-documentation)
- [Development](#development)
- [Testing](#testing)
- [License](#license)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/mlee-chefman/recipe-studio.git
cd recipe-studio

# 2. Install dependencies
npm install
# or
yarn install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your API keys (see Configuration section)

# 4. Start the development server
npx expo start

# 5. Run on iOS simulator
npx expo start --ios
# or Android emulator
npx expo start --android
```

---

## Features

### Core Features
- **AI Recipe Generation**: Create recipes from text descriptions using Google Gemini AI
- **Multimodal Recipe Import**: Extract recipes from images and PDFs using Gemini Vision
- **My Fridge**: Generate recipe ideas based on ingredients you have on hand
- **Shopping Cart**: Add recipe ingredients to cart and shop on Instacart
- **Recipe Management**: Create, edit, delete, and organize recipes
- **ChefIQ Integration**: Detect appliance compatibility and guided cooking actions
- **Firebase Cloud Sync**: Store recipes and data in the cloud with user authentication

### AI Features
- Text-to-Recipe generation with natural language
- Image-to-Recipe extraction (OCR + parsing in one step)
- PDF cookbook import (batch processing)
- Smart ingredient parsing and normalization
- Automatic cooking action detection for ChefIQ appliances
- AI-generated recipe cover images with Imagen 3

### User Experience
- Clean, minimal design inspired by ReciMe
- Real-time recipe search and filtering
- Photo support (camera or library)
- Offline support with AsyncStorage caching
- Haptic feedback for better UX
- Theme support (Fresh, Warm, Cool color variants)

---

## Tech Stack

- **Framework**: React Native (Expo SDK 53)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with persistence
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI/ML**:
  - Google Gemini 2.5 Flash-Lite (recipe generation, vision, parsing)
  - Imagen 3 (AI image generation)
- **APIs**:
  - Spoonacular (ingredient autocomplete, recipe search)
  - Instacart IDP API (shopping cart integration)
  - Unsplash (food imagery)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Other**: Axios, PDF-lib, Expo Image Picker, Expo Haptics

---

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your physical device (optional)

### Step 1: Clone the Repository

```bash
git clone https://github.com/mlee-chefman/recipe-studio.git
cd recipe-studio
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys (see [Configuration](#configuration) section below).

### Step 4: Firebase Setup (Optional for Basic Usage)

If you want to use cloud features (auth, sync, storage):

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Enable Storage
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
6. Place config files in the appropriate directories
7. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

See `docs/TECHNICAL_SETUP.md` for detailed Firebase setup instructions.

---

## Building the App

### Development Build

```bash
# Start the Expo development server
npx expo start

# Run on iOS (Mac only)
npx expo start --ios
# or use the shortcut
yarn ios

# Run on Android
npx expo start --android
# or use the shortcut
yarn android

# Run on web (experimental)
npx expo start --web
```

### Production Build

#### iOS (requires Mac + Xcode)

```bash
# Create a development build
npx expo run:ios

# Create a production build
eas build --platform ios --profile production
```

#### Android

```bash
# Create a development build
npx expo run:android

# Create a production build (APK)
eas build --platform android --profile production

# Create an AAB for Google Play Store
eas build --platform android --profile production --output aab
```

### Using EAS Build (Recommended for Production)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure EAS:
```bash
eas login
eas build:configure
```

3. Build for both platforms:
```bash
eas build --platform all
```

See [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/) for more details.

---

## Configuration

### Required API Keys

Edit your `.env` file with the following API keys:

#### 1. Google Gemini API Key (REQUIRED)

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

- **Get it from**: https://aistudio.google.com/app/apikey
- **Used for**: Recipe generation, image/PDF import, AI parsing, cooking actions
- **Model**: Gemini 2.5 Flash-Lite (production-ready, 90% cheaper)
- **Recommended**: Paid account (1000 RPM) for best performance

#### 2. Spoonacular API Key (Optional)

```env
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_api_key_here
```

- **Get it from**: https://spoonacular.com/food-api/console#Dashboard
- **Used for**: My Fridge feature (ingredient autocomplete, recipe search)
- **Free tier**: 150 requests/day

#### 3. Unsplash API Key (Optional)

```env
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

- **Get it from**: https://unsplash.com/developers
- **Used for**: AI-generated recipe step images
- **Free tier**: 50 requests/hour

#### 4. Instacart API Key (Optional - Sandbox/Test Only)

```env
EXPO_PUBLIC_INSTACART_API_KEY=your_instacart_test_api_key_here
```

- **Get it from**: https://docs.instacart.com/developer_platform_api/get_started/
- **Used for**: Shopping cart integration via IDP API
- **Important**: Use SANDBOX keys only (ic_test_xxxxx or keys.xxxxx)
- **DO NOT** use production keys in this demo app

### Cost Analysis

See `docs/AI_FEATURE_COST_ANALYSIS.md` and `docs/SPOONACULAR_COST_ANALYSIS.md` for detailed cost breakdowns and optimization strategies.

---

## Project Structure

```
recipe-studio/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── modals/         # Modal components
│   │   └── common/         # Shared components
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   ├── services/           # External API integrations
│   │   ├── gemini.service.ts      # Gemini AI integration
│   │   ├── firebase.service.ts    # Firebase operations
│   │   ├── spoonacular.service.ts # Spoonacular API
│   │   └── instacart.service.ts   # Instacart integration
│   ├── store/              # Zustand state management
│   ├── theme/              # App theme and design system
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions and constants
├── docs/                   # Documentation
│   ├── README.md                       # Quick start guide
│   ├── PROJECT_OVERVIEW.md             # Competition context
│   ├── FEATURES_PROGRESS.md            # Feature status
│   ├── AI_IMPLEMENTATION_GUIDE.md      # AI features guide
│   ├── AI_FEATURE_COST_ANALYSIS.md     # AI cost analysis
│   ├── SPOONACULAR_COST_ANALYSIS.md    # API cost analysis
│   ├── TECHNICAL_SETUP.md              # Service setup guide
│   ├── CONFIGURATION_GUIDE.md          # Configuration reference
│   └── MIGRATION_SUMMARY.md            # Recent changes
├── CLAUDE.md               # AI assistant development guidelines
├── .env.example            # Environment variables template
├── firestore.rules         # Firestore security rules
├── app.config.js           # Expo configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## Important Documentation

### For Developers

- **[CLAUDE.md](CLAUDE.md)** - AI assistant development guidelines and rules
- **[docs/README.md](docs/README.md)** - Quick start and installation guide
- **[docs/TECHNICAL_SETUP.md](docs/TECHNICAL_SETUP.md)** - Service configuration and setup
- **[docs/CONFIGURATION_GUIDE.md](docs/CONFIGURATION_GUIDE.md)** - All configurable parameters

### For Understanding the Project

- **[docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** - Competition context and goals
- **[docs/FEATURES_PROGRESS.md](docs/FEATURES_PROGRESS.md)** - Feature implementation status

### For AI Features

- **[docs/AI_IMPLEMENTATION_GUIDE.md](docs/AI_IMPLEMENTATION_GUIDE.md)** - How AI features work
- **[docs/AI_FEATURE_COST_ANALYSIS.md](docs/AI_FEATURE_COST_ANALYSIS.md)** - Gemini AI cost analysis
- **[docs/SPOONACULAR_COST_ANALYSIS.md](docs/SPOONACULAR_COST_ANALYSIS.md)** - Spoonacular API costs
- **[docs/MIGRATION_SUMMARY.md](docs/MIGRATION_SUMMARY.md)** - Gemini 2.5 Flash-Lite migration

### Documentation Summary

This project has **10 core documentation files** covering:
- Setup and installation
- AI implementation and costs
- Configuration and services
- Development guidelines
- Feature progress tracking

All documentation is well-organized and regularly updated. Start with `docs/README.md` for an overview.

---

## Development

### Running the App

```bash
# Start development server
npx expo start

# Start on specific port
npx expo start --port 8082

# Clear cache and restart
npx expo start -c
```

### Code Quality

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage
```

### Development Guidelines

1. **Read Documentation First**: Always check `CLAUDE.md` and relevant docs before making changes
2. **Use Theme System**: Use `src/theme/` for styling (see `CLAUDE.md` for rules)
3. **Type Safety**: Use TypeScript interfaces from `src/types/`
4. **Error Handling**: Wrap API calls in try/catch with user-friendly errors
5. **Cost Awareness**: Check cost analysis docs before adding API calls
6. **Follow Patterns**: Use existing patterns from `src/services/` and `src/hooks/`

See `CLAUDE.md` for comprehensive development rules and patterns.

---

## Testing

### Manual Testing

```bash
# Run the app
npx expo start

# Test on physical device
# Scan QR code with Expo Go app
```

### Testing Checklist

- [ ] Test recipe creation (text input)
- [ ] Test AI recipe generation
- [ ] Test image import (camera and library)
- [ ] Test PDF import
- [ ] Test My Fridge feature
- [ ] Test shopping cart integration
- [ ] Test Firebase sync (requires deployment)
- [ ] Test offline mode
- [ ] Test on both iOS and Android

### Firebase Testing

1. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

2. Check Firebase Console:
   - Go to https://console.firebase.google.com
   - Navigate to Firestore Database
   - Verify data structure under `users/{userId}/`

See `RESUME_HERE.md` for detailed testing instructions.

---

## Troubleshooting

### Common Issues

**Issue: "Failed to generate recipe"**
- Cause: Gemini API key missing or invalid
- Solution: Check `.env` file and verify API key at https://aistudio.google.com/app/apikey

**Issue: "Failed to add items to cart"**
- Cause: Firestore rules not deployed
- Solution: Run `firebase deploy --only firestore:rules`

**Issue: Build errors after fresh install**
- Cause: Cache or dependency issues
- Solution:
  ```bash
  rm -rf node_modules
  npm install
  npx expo start -c
  ```

**Issue: "Module not found" errors**
- Cause: TypeScript path aliases not resolved
- Solution: Check `tsconfig.json` and `babel.config.js` configurations

See individual documentation files for more troubleshooting tips.

---

## Competition Entry

This app is submitted for the **ChefIQ Studio App Challenge**.

**Status**: Feature-complete with AI-powered recipe creation, management, and ChefIQ integration

**Key Features for Judges**:
- AI recipe generation from text, images, and PDFs
- Smart ingredient management with My Fridge
- Shopping cart integration with Instacart
- ChefIQ appliance compatibility detection
- Firebase cloud sync and authentication
- Clean, minimal design with excellent UX

---

## Contributing

This is a competition entry project. For development guidelines, see `CLAUDE.md`.

---

## License

Copyright © 2025 Recipe Studio Team. All rights reserved.

Built for the ChefIQ Studio App Challenge.

---

## Support

- **Documentation**: See `docs/` folder for comprehensive guides
- **Issues**: Check `CLAUDE.md` and documentation first
- **Firebase Setup**: See `docs/TECHNICAL_SETUP.md`
- **AI Features**: See `docs/AI_IMPLEMENTATION_GUIDE.md`
- **Configuration**: See `docs/CONFIGURATION_GUIDE.md`

**For questions about specific features, refer to the documentation files listed in the [Important Documentation](#important-documentation) section above.**
