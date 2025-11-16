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
- [Project Structure](#project-structure)
- [Important Documentation](#important-documentation)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
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
# Download .env from OneDrive (see Installation section for link)

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
- **Multimodal Recipe Import**: Extract recipes from images and PDFs using Gemini multimodal
- **My Kitchen**: Generate recipe ideas based on ingredients you have on hand
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

---

## Tech Stack

- **Framework**: React Native (Expo SDK 53)
- **Language**: TypeScript
- **Styling**: Custom theme system with design tokens (colors, typography, spacing, shadows)
- **State Management**: Zustand with persistence
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI/ML**:
  - Google Gemini 2.5 Flash-Lite (recipe generation, vision, parsing)
  - Imagen 3 (AI image generation)
- **APIs**:
  - Spoonacular (ingredient autocomplete, recipe search)
  - Instacart IDP API (shopping cart integration)
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

**Option 1: Download from OneDrive (Recommended)**

Download the pre-configured `.env` file from OneDrive:

[Download .env file from OneDrive](https://plusitscheap-my.sharepoint.com/:u:/r/personal/mlee_chefman_com/Documents/RecipeiQ/.env?csf=1&web=1&e=Lzunx4)

Save the downloaded file as `.env` in the root directory of the project.


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
```

### Production Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

```

**Note**: Production builds require an Expo Application Services (EAS) account. See [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) for setup instructions.

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
│   ├── PROJECT_OVERVIEW.md             # Competition context
│   ├── AI_IMPLEMENTATION_GUIDE.md      # AI features guide
│   ├── AI_FEATURE_COST_ANALYSIS.md     # AI cost analysis
│   ├── SPOONACULAR_COST_ANALYSIS.md    # API cost analysis
│   ├── TECHNICAL_SETUP.md              # Service setup guide
│   ├── CONFIGURATION_GUIDE.md          # Configuration reference
├── CLAUDE.md               # AI assistant development guidelines
├── app.config.js           # Expo configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## Important Documentation

### For Developers

- **[CLAUDE.md](CLAUDE.md)** - AI assistant development guidelines and rules
- **[docs/TECHNICAL_SETUP.md](docs/TECHNICAL_SETUP.md)** - Service configuration and setup
- **[docs/CONFIGURATION_GUIDE.md](docs/CONFIGURATION_GUIDE.md)** - All configurable parameters

### For AI Features

- **[docs/AI_IMPLEMENTATION_GUIDE.md](docs/AI_IMPLEMENTATION_GUIDE.md)** - How AI features work
- **[docs/AI_FEATURE_COST_ANALYSIS.md](docs/AI_FEATURE_COST_ANALYSIS.md)** - Gemini AI cost analysis
- **[docs/SPOONACULAR_COST_ANALYSIS.md](docs/SPOONACULAR_COST_ANALYSIS.md)** - Spoonacular API costs

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
- [ ] Test My Kitchen feature
- [ ] Test shopping cart integration
- [ ] Test Firebase sync
- [ ] Test on both iOS and Android

## Troubleshooting

### Common Issues

**Issue: "Failed to generate recipe"**
- Cause: Gemini API key missing or invalid
- Solution: Check `.env` file and verify API key at https://aistudio.google.com/app/apikey

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

## Support

- **Documentation**: See `docs/` folder for comprehensive guides
- **Issues**: Check `CLAUDE.md` and documentation first
- **Firebase Setup**: See `docs/TECHNICAL_SETUP.md`
- **AI Features**: See `docs/AI_IMPLEMENTATION_GUIDE.md`
- **Configuration**: See `docs/CONFIGURATION_GUIDE.md`

**For questions about specific features, refer to the documentation files listed in the [Important Documentation](#important-documentation) section above.**

**Key Features**:
- AI recipe generation from text, images, and PDFs
- Smart ingredient management with My Kitchen
- Shopping cart integration with Instacart
- ChefIQ appliance compatibility detection
- Firebase cloud sync and authentication
- Clean, minimal design with excellent UX
