# Technical Setup Guide

Complete setup guide for all external services and configurations used in Recipe Studio.

---

## Table of Contents
1. [Firebase Setup](#firebase-setup)
2. [Gemini AI Setup](#gemini-ai-setup)
3. [Google Cloud Vision Setup](#google-cloud-vision-setup)
4. [Spoonacular API Setup](#spoonacular-api-setup)
5. [Instacart API Setup](#instacart-api-setup)
6. [Environment Configuration](#environment-configuration)
7. [ChefIQ Export Format](#chefiq-export-format)

---

## Firebase Setup

### 1. Firebase Authentication

**Enable Email/Password Authentication:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Email/Password** provider
5. Save changes

**Configuration:**
- Anonymous auth is disabled by default
- Password reset emails use Firebase default templates
- Users can sign up and sign in with email/password

---

### 2. Firestore Database

**Security Rules:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // User documents
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);

      // User's recipes (subcollection)
      match /recipes/{recipeId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }
    }

    // Published recipes (public)
    match /publishedRecipes/{recipeId} {
      allow read: if true; // Anyone can read published recipes
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() &&
        resource.data.userId == request.auth.uid;
    }

    // User generation counts
    match /userGenerations/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
  }
}
```

**Deploy Rules:**
```bash
firebase deploy --only firestore:rules
```

---

## Gemini AI Setup

### 1. Get API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API Key**
3. Create new API key or use existing
4. Copy the API key

### 2. Configure in App

Add to `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Features Using Gemini

**Recipe Generation:**
- Generate recipes from user descriptions
- Cost: ~$0.001 per recipe (Flash model)
- Rate limit: 15 requests/minute (free tier)

**Recipe Parsing:**
- Extract recipes from images (OCR)
- Parse recipe text into structured data
- Split long instructions intelligently

**Cooking Action Analysis:**
- Analyze recipes for ChefIQ compatibility
- Detect cooking methods (pressure cook, bake, etc.)
- Extract temperatures, times, and parameters

**My Fridge Feature:**
- Generate recipes from available ingredients
- Suggest substitutions
- Calculate ingredient match percentage

### 4. Rate Limiting

**Free Tier Limits:**
- 15 requests/minute
- 1,500 requests/day
- 1 million tokens/minute

**Retry Logic:**
- Automatic retry on 503 (Service Unavailable)
- Automatic retry on 429 (Rate Limit)
- Exponential backoff: 3s for 429, 5s for 503

---

## ~~Google Cloud Vision Setup~~ (DEPRECATED)

**Note:** As of 2025, Recipe Studio now uses **Gemini 2.5 Flash-Lite multimodal vision** instead of Google Cloud Vision API for image recognition. This provides:
- 85-90% cost savings
- Better recipe understanding
- Single API call (no separate OCR + parsing)
- Handles handwritten notes better

**No additional setup needed** - Gemini multimodal vision uses the same `EXPO_PUBLIC_GEMINI_API_KEY` as other features.
- Gemini Vision is free in Flash model

---

## Spoonacular API Setup

### 1. Get API Key

1. Go to [Spoonacular](https://spoonacular.com/food-api)
2. Sign up for an account
3. Navigate to **Dashboard** > **API Keys**
4. Copy your API key

### 2. Configure in App

Add to `.env` file:
```bash
SPOONACULAR_API_KEY=your_spoonacular_api_key_here
```

### 3. Features Using Spoonacular

**My Fridge Feature:**
- Ingredient autocomplete
- Search recipes by ingredients
- Get recipe details
- Nutrition information

**Usage:**
- Free tier: 150 requests/day
- See [SPOONACULAR_COST_ANALYSIS.md](./SPOONACULAR_COST_ANALYSIS.md) for detailed pricing

---

## Instacart API Setup

### 1. Get API Key

**Apply for Instacart Developer Platform Access:**

1. Go to [Instacart Developer Platform](https://docs.instacart.com/developer_platform_api/get_started/)
2. Apply for API access (requires partnership application)
3. Once approved, get your API key from the dashboard
4. API key format: `ic_prod_xxxxx` or `ic_test_xxxxx`

### 2. Configure in App

**IMPORTANT: This is a DEMO APP configured for SANDBOX/TEST environment only**

Add to `.env`:
```bash
# Use test/sandbox API key (ic_test_xxxxx or keys.xxxxx)
# DO NOT use production keys (ic_prod_xxxxx) in this demo app
EXPO_PUBLIC_INSTACART_API_KEY=ic_test_your_key_here
```

**Configuration Details:**
- **Endpoint:** `https://connect.dev.instacart.tools/idp/v1/products/products_link` (sandbox/test)
- **API Key Format:** `ic_test_xxxxx` or `keys.xxxxx` (development keys)
- **Environment:** Sandbox/test only - works in both debug and release builds
- **Production:** NOT configured (would use `https://connect.instacart.com`)

### 3. How It Works

**Shopping Cart Integration:**

The app uses Instacart's IDP (Ingredient Data Platform) API to create shopping lists:

1. **User selects ingredients** in Recipe Detail or Grocery Cart
2. **Ingredient names simplified** using Gemini AI for better product matching
   - Example: "2 (6-ounce) salmon fillets, skin on" → "salmon"
3. **JSON posted to IDP API** at `https://connect.dev.instacart.tools/idp/v1/products/products_link` (sandbox endpoint)
4. **Instacart returns direct link** like `https://customers.dev.instacart.tools/store/shopping_lists/8502939`
5. **User clicks to open** shopping list on Instacart app/website (sandbox environment)

**Note:** This demo app uses the sandbox/test environment in both debug and release builds. No production Instacart credentials are needed or used.

**JSON Format:**
```json
{
  "title": "Shopping List - 2 Recipes",
  "link_type": "shopping_list",
  "expires_in": 1,
  "landing_page_configuration": {
    "enable_pantry_items": true
  },
  "line_items": [
    {
      "name": "salmon",
      "display_text": "2 (6-ounce) salmon fillets",
      "quantity": 2,
      "unit": "fillets"
    }
  ]
}
```

**Authentication:**
- Uses simple Bearer token authentication
- API key passed in `Authorization: Bearer ${API_KEY}` header
- No OAuth flow required for frontend integration

**Affiliate Commission:**
- Uses ChefIQ affiliate ID: `1538`
- 5% commission on completed purchases
- Tracked via UTM parameters

**Code Location:**
- Service: `src/services/instacart.service.ts`
- Grocery Cart: `src/screens/GroceryCart.tsx`
- Recipe Detail: `src/screens/recipeDetail.tsx`

---

## Environment Configuration

### Complete .env File

Create `.env` in project root:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud Vision (Optional - falls back to Gemini)
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key_here

# Spoonacular API (for My Fridge feature)
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_api_key_here

# Instacart API (for shopping cart integration)
EXPO_PUBLIC_INSTACART_API_KEY=ic_prod_your_key_here

# Unsplash API (for step images)
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

### Loading Environment Variables

The app uses `react-native-dotenv` to load environment variables.

**babel.config.js:**
```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};
```

**Usage in code:**
```typescript
import { GEMINI_API_KEY } from '@env';
```

---

## ChefIQ Export Format

### Recipe JSON Structure

```json
{
  "recipe_id": "uuid-string",
  "name": "Recipe Name",
  "description": "Brief description",
  "servings": 4,
  "appliance_id": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
  "useProbe": true,
  "ingredients": [
    {
      "name": "Ingredient 1",
      "quantity": "1 cup"
    }
  ],
  "steps": [
    {
      "instruction": "Step text",
      "cooking_action": {
        "appliance_id": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
        "method_id": "0",
        "method_name": "Pressure Cook",
        "parameters": {
          "cooking_time": 900,
          "pres_level": 1,
          "pres_release": 2
        }
      }
    }
  ]
}
```

### ChefIQ Appliances

**iQ Cooker (Multi Cooker):**
- ID: `c8ff3aef-3de6-4a74-bba6-03e943b2762c`
- Methods: Pressure Cook, Sear/Sauté, Steam, Slow Cook, Sous Vide

**iQ MiniOven:**
- ID: `4a3cd4f1-839b-4f45-80ea-08f594ff74c3`
- Methods: Bake, Air Fry, Roast, Broil, Toast, Dehydrate
- Supports meat probe

### Cooking Method Parameters

**Pressure Cook (method_id: "0"):**
```json
{
  "cooking_time": 900,        // seconds
  "pres_level": 1,            // 0=Low, 1=High
  "pres_release": 2,          // 0=Quick, 1=Pulse, 2=Natural
  "keep_warm": 1,             // 0=Off, 1=On
  "delay_time": 0             // seconds
}
```

**Bake (method_id: "METHOD_BAKE"):**
```json
{
  "cooking_time": 1500,       // seconds (if no probe)
  "target_cavity_temp": 350,  // °F
  "fan_speed": 1,             // 0=Low, 1=Medium, 2=High
  "target_probe_temp": 165,   // °F (if using probe)
  "remove_probe_temp": 160    // °F (if using probe)
}
```

**Note:** When using probe, omit `cooking_time` parameter.

---

## Development vs Production

### Development
- Use `.env` file with test credentials
- Enable Firebase emulators (optional)
- Use Gemini free tier
- Use Spoonacular free tier

### Production
- Use environment variables from hosting platform
- Enable Firebase security rules
- Monitor API usage and costs
- Consider upgrading to paid tiers based on usage

---

## Troubleshooting

### Gemini API Issues
- **429 Error**: Rate limit exceeded, wait 1 minute
- **503 Error**: Service unavailable, retry after 5 seconds
- Check API key is valid and billing is enabled

### Firebase Issues
- **Permission Denied**: Check Firestore security rules
- **Auth Error**: Verify Firebase config in .env
- **Network Error**: Check internet connection

### Vision API Issues
- **Invalid API Key**: Verify key in Google Cloud Console
- **Quota Exceeded**: Check usage in Cloud Console
- **Falls back to Gemini**: Vision API failed, using Gemini instead

---

## Cost Monitoring

See detailed cost analysis in:
- [AI_FEATURE_COST_ANALYSIS.md](./AI_FEATURE_COST_ANALYSIS.md) - Gemini costs
- [SPOONACULAR_COST_ANALYSIS.md](./SPOONACULAR_COST_ANALYSIS.md) - Spoonacular costs

**Quick Summary:**
- Gemini: Free tier covers most usage (~$0.001/request)
- Vision: $1.50/1,000 images (first 1,000 free)
- Spoonacular: 150 requests/day free
- Firebase: Free tier generous for small apps

**Recommended: Stay on free tiers until 100+ users**
