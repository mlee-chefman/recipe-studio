import React from 'react';
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
  aiRecipes: Array<ScrapedRecipe & {
    missingIngredients?: string[];
    substitutions?: Array<{ missing: string; substitutes: string[] }>;
    matchPercentage?: number;
  }>;
  existingRecipes: MatchedRecipe[];
  onSelectRecipe: (recipe: any, source: 'ai' | 'existing') => void;
  onGenerateMore: () => void;
}

export function RecipeResultsModal({
  visible,
  onClose,
  aiRecipes,
  existingRecipes,
  onSelectRecipe,
  onGenerateMore,
}: RecipeResultsModalProps) {
  const styles = useStyles(createStyles);
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = React.useState<'ai' | 'existing'>('ai');

  // Set active tab based on available results when modal opens
  React.useEffect(() => {
    if (visible) {
      if (aiRecipes.length > 0) {
        setActiveTab('ai');
      } else if (existingRecipes.length > 0) {
        setActiveTab('existing');
      }
    }
  }, [visible, aiRecipes.length, existingRecipes.length]);

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
            <Text style={styles.title}>Choose One Recipe to Create</Text>
            <Text style={styles.subtitle}>
              Select a recipe to view details and save to your collection
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Tab Toggle */}
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

        {/* Recipe List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
        >
          {/* AI Generated Recipes */}
          {activeTab === 'ai' && (
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

        {/* Floating Generate More Button */}
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
      maxHeight: '70%',
    },
    scrollViewContent: {
      paddingBottom: 120, // Space for floating button
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
  });
