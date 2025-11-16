import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import BaseModal from './BaseModal';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@theme/index';
import { RecipeResultCard } from '../RecipeResultCard';
import { CTAButton } from '../CTAButton';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { MatchedRecipe } from '~/utils/ingredientMatcher';

interface RecipeResultsModalProps {
  visible: boolean;
  onClose: () => void;
  aiRecipes: (ScrapedRecipe & {
    missingIngredients?: string[];
    substitutions?: { missing: string; substitutes: string[] }[];
    matchPercentage?: number;
    courseType?: string;
  })[];
  existingRecipes: MatchedRecipe[];
  onSelectRecipe: (recipe: any, source: 'ai' | 'existing') => void;
  onGenerateMore: () => void;
  onRegenerateCourse?: (courseType: string) => void;
  onSaveMultipleRecipes?: (recipes: any[]) => void;
  isBatchSaving?: boolean;
}

export function RecipeResultsModal({
  visible,
  onClose,
  aiRecipes,
  existingRecipes,
  onSelectRecipe,
  onGenerateMore,
  onRegenerateCourse,
  onSaveMultipleRecipes,
  isBatchSaving = false,
}: RecipeResultsModalProps) {
  const styles = useStyles(createStyles);
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState<'ai' | 'existing'>('ai');
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [regeneratingCourse, setRegeneratingCourse] = useState<string | null>(null);

  // Detect if this is a full course menu (has courseType field or 3 recipes)
  const isFullCourse = aiRecipes.length === 3 && aiRecipes.every((r: any) => r.courseType);

  // Initialize all courses as selected when modal opens for full course
  useEffect(() => {
    if (visible && isFullCourse) {
      setSelectedCourses(new Set([0, 1, 2])); // All 3 courses selected by default
    }
  }, [visible, isFullCourse]);

  // Set active tab based on available results when modal opens
  useEffect(() => {
    if (visible) {
      if (aiRecipes.length > 0) {
        setActiveTab('ai');
      } else if (existingRecipes.length > 0) {
        setActiveTab('existing');
      }
    }
  }, [visible, aiRecipes.length, existingRecipes.length]);

  // Reset regenerating state when recipes change (regeneration complete)
  useEffect(() => {
    setRegeneratingCourse(null);
  }, [aiRecipes]);

  const toggleCourseSelection = (index: number) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCourses(newSelected);
  };

  const handleSaveSelected = () => {
    if (onSaveMultipleRecipes) {
      const selectedRecipes = aiRecipes.filter((_, index) => selectedCourses.has(index));
      onSaveMultipleRecipes(selectedRecipes);
      // Don't close modal here - let the parent handle closing after save completes
    }
  };

  const handleSelectAll = () => {
    if (selectedCourses.size === aiRecipes.length) {
      // Deselect all
      setSelectedCourses(new Set());
    } else {
      // Select all
      setSelectedCourses(new Set([0, 1, 2]));
    }
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
      maxHeight="90%"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {isFullCourse ? 'Your Full Course Menu' : 'Choose One Recipe to Create'}
            </Text>
            <Text style={styles.subtitle}>
              {isFullCourse
                ? 'A complete 3-course meal from your ingredients'
                : 'Select a recipe to view details and save to your collection'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Select All Button for Full Course */}
        {isFullCourse && (
          <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
            <Ionicons
              name={selectedCourses.size === aiRecipes.length ? 'checkbox' : 'square-outline'}
              size={20}
              color={theme.colors.primary.main}
            />
            <Text style={styles.selectAllText}>
              {selectedCourses.size === aiRecipes.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Tab Toggle (only for non-full-course) */}
        {!isFullCourse && (
          <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('ai')}
            style={[
              styles.tab,
              activeTab === 'ai' && { backgroundColor: theme.colors.primary.main },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'ai' && styles.tabTextActive,
              ]}
            >
              AI Generated ({aiRecipes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('existing')}
            style={[
              styles.tab,
              activeTab === 'existing' && { backgroundColor: theme.colors.primary.main },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'existing' && styles.tabTextActive,
              ]}
            >
              Similar Recipes ({existingRecipes.length})
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Recipe List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Full Course Menu Display */}
          {isFullCourse && (
            <View>
              {aiRecipes.map((recipe: any, index) => (
                <View key={`course-${index}`} style={styles.courseSection}>
                  {/* Course Header with Selection and Regenerate */}
                  <View style={styles.courseHeaderRow}>
                    <View style={styles.courseHeaderLeft}>
                      {/* Checkbox */}
                      <TouchableOpacity
                        onPress={() => toggleCourseSelection(index)}
                        style={styles.checkbox}
                      >
                        <Ionicons
                          name={selectedCourses.has(index) ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={selectedCourses.has(index) ? theme.colors.primary.main : theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                      {/* Course Label */}
                      <Text style={styles.courseLabel}>
                        {recipe.courseType === 'appetizer' && '🥗 Appetizer'}
                        {recipe.courseType === 'main' && '🍽️ Main Course'}
                        {recipe.courseType === 'dessert' && '🍰 Dessert'}
                      </Text>
                    </View>
                    {/* Regenerate Button */}
                    {onRegenerateCourse && (
                      <TouchableOpacity
                        onPress={() => {
                          setRegeneratingCourse(recipe.courseType);
                          onRegenerateCourse(recipe.courseType);
                        }}
                        style={styles.regenerateButton}
                        disabled={regeneratingCourse === recipe.courseType}
                      >
                        <Ionicons name="refresh" size={18} color={theme.colors.primary.main} />
                        <Text style={styles.regenerateText}>Regenerate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <RecipeResultCard
                    recipe={recipe}
                    matchPercentage={recipe.matchPercentage}
                    missingIngredients={recipe.missingIngredients}
                    substitutions={recipe.substitutions}
                    onPress={() => {
                      onSelectRecipe(recipe, 'ai');
                      onClose();
                    }}
                    source="ai"
                    isRegenerating={regeneratingCourse === recipe.courseType}
                  />
                </View>
              ))}
            </View>
          )}

          {/* AI Generated Recipes (non-full-course) */}
          {!isFullCourse && activeTab === 'ai' && (
            <View>
              {aiRecipes.length > 0 ? (
                aiRecipes.map((recipe, index) => (
                  <RecipeResultCard
                    key={`ai-${index}`}
                    recipe={recipe}
                    matchPercentage={recipe.matchPercentage}
                    missingIngredients={recipe.missingIngredients}
                    substitutions={recipe.substitutions}
                    onPress={() => {
                      onSelectRecipe(recipe, 'ai');
                      onClose();
                    }}
                    source="ai"
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="sad-outline" size={48} color={theme.colors.text.secondary} />
                  <Text style={styles.emptyText}>
                    No AI recipes generated. Try adjusting your preferences or ingredients.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Existing Recipes */}
          {activeTab === 'existing' && (
            <View>
              {existingRecipes.length > 0 ? (
                existingRecipes.map((matched, index) => (
                  <RecipeResultCard
                    key={`existing-${matched.recipe.id || index}`}
                    recipe={matched.recipe}
                    matchPercentage={matched.matchPercentage}
                    missingIngredients={matched.missingIngredients}
                    onPress={() => {
                      onSelectRecipe(matched, 'existing');
                      onClose();
                    }}
                    source="existing"
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={theme.colors.text.secondary} />
                  <Text style={styles.emptyText}>
                    No similar recipes found in our database.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Floating Buttons */}
        {!isFullCourse ? (
          <View style={styles.floatingButtonContainer}>
            <CTAButton
              onPress={() => {
                onGenerateMore();
                onClose();
              }}
              icon="refresh"
              text="Generate New Ideas"
            />
          </View>
        ) : (
          <View style={styles.floatingButtonContainer}>
            <CTAButton
              onPress={handleSaveSelected}
              disabled={selectedCourses.size === 0}
              loading={isBatchSaving}
              loadingText="Saving recipes..."
              icon="checkmark-circle"
              text={`Save Selected Courses (${selectedCourses.size})`}
            />
          </View>
        )}
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      height: '100%',
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    closeButton: {
      padding: 4,
    },
    selectAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      gap: 8,
      marginBottom: 8,
    },
    selectAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      padding: 4,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
    tabTextActive: {
      color: '#fff',
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 100, // Space for floating button
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      marginTop: 12,
      textAlign: 'center',
    },
    floatingButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 20,
    },
    courseSection: {
      marginBottom: 20,
    },
    courseHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingLeft: 4,
    },
    courseHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    checkbox: {
      marginRight: 8,
      padding: 4,
    },
    courseLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    regenerateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 16,
      gap: 4,
    },
    regenerateText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
  });
