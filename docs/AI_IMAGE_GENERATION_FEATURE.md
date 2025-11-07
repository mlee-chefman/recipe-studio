# AI-Generated Recipe Cover Photos Feature

## Overview

This document describes the AI-generated recipe cover photos feature implemented using Google Imagen 3 through the Gemini API.

## Implementation Summary

### Technology Stack
- **Image Generation**: Google Imagen 3 (via Gemini API)
- **Storage**: Firebase Cloud Storage
- **API**: Simple API key authentication (same as existing Gemini integration)
- **Cost**: $0.03 per generated image

### Key Files Created

1. **`src/services/imageGeneration.service.ts`**
   - Core service for generating images using Imagen 3
   - Prompt engineering function (`buildRecipeImagePrompt`)
   - Image generation and Firebase upload functions
   - Error handling and cost estimation

2. **`src/utils/imageUpload.ts`**
   - Firebase Storage upload utilities
   - Base64 to blob conversion
   - Local image URI upload support

3. **`src/components/ImageGenerationModal.tsx`**
   - User interface for image generation
   - Preview generated images
   - Accept/Regenerate/Discard options
   - Usage limit display
   - Loading and error states

### Files Modified

1. **`src/services/firebase.ts`**
   - Added Firebase Storage initialization

2. **`src/utils/aiUsageTracker.ts`**
   - Extended to track both recipe AND image generations
   - Separate limits: 5 images/day, 30 images/month
   - Functions: `checkImageUsageLimit()`, `recordImageGeneration()`, `getRemainingImageGenerations()`

3. **`src/screens/recipeCreator.tsx`**
   - Added sparkles button next to camera button
   - Integrated ImageGenerationModal
   - Generates temp recipe ID for new recipes

4. **`src/screens/recipeEdit.tsx`**
   - Same integration as recipeCreator
   - Uses existing recipe ID

5. **`.env.example`**
   - Updated documentation to clarify Gemini API key is used for both text and image generation

## User Flow

### Creating/Editing a Recipe

1. User clicks the **sparkles icon** (✨) next to the camera button
2. **Image Generation Modal appears** with:
   - Recipe title and description
   - Cost estimate ($0.03)
   - Remaining daily/monthly usage
3. User clicks **"Generate Image"**
4. **Generation phase** (15-30 seconds):
   - Shows loading spinner
   - Displays status message
5. **Preview phase**:
   - Generated image is displayed
   - Three action buttons:
     - **"Discard"**: Cancel and close modal
     - **"Regenerate"**: Generate another image (uses another credit)
     - **"Use Image"**: Accept and set as recipe cover
6. **Completion**:
   - Image is automatically saved to Firebase Storage
   - Recipe `image` field is updated with Firebase URL
   - Usage counter is incremented

## Prompt Engineering

The `buildRecipeImagePrompt()` function creates professional food photography prompts:

```typescript
"Professional food photography of [title],
featuring [key ingredients],
[cuisine style] style,
[presentation description],
overhead view, natural lighting,
shallow depth of field,
restaurant quality plating"
```

### Prompt Optimization
- Extracts key ingredients (top 5)
- Identifies cuisine style from category/tags
- Adjusts presentation based on category (dessert, breakfast, etc.)
- Adds texture descriptors from description (crispy, creamy, golden)
- Uses negative prompts to avoid unwanted elements

## Usage Limits & Tracking

### Limits (Free Tier)
- **Images**: 5 per day, 30 per month
- **Recipes**: 3 per day, 20 per month (existing)

### Tracking
- Stored in AsyncStorage
- Automatic daily/monthly reset
- Checked before generation
- Displayed in modal UI

### Usage Functions
```typescript
checkImageUsageLimit()      // Check before generation
recordImageGeneration()     // Record after success
getRemainingImageGenerations() // Get counts for UI
```

## Cost Management

### Estimation
```typescript
estimateGenerationCost(sampleCount: number): number
// Returns: sampleCount * 0.03
```

### Display
- Cost shown in modal before generation
- Remaining usage displayed
- Clear error messages when limits reached

## Error Handling

