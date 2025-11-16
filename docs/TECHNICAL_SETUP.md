# Technical Setup Guide

Complete setup guide for all external services and configurations used in Recipe Studio.

---

## Table of Contents
1. [Firebase Setup](#firebase-setup)
2. [Gemini AI Setup](#gemini-ai-setup)
3. [Spoonacular API Setup](#spoonacular-api-setup)
4. [Instacart API Setup](#instacart-api-setup)
5. [Environment Configuration](#environment-configuration)
6. [ChefIQ Export Format](#chefiq-export-format)

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

    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user is the owner
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      // Allow users to read any user profile (needed for displaying recipe authors)
      allow read: if isAuthenticated();

      // Allow users to create and update only their own profile
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);

      // Don't allow deletion
      allow delete: if false;

      // Grocery cart subcollection
      match /groceryCart/{cartDoc} {
        // Users can only access their own cart
        allow read, write: if isOwner(userId);
      }
    }

    // Recipes collection
    match /recipes/{recipeId} {
      // Allow anyone authenticated to read published recipes
      allow read: if isAuthenticated() && (
        resource.data.published == true ||
        isOwner(resource.data.userId)
      );

      // Allow users to create recipes with their own userId
      allow create: if isAuthenticated() &&
        request.auth.uid == request.resource.data.userId;

      // Allow users to update only their own recipes
      allow update: if isOwner(resource.data.userId);

      // Allow users to delete only their own recipes
      allow delete: if isOwner(resource.data.userId);
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

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Get API Key** or **Create API Key**
3. Copy the API key

**Recommended:** Use a paid account for production use (1000 RPM vs 15 RPM on free tier)

### 2. Configure in App

Add to `.env` file:
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Current Model

**Gemini 2.5 Flash-Lite** (Production-ready)
- 90% cheaper than Gemini 2.0 Flash
- Multimodal vision support (images + text)
- Optimized for speed and cost

### 4. Features Using Gemini

**Multimodal Vision (Image Recognition):**
- Extract recipes from images in one step (OCR + parsing combined)
- Handles handwritten notes and printed recipes
- Cost: Free (included in Gemini API)
- No separate Vision API needed

**PDF Recipe Extraction:**
- Read recipes from PDF cookbooks
- Batch processing with intelligent chunking
- Cost: ~$0.001 per page

**Recipe Generation:**
- Generate recipes from text descriptions
- AI-powered recipe creation
- Cost: ~$0.001 per recipe

**Recipe Parsing:**
- Parse recipe text into structured data
- Smart ingredient parsing and normalization
- Split long instructions intelligently

**Cooking Action Analysis:**
- Analyze recipes for ChefIQ appliance compatibility
- Detect cooking methods (pressure cook, bake, air fry, etc.)
- Extract temperatures, times, and parameters

**My Kitchen Feature:**
- Generate recipes from available ingredients
- Suggest substitutions
- Calculate ingredient match percentage

**AI Image Generation (Imagen 4):**
- Generate recipe cover photos automatically
- Cost: $0.02 - 0.04 per image
- High-quality food photography

### 5. Rate Limiting

**Free Tier Limits:**
- 15 requests/minute
- 50 requests/day
- Not recommended for production

**Paid Tier (Recommended):**
- 1,000 requests/minute
- Much higher daily quotas
- Better for production use

**Retry Logic:**
- Automatic retry on 503 (Service Unavailable)
- Automatic retry on 429 (Rate Limit)
- Exponential backoff: 3s for 429, 5s for 503

---

## Spoonacular API Setup

### 1. Get API Key

1. Go to [Spoonacular Food API](https://spoonacular.com/food-api/console#Dashboard)
2. Sign up for an account
3. Navigate to **Dashboard** > **My Console**
4. Copy your API key

### 2. Configure in App

Add to `.env` file:
```bash
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_api_key_here
```

### 3. Features Using Spoonacular

**My Kitchen Feature:**
- Ingredient autocomplete
- Search recipes by ingredients
- Recipe suggestions based on what you have
- Nutrition information

**Usage:**
- Free tier: 150 requests/day
- Sufficient for demo and testing
- See [SPOONACULAR_COST_ANALYSIS.md](./SPOONACULAR_COST_ANALYSIS.md) for detailed pricing

---

## Instacart API Setup

### 1. Get API Key

**Apply for Instacart Developer Platform Access:**

1. Go to [Instacart Developer Platform](https://docs.instacart.com/developer_platform_api/get_started/)
2. Apply for API access (requires partnership application)
3. Once approved, get your test/sandbox API key from the dashboard

### 2. Configure in App

**IMPORTANT: This app is configured for SANDBOX/TEST environment only**

Add to `.env`:
```bash
# Use sandbox/test API key (ic_test_xxxxx or keys.xxxxx)
# DO NOT use production keys (ic_prod_xxxxx) in this demo app
EXPO_PUBLIC_INSTACART_API_KEY=your_instacart_test_api_key_here
```

**Supported API Key Formats:**
- `ic_test_xxxxx` (sandbox/test key)
- `keys.xxxxx` (development key)

**Configuration Details:**
- **Endpoint:** `https://connect.dev.instacart.tools/idp/v1/products/products_link` (sandbox)
- **Environment:** Sandbox/test only - works in both debug and release builds
- **Production:** NOT configured (would require `https://connect.instacart.com` endpoint)

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

**Option 1: Download Pre-configured (Recommended)**

Download the `.env` file from OneDrive:
[Download .env from OneDrive](https://plusitscheap-my.sharepoint.com/:u:/r/personal/mlee_chefman_com/Documents/RecipeiQ/.env?csf=1&web=1&e=Lzunx4)

Save it to the project root directory.

**Option 2: Create Manually**

Create `.env` in project root:

```bash
# Google Gemini API Key (REQUIRED)
# Get your API key from: https://aistudio.google.com/app/apikey
# Model: Gemini 2.5 Flash-Lite (production-ready, 90% cheaper than 2.0 Flash)
# Recommended: Use paid account for production (1000 RPM vs 15 RPM free tier)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Spoonacular API Key (REQUIRED for My Kitchen feature)
# Get your API key from: https://spoonacular.com/food-api/console#Dashboard
# Free tier: 150 requests/day
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_api_key_here

# Instacart API Key (SANDBOX/TEST ONLY - DEMO APP)
# Get your API key from: https://docs.instacart.com/developer_platform_api/get_started/
# IMPORTANT: Use sandbox/test keys only (ic_test_xxxxx or keys.xxxxx)
# DO NOT use production keys (ic_prod_xxxxx) in this demo app
EXPO_PUBLIC_INSTACART_API_KEY=your_instacart_test_api_key_here
```

### Environment Variable Usage

Environment variables are loaded using Expo's built-in configuration system.

**Access in code:**
```typescript
import Constants from 'expo-constants';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey;
```

**Or using process.env (for EXPO_PUBLIC_ prefixed variables):**
```typescript
const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
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

### Development/Demo
- Download `.env` file from OneDrive with pre-configured test credentials
- Use Gemini free tier (15 RPM, 50 RPD) for testing
- Use Spoonacular free tier (150 requests/day)
- Use Instacart sandbox/test environment
- Firebase: Use development project with security rules deployed

### Production (Not Configured)
- This is a demo app for ChefIQ Studio App Challenge
- Not configured for production deployment
- Would require:
  - Gemini paid tier (1000 RPM recommended)
  - Instacart production API keys and endpoint
  - Production Firebase project
  - Monitoring and rate limit management

---

## Troubleshooting

### Gemini API Issues
- **429 Error**: Rate limit exceeded
  - Free tier: Wait 1 minute (15 RPM limit)
  - Paid tier: Check if you've exceeded 1000 RPM
- **503 Error**: Service unavailable, app will retry automatically after 5 seconds
- **Invalid API Key**: Verify key at [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Quota Exceeded**: Free tier has 50 requests/day limit, consider upgrading to paid tier

### Firebase Issues
- **Permission Denied**: Check Firestore security rules are deployed
- **Auth Error**: Verify Firebase config in app.config.js
- **Network Error**: Check internet connection

### Spoonacular API Issues
- **401 Unauthorized**: Invalid API key, verify at Spoonacular dashboard
- **429 Rate Limit**: Exceeded 150 requests/day (free tier)
- **No Results**: Ingredient not found, try different search term

### Instacart API Issues
- **Invalid API Key**: Verify you're using test/sandbox key (ic_test_ or keys. prefix)
- **403 Forbidden**: Using production key in sandbox environment
- **Network Error**: Check sandbox endpoint is accessible

---

## Cost Monitoring

See detailed cost analysis in:
- [AI_FEATURE_COST_ANALYSIS.md](./AI_FEATURE_COST_ANALYSIS.md) - Gemini costs
- [SPOONACULAR_COST_ANALYSIS.md](./SPOONACULAR_COST_ANALYSIS.md) - Spoonacular costs

**Quick Summary:**
- **Gemini 2.5 Flash-Lite**: ~$0.001/request (text/vision), Free tier: 15 RPM, 50 RPD
- **Imagen 4**: $0.02 - 0.04/image (AI-generated recipe photos)
- **Spoonacular**: 150 requests/day free
- **Firebase**: Free tier generous for small apps
- **Instacart**: No cost (sandbox/test environment)

**Note:** App is optimized for cost efficiency using Gemini 2.5 Flash-Lite (90% cheaper than alternatives)
