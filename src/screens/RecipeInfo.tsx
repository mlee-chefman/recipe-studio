import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { useRecipeInfoForm } from '@hooks/useRecipeInfoForm';
import { DropdownSelector } from '@components/DropdownSelector';
import { RECIPE_OPTIONS } from '@constants/recipeDefaults';
import { haptics } from '@utils/haptics';

type RecipeInfoRouteProp = RouteProp<{
  RecipeInfo: {
    cookTimeHours: number;
    cookTimeMinutes: number;
    servings: number;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
    onUpdate: (data: {
      cookTimeHours?: number;
      cookTimeMinutes?: number;
      servings?: number;
      category?: string;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
      tags?: string[];
    }) => void;
  };
}, 'RecipeInfo'>;

export default function RecipeInfoScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute<RecipeInfoRouteProp>();

  const {
    cookTimeHours: initialCookTimeHours = 0,
    cookTimeMinutes: initialCookTimeMinutes = 30,
    servings: initialServings = 4,
    category: initialCategory = '',
    difficulty: initialDifficulty = 'Medium',
    tags: initialTags = [],
    onUpdate,
  } = route.params || {};

  // Use custom hook for form state management
  const {
    formData,
    setCookTimeHours,
    setCookTimeMinutes,
    setServings,
    setCategory,
    setDifficulty,
    toggleTag,
    addCustomTag,
  } = useRecipeInfoForm({
    cookTimeHours: initialCookTimeHours,
    cookTimeMinutes: initialCookTimeMinutes,
    servings: initialServings,
    category: initialCategory,
    difficulty: initialDifficulty,
    tags: initialTags,
  });

  const [customTagInput, setCustomTagInput] = React.useState('');

  const handleSave = () => {
    haptics.success();
    onUpdate(formData);
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Recipe Info',
      presentation: 'card',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontWeight: theme.typography.fontWeight.semibold as any,
        fontSize: theme.typography.fontSize.xl,
      },
      headerTitleAlign: 'center',
      headerShadowVisible: true,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Feather name="chevron-left" size={28} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerRightButton}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, formData]);

  // Generate dropdown options
  const categoryOptions = [
    { label: 'Uncategorized', value: '' },
    ...RECIPE_OPTIONS.CATEGORIES.map(cat => ({ label: cat, value: cat }))
  ];

  const difficultyOptions = [
    { label: 'Easy', value: 'Easy' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Hard', value: 'Hard' },
  ];

  const servingsOptions = Array.from({ length: RECIPE_OPTIONS.MAX_SERVINGS }, (_, i) => i + 1).map((num) => ({
    label: `${num} serving${num > 1 ? 's' : ''}`,
    value: num
  }));

  // Validation handlers
  const handleHoursChange = (text: string) => {
    const value = text.replace(/[^0-9]/g, ''); // Only allow numbers
    const numValue = parseInt(value || '0');
    if (numValue <= 99) {
      setCookTimeHours(numValue);
    }
  };

  const handleMinutesChange = (text: string) => {
    const value = text.replace(/[^0-9]/g, ''); // Only allow numbers
    const numValue = parseInt(value || '0');
    if (numValue <= 59) {
      setCookTimeMinutes(numValue);
    }
  };

  const incrementServings = () => {
    if (formData.servings < RECIPE_OPTIONS.MAX_SERVINGS) {
      setServings(formData.servings + 1);
    }
  };

  const decrementServings = () => {
    if (formData.servings > 1) {
      setServings(formData.servings - 1);
    }
  };

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      addCustomTag(tag);
      setCustomTagInput('');
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Cook Time */}
      <View style={styles.section}>
        <View style={styles.cookTimeRow}>
          <Text style={styles.cookTimeTitle}>Cook Time</Text>
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>Hours</Text>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  value={formData.cookTimeHours.toString()}
                  onChangeText={handleHoursChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="--"
                  placeholderTextColor={theme.colors.gray[400]}
                />
              </View>
            </View>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>Minutes</Text>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  value={formData.cookTimeMinutes.toString()}
                  onChangeText={handleMinutesChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="--"
                  placeholderTextColor={theme.colors.gray[400]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Servings */}
      <View style={styles.section}>
        <View style={styles.servingsRow}>
          <Text style={styles.sectionTitle}>Servings</Text>
          <View style={styles.servingsContainer}>
            <TouchableOpacity
              style={[styles.servingsButton, formData.servings <= 1 && styles.servingsButtonDisabled]}
              onPress={decrementServings}
              disabled={formData.servings <= 1}
            >
              <Feather name="minus" size={20} color={formData.servings <= 1 ? theme.colors.text.disabled : theme.colors.primary[500]} />
            </TouchableOpacity>
            <Text style={styles.servingsText}>{formData.servings}</Text>
            <TouchableOpacity
              style={[styles.servingsButton, formData.servings >= RECIPE_OPTIONS.MAX_SERVINGS && styles.servingsButtonDisabled]}
              onPress={incrementServings}
              disabled={formData.servings >= RECIPE_OPTIONS.MAX_SERVINGS}
            >
              <Feather name="plus" size={20} color={formData.servings >= RECIPE_OPTIONS.MAX_SERVINGS ? theme.colors.text.disabled : theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <DropdownSelector
          options={categoryOptions}
          selectedValue={formData.category}
          onSelect={(value) => setCategory(value as string)}
          placeholder="Select a category"
        />
      </View>

      {/* Difficulty */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <DropdownSelector
          options={difficultyOptions}
          selectedValue={formData.difficulty}
          onSelect={(value) => setDifficulty(value as 'Easy' | 'Medium' | 'Hard')}
          placeholder="Select difficulty"
        />
      </View>

      {/* Tags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>

        {/* Common Tags */}
        <Text style={styles.subsectionTitle}>Common Tags</Text>
        <View style={styles.tagsGrid}>
          {RECIPE_OPTIONS.COMMON_TAGS.map((tag) => {
            const isSelected = formData.tags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[
                  styles.tagButton,
                  isSelected && styles.tagButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.tagButtonText,
                    isSelected && styles.tagButtonTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Tag Input */}
        <Text style={[styles.subsectionTitle, { marginTop: theme.spacing.lg }]}>Add Custom Tag</Text>
        <View style={styles.customTagRow}>
          <TextInput
            style={styles.customTagInput}
            placeholder="Type tag name and press enter"
            placeholderTextColor={theme.colors.text.disabled}
            value={customTagInput}
            onChangeText={setCustomTagInput}
            onSubmitEditing={handleAddCustomTag}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addTagButton, !customTagInput.trim() && styles.addTagButtonDisabled]}
            onPress={handleAddCustomTag}
            disabled={!customTagInput.trim()}
          >
            <Feather name="plus" size={20} color={customTagInput.trim() ? theme.colors.primary[500] : theme.colors.text.disabled} />
          </TouchableOpacity>
        </View>

        {/* Selected Tags Display */}
        {formData.tags && formData.tags.length > 0 && (
          <View style={{ marginTop: theme.spacing.md }}>
            <Text style={styles.subsectionTitle}>Selected Tags ({formData.tags.length})</Text>
            <View style={styles.selectedTagsContainer}>
              {formData.tags.map((tag, index) => (
                <View key={index} style={styles.selectedTagBadge}>
                  <Text style={styles.selectedTagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => toggleTag(tag)} style={styles.removeTagButton}>
                    <Feather name="x" size={14} color={theme.colors.primary[700]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: 100, // Extra padding for scroll
  },
  headerButton: {
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerRightButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  doneText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  cookTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cookTimeTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: 0,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  timeInputContainer: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  timeInputWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    width: 60,
  },
  timeInput: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    padding: 0,
    width: '100%',
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  servingsButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
  servingsButtonDisabled: {
    backgroundColor: theme.colors.gray[100],
    borderColor: theme.colors.gray[300],
  },
  servingsText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    minWidth: 30,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  tagButtonSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  tagButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  tagButtonTextSelected: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface.primary,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
  addTagButtonDisabled: {
    backgroundColor: theme.colors.gray[100],
    borderColor: theme.colors.gray[300],
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  selectedTagBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedTagText: {
    color: theme.colors.primary[700],
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  removeTagButton: {
    padding: 2,
  },
});
