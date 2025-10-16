# Recipe Studio Theme System Usage Guide

This guide shows how to use the new theme system for consistent styling across the Recipe Studio app.

## 🎨 Color Palette Overview

Your app uses a beautiful, health-focused color palette based on your main green (#38A865):

### Primary Colors (Green)
- **Light backgrounds**: `theme.colors.primary[50]` - Very light green for backgrounds
- **Main brand color**: `theme.colors.primary[500]` - Your #38A865 green
- **Dark accents**: `theme.colors.primary[700]` - Darker green for text/borders

### Neutral Grays
- **Backgrounds**: `theme.colors.gray[50]` to `theme.colors.gray[200]`
- **Text**: `theme.colors.gray[600]` to `theme.colors.gray[900]`
- **Borders**: `theme.colors.gray[200]` to `theme.colors.gray[300]`

## 📱 How to Use the Theme

### 1. Import the Theme
```typescript
import { theme } from '../theme';
```

### 2. Use Theme Colors
```typescript
// Background colors
style={{ backgroundColor: theme.colors.primary[500] }}
style={{ backgroundColor: theme.colors.background.primary }}

// Text colors
style={{ color: theme.colors.text.primary }}
style={{ color: theme.colors.primary[600] }}

// Border colors
style={{ borderColor: theme.colors.border.main }}
```

### 3. Use Theme Spacing
```typescript
// Padding and margins
style={{
  padding: theme.spacing.lg,          // 16px
  marginBottom: theme.spacing.xl,     // 20px
  marginHorizontal: theme.spacing.md  // 12px
}}
```

### 4. Use Theme Typography
```typescript
// Font sizes
style={{ fontSize: theme.typography.fontSize.lg }}

// Text styles (pre-configured combinations)
style={theme.typography.styles.h2}
style={theme.typography.styles.body}
style={theme.typography.styles.caption}
```

### 5. Use Component Styles
```typescript
// Button styles
style={theme.components.button.primary}
style={theme.components.button.secondary}

// Input styles
style={theme.components.input.default}

// Card styles
style={theme.components.card.elevated}
```

## 🔧 Component Examples

### Themed Button
```tsx
import { ThemedButton } from '../components/ThemedButton';

// Primary button (green background)
<ThemedButton title="Save Recipe" variant="primary" onPress={handleSave} />

// Secondary button (green border, transparent background)
<ThemedButton title="Cancel" variant="secondary" onPress={handleCancel} />

// Selected state
<ThemedButton title="High Pressure" selected={isSelected} onPress={handleSelect} />
```

### Themed Text Input
```tsx
<TextInput
  style={[
    theme.components.input.default,
    isFocused && theme.components.input.focused,
    hasError && theme.components.input.error
  ]}
  placeholder="Recipe title"
  placeholderTextColor={theme.colors.text.tertiary}
/>
```

### Themed Card
```tsx
<View style={theme.components.card.elevated}>
  <Text style={theme.typography.styles.h3}>Recipe Title</Text>
  <Text style={theme.typography.styles.body}>Recipe description...</Text>
</View>
```

### Custom Styled Component
```tsx
const RecipeCard = () => (
  <View style={{
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    ...theme.shadows.sm
  }}>
    <Text style={{
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm
    }}>
      {recipe.title}
    </Text>
  </View>
);
```

## 🎯 Best Practices

### 1. Color Usage
- **Primary green** (`primary[500]`): Main actions, selected states, branding
- **Light green** (`primary[50-200]`): Backgrounds, subtle highlights
- **Dark green** (`primary[600-800]`): Text, icons, borders
- **Gray** (`gray[*]`): Neutral elements, secondary content
- **White** (`background.primary`): Main backgrounds, cards

### 2. Semantic Colors
- **Success**: Use `theme.colors.success.*` for success states
- **Warning**: Use `theme.colors.warning.*` for warnings
- **Error**: Use `theme.colors.error.*` for errors
- **Info**: Use `theme.colors.info.*` for informational content

### 3. Spacing Consistency
- Use the spacing scale: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, etc.
- Prefer multiples of the base unit (4px)
- Use larger spacing for section separation, smaller for related elements

### 4. Typography Hierarchy
- **Headings**: Use `h1`, `h2`, `h3`, `h4` styles
- **Body text**: Use `body` and `bodySmall` styles
- **UI elements**: Use `button`, `buttonSmall` styles
- **Secondary info**: Use `caption` style

## 🔄 Migration from Old Styles

### Replace Hardcoded Colors
```tsx
// ❌ Old way
style={{ backgroundColor: '#38A865' }}
style={{ color: '#007AFF' }}

// ✅ New way
style={{ backgroundColor: theme.colors.primary[500] }}
style={{ color: theme.colors.primary[600] }}
```

### Replace Tailwind Classes with Theme
```tsx
// ❌ Old way
className="bg-blue-500 text-white px-4 py-2 rounded-lg"

// ✅ New way
style={{
  backgroundColor: theme.colors.primary[500],
  color: theme.colors.text.inverse,
  paddingHorizontal: theme.spacing.lg,
  paddingVertical: theme.spacing.md,
  borderRadius: theme.borderRadius.lg
}}
```

### Use Semantic Color Names
```tsx
// ❌ Old way
style={{ backgroundColor: '#ef4444' }}

// ✅ New way
style={{ backgroundColor: theme.colors.error.main }}
```

## 🔮 Advanced Usage

### Dynamic Theme Colors
```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return theme.colors.success.main;
    case 'pending': return theme.colors.warning.main;
    case 'error': return theme.colors.error.main;
    default: return theme.colors.gray[500];
  }
};
```

### Responsive Spacing
```tsx
const getSpacing = (size: 'small' | 'medium' | 'large') => {
  const spacingMap = {
    small: theme.spacing.sm,
    medium: theme.spacing.md,
    large: theme.spacing.lg
  };
  return spacingMap[size];
};
```

### Theme-based Variants
```tsx
const buttonVariants = {
  primary: {
    backgroundColor: theme.colors.primary[500],
    color: theme.colors.text.inverse
  },
  secondary: {
    backgroundColor: 'transparent',
    color: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
    borderWidth: 1
  },
  ghost: {
    backgroundColor: theme.colors.gray[100],
    color: theme.colors.text.secondary
  }
};
```

## 🎨 Color Psychology

Your green-based palette conveys:
- **Health & Wellness**: Perfect for a recipe/food app
- **Natural & Fresh**: Appeals to healthy eating
- **Growth & Vitality**: Encouraging and positive
- **Trust & Stability**: Professional and reliable

The complementary grays provide:
- **Clean & Minimal**: Modern app aesthetic
- **Professional**: Business-like reliability
- **Focus**: Doesn't distract from content

## 📚 Quick Reference

### Most Used Colors
- Primary green: `theme.colors.primary[500]`
- Light background: `theme.colors.background.secondary`
- Text: `theme.colors.text.primary`
- Secondary text: `theme.colors.text.secondary`
- Border: `theme.colors.border.main`

### Most Used Spacing
- Small gap: `theme.spacing.sm` (8px)
- Medium gap: `theme.spacing.md` (12px)
- Large gap: `theme.spacing.lg` (16px)
- Section spacing: `theme.spacing.xl` (20px)

### Most Used Font Sizes
- Body text: `theme.typography.fontSize.base` (16px)
- Small text: `theme.typography.fontSize.sm` (14px)
- Headings: `theme.typography.fontSize.xl` (20px)

Start using these theme values throughout your app for a consistent, professional, and beautiful design! 🎨✨