### API Errors
- 429 (Rate Limit): "API rate limit exceeded. Try again later."
- 403 (Auth): "API key invalid or Imagen not enabled."
- 400 (Invalid): "Invalid request. Prompt may need adjustment."

### Usage Errors
- Daily limit: Shows message + remaining monthly count
- Monthly limit: Shows message + reset date
- Generation failures: Display error with retry option

## Firebase Storage Structure

```
/recipe-images/
  /{userId}/
    /{recipeId}/
      /cover.jpg              (primary cover image)
      /generated-{timestamp}.jpg (alternatives)
```

### Permissions
- Users can only write to their own folder (`userId`)
- Public read access for recipe images
- Configured in Firebase Storage Rules

## Integration Points

### Recipe Creator Flow
1. User enters recipe details
2. User can generate cover image anytime
3. Image is linked via temporary recipe ID
4. On save, recipe + image are both persisted

### Recipe Edit Flow
1. Load existing recipe
2. User can replace image with AI generation
3. Uses existing recipe ID
4. Image URL updated in Firestore

## API Configuration

### Environment Variables
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

### API Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={API_KEY}
```

### Request Format
```json
{
  "instances": [{ "prompt": "..." }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "4:3",
    "negativePrompt": "blurry, low quality..."
  }
}
```

### Response Format
```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "..."
    }
  ]
}
```

## Testing Checklist

### Manual Testing
- [ ] Generate image for simple recipe (e.g., "Grilled Cheese")
- [ ] Generate image for complex recipe with many ingredients
- [ ] Test with different categories (dessert, breakfast, dinner)
- [ ] Test with different cuisine tags (Italian, Mexican, Asian)
- [ ] Verify usage limits work (daily and monthly)
- [ ] Test "Regenerate" button
- [ ] Test "Discard" button
- [ ] Test "Use Image" button
- [ ] Verify image appears in recipe after accepting
- [ ] Check Firebase Storage for uploaded images
- [ ] Test error handling (disable API key, etc.)
- [ ] Test loading states during generation
- [ ] Test with slow network connection

### Edge Cases
- [ ] Recipe with no ingredients
- [ ] Recipe with empty title
- [ ] Very long recipe title/description
- [ ] User not authenticated
- [ ] API key missing or invalid
- [ ] Network timeout
- [ ] Firebase Storage upload failure
- [ ] Reaching usage limits

## Future Enhancements

### Potential Improvements
1. **Multiple Image Variants**: Generate 2-4 options at once
2. **Custom Prompts**: Allow users to customize the prompt
3. **Image Editing**: Crop, rotate, adjust brightness
4. **Style Selection**: Choose photography style (overhead, close-up, lifestyle)
5. **Aspect Ratio Selection**: Square, portrait, landscape
6. **Image History**: Save previously generated images
7. **Premium Tier**: Higher limits for paid users
8. **Batch Generation**: Generate images for multiple recipes at once

### Analytics
- Track generation success rate
- Most common recipe categories
- Average generation time
- User satisfaction (accept vs regenerate ratio)

## Troubleshooting

### Common Issues

**Issue**: "API key is invalid or Imagen API is not enabled"
- **Solution**: Verify EXPO_PUBLIC_GEMINI_API_KEY is set correctly
- **Solution**: Ensure billing is enabled in Google Cloud project

**Issue**: "No images generated from Imagen API"
- **Solution**: Check API response format hasn't changed
- **Solution**: Verify model name is still `imagen-3.0-generate-002`

**Issue**: Images not uploading to Firebase Storage
- **Solution**: Check Firebase Storage rules allow write access
- **Solution**: Verify `storageBucket` is set correctly in firebase config

**Issue**: Usage limits not resetting
- **Solution**: Check device date/time settings
- **Solution**: Clear AsyncStorage and try again

## Support & Resources

### Documentation Links
- [Imagen 3 in Gemini API](https://developers.googleblog.com/en/imagen-3-arrives-in-the-gemini-api/)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [Firebase Storage Docs](https://firebase.google.com/docs/storage)

### API References
- Gemini API: `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`
- Model: `imagen-3.0-generate-002`
- Pricing: $0.03 per image (as of 2025)

---

**Implementation Date**: January 2025
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Testing
