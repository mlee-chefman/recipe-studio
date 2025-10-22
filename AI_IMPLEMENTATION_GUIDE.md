# AI Implementation Guide

Complete guide to all AI features and their implementation in Recipe Studio.

---

## Table of Contents
1. [Overview](#overview)
2. [Gemini AI Features](#gemini-ai-features)
3. [Recipe Parsing & Generation](#recipe-parsing--generation)
4. [Cooking Action Analysis](#cooking-action-analysis)
5. [Image Recognition (OCR)](#image-recognition-ocr)
6. [My Fridge Feature](#my-fridge-feature)
7. [Prompt Engineering](#prompt-engineering)
8. [Error Handling & Retry Logic](#error-handling--retry-logic)

---

## Overview

Recipe Studio uses Google's Gemini AI for multiple features:
- **Model**: Gemini 1.5 Flash (fast, cost-effective)
- **Cost**: ~$0.001 per recipe generation
- **Rate Limit**: 15 requests/minute (free tier)
- **Fallback**: Regex-based analysis when AI unavailable

---

## Gemini AI Features

### 1. Recipe Generation from Description
**Feature**: AI Assistant in Recipe Creator

**User Input:**
> "A spicy Thai curry with chicken"

**AI Output:**
- Recipe title
- Description
- Ingredients list with quantities
- Step-by-step instructions
- Cook time, prep time, servings
- Category and tags
- **ChefIQ cooking actions** (if applicable)

**Implementation:**
```typescript
const recipe = await generateRecipeFromDescription(
  userDescription,
  remainingGenerations
);
```

**File**: `src/services/gemini.service.ts`

---

### 2. Recipe Parsing from Images (OCR)
**Feature**: Import recipes from photos/screenshots

**Process:**
1. Extract text using Google Cloud Vision API
2. If Vision fails, use Gemini Vision
3. Parse extracted text with Gemini
4. Structure into recipe format

**Implementation:**
```typescript
const recipe = await parseRecipeFromImage(imageUri);
```

**Supported formats:**
- Recipe screenshots
- Printed recipe cards
- Cookbook photos
- Handwritten recipes (limited)

---

### 3. Recipe Parsing from PDFs
**Feature**: Import recipes from PDF documents

**Process:**
1. Extract text from PDF using `react-native-pdf` or similar
2. Send text to Gemini for parsing
3. Analyze cooking actions for ChefIQ compatibility

**Implementation:**
```typescript
const recipe = await parseRecipeFromPDF(pdfText);
```

---

### 4. Website Recipe Import
**Feature**: Scrape and parse recipes from URLs

**Process:**
1. Fetch HTML from recipe website
2. Extract JSON-LD structured data
3. Parse step images from HowToStep format
4. Analyze with Gemini for cooking actions
5. Fall back to regex if Gemini fails

**Implementation:**
```typescript
const recipe = await scrapeRecipeFromURL(url);
```

**Supported sites:**
- Any site with JSON-LD Recipe schema
- Simply Recipes, AllRecipes, Food Network, etc.

---

### 5. My Fridge Recipe Generation
**Feature**: Generate recipes from available ingredients

**User Input:**
- List of ingredients in fridge
- Dietary preferences (vegetarian, vegan, etc.)
- Time constraints
- Difficulty preference

**AI Output:**
- Multiple recipe suggestions (3-5)
- Ingredient match percentage
- Missing ingredients
- Possible substitutions
- ChefIQ cooking actions

**Implementation:**
```typescript
const recipes = await generateMultipleRecipesFromIngredients({
  ingredients,
  numberOfRecipes: RECIPES_PER_GENERATION,
  dietary: preferences.dietary,
  cuisine: preferences.cuisine,
  cookingTime: preferences.cookingTime,
  category: preferences.category,
  matchingStrictness: preferences.matchingStrictness,
  excludeTitles: generatedRecipeTitles,
});
```

---

## Cooking Action Analysis

### Purpose
Automatically detect ChefIQ-compatible cooking methods and generate parameters.

### Detection Process

**1. Text Analysis**
```typescript
const analysis = await analyzeCookingActionsWithGemini(
  title,
  description,
  steps,
  cookTime
);
```

**2. Method Detection**
- Pressure cooking: "pressure cook", "instant pot"
- Baking: "bake", "oven", temperature mentions
- Air frying: "air fry", "air fryer"
- Slow cooking: "slow cook", "simmer"
- Meat probe: "internal temperature", "thermometer"

**3. Parameter Extraction**
- Cooking time (convert to seconds)
- Temperatures (°F)
- Pressure levels (High/Low)
- Probe temperatures (target and remove)

### Key Rules

**Oven Methods Take Priority:**
- If recipe has both searing AND baking, only suggest bake
- Stovetop searing (<5 min) done manually
- Main oven cooking uses ChefIQ MiniOven

**Example:**
```
Step 1: "Sear beef 2 min per side"  → No cooking action (manual)
Step 2: "Bake at 400°F for 30 min" → Bake action attached
```

**Pressure Cooking Detection:**
- Only suggest when EXPLICITLY mentioned
- "Simmer" ≠ pressure cook
- "Cook" ≠ pressure cook
- Must say "pressure cook" or "instant pot"

**Step Indexing:**
- Steps labeled "Step 1", "Step 2" (human-readable)
- stepIndex is 0-indexed (for code)
- "Step 8" → stepIndex: 7

### Combining Consecutive Actions

If multiple consecutive steps use same method, combine into ONE action:

```
Step 1: "Sauté onions 5 minutes"
Step 2: "Add garlic, cook 2 minutes"
Step 3: "Add tomatoes, simmer 15 minutes"

→ ONE Slow Cook action: 22 minutes (5+2+15)
   Attached to stepIndex: 0
```

### Meat Probe Integration

**When to use probe:**
- Recipe mentions internal temperature
- Recipe has "until thermometer reads"
- Cooking meat (beef, pork, chicken, lamb, fish)

**Parameters:**
```json
{
  "target_probe_temp": 165,    // Final doneness temp
  "remove_probe_temp": 160,    // Remove temp (for carryover)
  "target_cavity_temp": 400,   // Oven temperature
  "fan_speed": 1               // 0=Low, 1=Med, 2=High
  // NO cooking_time when using probe
}
```

**Protein Temperatures:**
- Beef rare: 125°F / Medium-rare: 135°F / Medium: 145°F
- Chicken: 165°F
- Pork: 145°F
- Fish: 145°F

---

## Image Recognition (OCR)

### Google Cloud Vision API

**Primary method** for text extraction:

```typescript
const text = await extractTextWithVision(imageUri);
```

**Advantages:**
- Very accurate OCR
- Fast processing
- Handles complex layouts

**Cost:**
- $1.50 per 1,000 images
- First 1,000 images/month FREE

### Gemini Vision (Fallback)

**Fallback method** when Vision API fails:

```typescript
const text = await extractTextWithGemini(imageBase64);
```

**Advantages:**
- Free in Flash model
- Also extracts text structure
- Can understand context

**When used:**
- Vision API returns error
- Vision API quota exceeded
- User preference (future feature)

---

## My Fridge Feature

### Implementation

**1. Ingredient Search:**
Uses Spoonacular API for autocomplete:
```typescript
const results = await searchIngredients(query);
```

**2. Recipe Generation:**
Uses Gemini to generate recipes:
```typescript
const recipes = await generateMultipleRecipesFromIngredients({
  ingredients,
  numberOfRecipes: RECIPES_PER_GENERATION,
  ...preferences,
  excludeTitles: generatedRecipeTitles,
});
```

**3. Ingredient Matching:**
Fuzzy matching algorithm:
```typescript
const match = findBestIngredientMatch(
  userIngredient,
  recipeIngredient
);
```

**Match scoring:**
- Exact match: 100%
- Partial match: 50-90%
- Plural/singular: -5%
- With modifiers: -10%

### Recipe Variety

AI generates diverse recipes:
- Different categories (Main, Side, Dessert)
- Different cooking methods
- Varying difficulty levels
- Different cuisines

### Substitution Suggestions

When ingredients missing:
```json
{
  "missing": "heavy cream",
  "substitutes": [
    "milk + butter",
    "coconut cream",
    "greek yogurt"
  ]
}
```

---

## Prompt Engineering

### Recipe Generation Prompt Structure

**1. Context Setting:**
```
You are a professional chef and recipe developer...
```

**2. User Requirements:**
```
Create a recipe for: {user_description}
```

**3. Output Format:**
```
Return valid JSON with this exact structure:
{
  "title": "...",
  "description": "...",
  "ingredients": [...],
  "steps": [...]
}
```

**4. ChefIQ Integration:**
```
For steps that use pressure cooking, baking, etc.,
include a "cookingAction" object with ChefIQ parameters.
```

**5. Critical Rules:**
- Oven methods take priority over searing
- Only pressure cook when explicitly needed
- Use 0-indexed stepIndex
- Combine consecutive actions

### Cooking Action Analysis Prompt

Located in: `src/services/constants/recipePrompts.ts`

**Key sections:**
1. Available appliances and methods
2. Detection rules (8 critical rules)
3. Parameter formats
4. Examples (8 detailed examples)
5. Important reminders

**Prompt size:** ~4,500 tokens

### Temperature Guide Integration

Automatically suggests probe temperatures based on protein type:

```typescript
const temp = getProteinTemperature(recipeText);
// Returns appropriate temp based on detected protein
```

**Detection:**
- Searches for protein keywords
- Analyzes cooking method
- Suggests doneness level

---

## Error Handling & Retry Logic

### Retry Strategy

**503 Service Unavailable:**
```typescript
- Retry: 2 times
- Wait: 5 seconds between retries
- Exponential backoff
```

**429 Rate Limit:**
```typescript
- Retry: 2 times
- Wait: 3 seconds between retries
- Show user-friendly error if persistent
```

**Other Errors:**
```typescript
- No retry
- Fall back to regex analysis
- Log error for debugging
```

### Fallback Mechanisms

**1. Gemini → Regex:**
If Gemini fails, use regex-based analysis:
```typescript
const analysis = analyzeRecipeForChefIQ(
  title, description, steps, cookTime
);
```

**2. Vision → Gemini Vision:**
If Vision API fails, use Gemini:
```typescript
if (!visionResult) {
  return await extractTextWithGemini(image);
}
```

**3. API → Manual:**
If all AI fails, user can manually add cooking actions

### User Generation Limits

**Free Tier:**
- 5 AI generations per day per user
- Resets at midnight
- Stored in Firestore

**Check before generation:**
```typescript
const canGenerate = await checkUserGenerationLimit(userId);
if (!canGenerate) {
  throw new Error('Daily limit reached');
}
```

**Increment after success:**
```typescript
await incrementUserGenerationCount(userId);
```

---

## Performance Optimizations

### Request Caching

**Website imports:**
```typescript
// Cache Gemini analysis results
const cacheKey = `cooking_action_${recipeTitle}`;
// Cache for 1 hour
```

**My Fridge:**
```typescript
// Cache ingredient autocomplete
const cacheKey = `ingredient_${query}`;
// Cache for 24 hours
```

### Debouncing

**Autocomplete:**
```typescript
const debouncedSearch = debounce(searchIngredients, 500);
// Wait 500ms after typing stops
```

### Request Batching

**Future improvement:**
Batch multiple recipe analyses into single Gemini call

---

## Testing & Validation

### Test Cases

**Recipe Generation:**
- Simple descriptions: "pasta carbonara"
- Complex: "gluten-free vegan Thai curry under 30 minutes"
- Edge cases: very short, very long descriptions

**Cooking Action Detection:**
- Pressure cooking only
- Oven baking only
- Both searing + baking (should suggest bake only)
- No ChefIQ methods (should return empty)

**OCR:**
- Clear printed text
- Handwritten text
- Low quality images
- Multiple recipes on one page

### Validation

**Recipe structure:**
```typescript
if (!recipe.title || recipe.ingredients.length === 0) {
  throw new Error('Invalid recipe');
}
```

**Cooking action validation:**
```typescript
if (!action.applianceId || !action.methodId) {
  throw new Error('Invalid cooking action');
}
```

---

## Future Improvements

### 1. Smart Caching
- Cache common recipe generations
- Share cached recipes between users
- Reduce API costs by 50%

### 2. Batch Processing
- Process multiple recipes in one request
- Reduce overhead
- Faster bulk imports

### 3. Custom Models
- Fine-tune Gemini on ChefIQ recipes
- Improve detection accuracy
- Reduce false positives

### 4. Offline Mode
- Cache generated recipes
- Queue requests for later
- Sync when online

### 5. User Feedback Loop
- Allow users to correct AI suggestions
- Learn from corrections
- Improve over time

---

## Cost Optimization

See [AI_FEATURE_COST_ANALYSIS.md](./AI_FEATURE_COST_ANALYSIS.md) for detailed analysis.

**Quick tips:**
- Use Flash model (not Pro)
- Implement caching
- Debounce autocomplete
- Combine consecutive API calls
- Fall back to regex when possible

**Current cost:** ~$0.001 per recipe generation
**Target:** Stay under free tier limits
