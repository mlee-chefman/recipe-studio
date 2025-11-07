# Image UX Improvements

## Overview

Improved the recipe cover image user experience in both Create and Edit screens to match the intuitive pattern used in step images.

## Changes Made

### New Component: RecipeCoverImage

**Location**: `src/components/RecipeCoverImage.tsx`

A reusable component following the same UX pattern as StepImage:
- **Tap image** → View full screen preview
- **Tap edit badge** → Show replace/remove options
- Built-in ImagePreviewModal integration
- Configurable sizes (small, medium, large)
- Camera icon placeholder when no image

**Props:**
```typescript
interface RecipeCoverImageProps {
  imageUri?: string;
  onImageChange?: (uri: string | undefined) => void;
  editable?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

### Updated Screens

#### 1. Recipe Creator (`src/screens/recipeCreator.tsx`)
**Before:**
- Complex TouchableOpacity with nested Alert
- Manual image management
- Separate edit badge logic

**After:**
```tsx
<RecipeCoverImage
  imageUri={formData.imageUrl}
  onImageChange={(uri) => updateFormData({ imageUrl: uri || '' })}
  editable={true}
  size="small"
/>
```

#### 2. Recipe Edit (`src/screens/recipeEdit.tsx`)
**Before:**
- Same complex implementation as creator
- Duplicate code

**After:**
```tsx
<RecipeCoverImage
  imageUri={formData.imageUrl}
  onImageChange={(uri) => updateFormData({ imageUrl: uri || '' })}
  editable={true}
  size="small"
/>
```

## User Experience Flow

### With Image Present

1. **Tap on image** → Opens full-screen preview with close button
2. **Tap edit badge** (bottom-right pencil icon) → Shows Alert:
   - **Replace**: Opens camera/gallery picker
   - **Remove**: Removes the image
   - **Cancel**: Dismisses alert

### Without Image

1. **Tap empty placeholder** → Opens camera/gallery picker
2. Dashed border with camera icon indicates tappable area

## Visual Design

### Image Thumbnail
- **Size**: 80x80px (small mode)
- **Border radius**: 8px
- **Border**: 1px solid gray-200
- **Empty state**: Dashed border with camera icon

### Edit Badge
- **Position**: Bottom-right corner (4px offset)
- **Size**: 24x24px
- **Icon**: Feather "edit-2"
- **Color**: Primary 500 with white border
- **Shadow**: Elevated with drop shadow

### Full-Screen Preview
- **Background**: 95% black backdrop
- **Image**: Contained fit, centered
- **Close button**: Top-right, white X on semi-transparent background

## Benefits

✅ **Consistent UX**: Matches step image interaction pattern
✅ **Intuitive**: Tap to view, edit badge for actions
✅ **Clean Code**: Reusable component, no duplicate logic
✅ **Better Visual**: Edit badge more visible than inline button
✅ **Accessibility**: Larger hit area with hitSlop

## Related Components

- `StepImage` (`src/components/StepImage.tsx`) - Similar pattern for step images
- `ImagePreviewModal` (`src/components/ImagePreviewModal.tsx`) - Full-screen image viewer
- `useImagePicker` (`src/hooks/useImagePicker.ts`) - Image selection logic

## Technical Details

### Dependencies
- expo-image: Image component with better caching
- @expo-vector-icons/Feather: Icon library
- useImagePicker: Custom hook for image selection
- ImagePreviewModal: Full-screen preview component

### Size Options
- **small**: 80x80px (used in creator/edit)
- **medium**: 120x120px
- **large**: 160x160px

### Event Handling
- `onImageChange`: Called when image is added, replaced, or removed
- Returns `string` (URI) or `undefined` (removed)
- Parent component handles state updates

## Testing Checklist

- [x] Create new recipe with image
- [x] Tap image to view full screen
- [x] Tap edit badge to show replace/remove options
- [x] Replace existing image
- [x] Remove image
- [x] Add image to empty placeholder
- [x] Edit existing recipe with image
- [x] All interactions work same as step images

## Future Enhancements

### Potential Additions
1. **Long press preview**: Hold to quick-peek without modal
2. **Drag to reorder**: If multiple images supported
3. **Image filters**: Apply filters before saving
4. **Crop editor**: In-place crop without modal

---

**Implementation Date**: January 2025
**Version**: 2.1.0 (Image UX)
**Status**: ✅ Complete and Ready for Testing
