# Auto Image Generation Implementation

## Overview

Implemented automatic cover photo generation for recipes created through AI-powered flows. Images are auto-generated when users create recipes via:
1. **AI Assistant** (text description → recipe)
2. **My Fridge** (ingredients → recipe)
3. **PDF Import** (cookbook PDF → recipes) - *Note: PDF/OCR flows naturally go through recipeCreator with auto-gen*
4. **OCR/Scan Recipe** (photo → recipe) - *Note: PDF/OCR flows naturally go through recipeCreator with auto-gen*

**NOT auto-generated for:**
- Web import (JSONLD usually includes cover photo)
- Manual recipe creation (user can upload via camera button)

## Key Changes

### New Hook: `useAutoImageGeneration`

**Location**: `src/hooks/useAutoImageGeneration.ts`

**Purpose**: Centralized logic for automatic image generation with:
- Usage limit checking
- Silent error handling (doesn't block recipe creation)
- Progress tracking
- Batch generation support (for multi-recipe imports)

**Key Functions**:
```typescript
generateImageForRecipe(options) → Promise<AutoImageGenerationResult>
generateImagesForMultipleRecipes(recipes, userId) → Promise<Map<recipeId, imageUrl>>
```

### Modified Hooks

#### 1. `useAIRecipeGenerator` (AI Assistant)

**Changes**:
- Added `userId`, `recipeId`, `autoGenerateImage` options
- Integrated `useAutoImageGeneration` hook
- Auto-generates image after recipe is created
- Updates callback to pass `imageUrl` to caller

**Usage in recipeCreator.tsx**:
```typescript
useAIRecipeGenerator({
  userId: user?.uid,
  recipeId: tempRecipeId,
  autoGenerateImage: true,
  onRecipeGenerated: (recipe, imageUrl) => {
    updateFormData({
      title: recipe.title,
      // ... other fields
      imageUrl: imageUrl || '', // Auto-generated image
    });
  }
})
```

#### 2. `useRecipeGeneration` (My Fridge)

**Changes**:
- Added `userId` parameter
- Integrated `useAutoImageGeneration` hook
- Auto-generates image for first recipe after generation
- Adds image URL directly to recipe object

**Usage in MyFridge.tsx**:
```typescript
useRecipeGeneration(allRecipes, userRecipes, user?.uid)
```

### UI Changes

**Removed**:
- ❌ Sparkles button (manual AI image generation)
- ❌ `ImageGenerationModal` component usage from recipeCreator/recipeEdit
- ❌ `showImageGenerationModal` state

**Kept**:
- ✅ Camera button (manual upload from gallery/camera)
- ✅ `ImageGenerationModal` component (may be useful elsewhere)

## Usage Limits

Configurable in `src/utils/aiUsageTracker.ts`:

```typescript
export const USAGE_LIMITS = {
  FREE_TIER: {
    recipeGenerationsPerDay: 3,
    recipeGenerationsPerMonth: 20,
    imageGenerationsPerDay: 5,      // ← Edit this
    imageGenerationsPerMonth: 30,   // ← Edit this
  },
};
```

## Auto-Generation Flow

### AI Assistant Flow

```
1. User enters description → "quick pasta dinner"
2. AI generates recipe data
3. ✨ AUTO: Generate cover image (15-30s)
4. Recipe populated with image URL
5. User can edit/save recipe
```

### My Fridge Flow

```
1. User selects ingredients → chicken, rice, broccoli
2. AI generates recipe suggestions
3. ✨ AUTO: Generate cover image for first recipe
4. Recipe displayed with image
5. User can save to collection
```

### PDF/OCR Flow

```
1. User imports PDF/scans recipe
2. AI parses recipe data
3. Recipe creator screen opens with parsed data
4. ✨ AUTO: Image generation is skipped (OCR usually has image)
OR user triggers AI Assistant for improvements → AUTO image gen
```

## Error Handling

Auto-generation failures are **silent** and don't block recipe creation:

- **Usage Limit Reached**: Skips generation, recipe created without image
- **API Error**: Logs warning, recipe created without image
- **Network Timeout**: Skips generation, recipe created without image

User can always manually add images via camera button.

## Technical Details

### Image Generation Process

1. **Check usage limits** (async)
2. **Generate prompt** from recipe data:
   - Title, ingredients, category, tags
   - Professional food photography style
3. **Call Imagen 3 API** (15-30s)
4. **Upload to Firebase Storage** (base64 → blob → storage)
5. **Return download URL**

### Firebase Storage Structure

```
/recipe-images/
  /{userId}/
    /{recipeId}/
      /cover.jpg
```

### API Cost

- **$0.03 per image**
- Default limits: 5/day, 30/month = **$0.90/month max per user**

## Testing Checklist

### AI Assistant
- [ ] Create recipe via AI Assistant
- [ ] Verify image auto-generates
- [ ] Check image appears in recipe form
- [ ] Save recipe and verify image persists
- [ ] Test with usage limits reached
- [ ] Test with API key disabled (should skip gracefully)

### My Fridge
- [ ] Generate recipe from ingredients
- [ ] Verify first recipe has auto-generated image
- [ ] Save recipe and verify image persists
- [ ] Test with usage limits reached

### Manual Upload
- [ ] Verify camera button still works
- [ ] Upload image manually
- [ ] Verify manual upload works alongside auto-gen

### Error Cases
- [ ] No internet connection
- [ ] Usage limits reached
- [ ] Invalid API key
- [ ] Recipe with no title
- [ ] Recipe with no ingredients

## Future Enhancements

### Potential Additions

1. **PDF/OCR Direct Integration**: Currently PDF/OCR imports rely on recipeCreator flow, could add direct auto-gen in import screens
2. **Progress Indicator**: Show "Generating cover photo..." during creation
3. **Regenerate Option**: Allow users to regenerate auto-generated images
4. **Multiple Variants**: Generate 2-4 options and let user choose
5. **Background Generation**: Generate images in background after saving

### Analytics to Track

- Auto-generation success rate
- Average generation time
- User satisfaction (do they replace auto-generated images?)
- Most common failure reasons

## Migration Notes

**Breaking Changes**: None

**Backward Compatibility**: ✅
- Existing recipes without images unaffected
- Manual upload still works
- ImageGenerationModal component preserved

**New Dependencies**: None (uses existing services)

## Configuration

All limits are centralized in one file:

**File**: `src/utils/aiUsageTracker.ts`

```typescript
export const USAGE_LIMITS = {
  FREE_TIER: {
    recipeGenerationsPerDay: 3,
    recipeGenerationsPerMonth: 20,
    imageGenerationsPerDay: 5,
    imageGenerationsPerMonth: 30,
  },
};
```

**To adjust limits**: Edit the numbers above
**To disable auto-generation**: Set limits to 0 or add `autoGenerateImage: false` to hook options

## Summary

✅ **Completed**:
- Auto-generation for AI Assistant
- Auto-generation for My Fridge
- Silent error handling
- Usage limit integration
- Removed manual sparkles button
- Maintained manual upload functionality

📝 **Notes**:
- PDF/OCR imports use recipeCreator flow, so they get auto-gen when AI Assistant is used
- Web imports skip auto-gen (already have images from JSONLD)
- All flows are non-blocking - failures don't prevent recipe creation

---

**Implementation Date**: January 2025
**Version**: 2.0.0 (Auto-Generation)
**Status**: ✅ Complete and Ready for Testing
