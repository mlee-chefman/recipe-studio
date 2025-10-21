import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import {
  ServingsPickerModal,
  CookTimePickerModal,
  CategoryPickerModal,
  TagsPickerModal,
  DifficultyPickerModal,
} from '@components/modals';
import { RecipeInfoRow } from '@components/RecipeInfoRow';
import { useRecipeInfoForm } from '@hooks/useRecipeInfoForm';
import { formatCookTime } from '@utils/helpers/recipeHelpers';

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

  const [showCookTimePicker, setShowCookTimePicker] = React.useState(false);
  const [showServingsPicker, setShowServingsPicker] = React.useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);
  const [showDifficultyPicker, setShowDifficultyPicker] = React.useState(false);
  const [showTagsPicker, setShowTagsPicker] = React.useState(false);

  const handleSave = () => {
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

  // Render tags value for RecipeInfoRow
  const renderTagsValue = () => {
    if (formData.tags && formData.tags.length > 0) {
      return (
        <View className="flex-row items-center flex-wrap justify-end gap-1 flex-1" style={styles.tagsContainer}>
          {formData.tags.slice(0, 2).map((tag, index) => (
            <View
              key={index}
              className="px-2 py-1 rounded-full"
              style={styles.tagBadge}
            >
              <Text style={styles.tagText}>
                {tag}
              </Text>
            </View>
          ))}
          {formData.tags.length > 2 && (
            <Text className="text-sm" style={{ color: theme.colors.text.secondary }}>+{formData.tags.length - 2}</Text>
          )}
        </View>
      );
    }
    return <Text className="text-base" style={{ color: theme.colors.text.disabled }}>None</Text>;
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Cook Time */}
      <RecipeInfoRow
        label="Cook Time"
        value={formatCookTime(formData.cookTimeHours, formData.cookTimeMinutes)}
        onPress={() => setShowCookTimePicker(true)}
        testID="cook-time-row"
      />

      {/* Servings */}
      <RecipeInfoRow
        label="Servings"
        value={String(formData.servings)}
        onPress={() => setShowServingsPicker(true)}
        testID="servings-row"
      />

      {/* Category */}
      <RecipeInfoRow
        label="Category"
        value={formData.category || 'Uncategorized'}
        onPress={() => setShowCategoryPicker(true)}
        testID="category-row"
      />

      {/* Difficulty */}
      <RecipeInfoRow
        label="Difficulty"
        value={formData.difficulty}
        onPress={() => setShowDifficultyPicker(true)}
        testID="difficulty-row"
      />

      {/* Tags */}
      <RecipeInfoRow
        label="Tags"
        value={renderTagsValue()}
        onPress={() => setShowTagsPicker(true)}
        testID="tags-row"
      />

      {/* Cook Time Picker Modal */}
      <CookTimePickerModal
        visible={showCookTimePicker}
        hours={formData.cookTimeHours}
        minutes={formData.cookTimeMinutes}
        onHoursChange={setCookTimeHours}
        onMinutesChange={setCookTimeMinutes}
        onClose={() => setShowCookTimePicker(false)}
      />

      {/* Servings Picker Modal */}
      <ServingsPickerModal
        visible={showServingsPicker}
        selectedValue={formData.servings}
        onValueChange={setServings}
        onClose={() => setShowServingsPicker(false)}
      />

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        selectedValue={formData.category}
        onValueChange={setCategory}
        onClose={() => setShowCategoryPicker(false)}
      />

      {/* Difficulty Picker Modal */}
      <DifficultyPickerModal
        visible={showDifficultyPicker}
        selectedValue={formData.difficulty}
        onValueChange={setDifficulty}
        onClose={() => setShowDifficultyPicker(false)}
      />

      {/* Tags Picker Modal */}
      <TagsPickerModal
        visible={showTagsPicker}
        selectedTags={formData.tags || []}
        onToggleTag={toggleTag}
        onAddCustomTag={addCustomTag}
        onClose={() => setShowTagsPicker(false)}
      />
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
  tagsContainer: {
    maxWidth: '70%',
  },
  tagBadge: {
    backgroundColor: theme.colors.primary[100],
  },
  tagText: {
    color: theme.colors.primary[700],
    fontSize: 12,
  },
});
