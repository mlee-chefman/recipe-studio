import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '@theme/index';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { useRecipeStore, Recipe } from '@store/store';
import { convertScrapedToRecipe } from '@utils/helpers/recipeConversion';

type RecipeSelectionRouteProp = RouteProp<{
  RecipeSelection: {
    recipes: ScrapedRecipe[];
    source: 'pdf' | 'text';
    filename?: string;
  };
}, 'RecipeSelection'>;

export default function RecipeSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute<RecipeSelectionRouteProp>();
  const { recipes = [], source, filename } = route.params || {};
  const addRecipe = useRecipeStore((state) => state.addRecipe);

  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitle: 'Select Recipes',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingLeft: theme.spacing.md, paddingRight: theme.spacing.xs }}
        >
          <Text style={{
            color: theme.colors.info.main,
            fontSize: 24,
            fontWeight: '300'
          }}>×</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const toggleRecipe = (index: number) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRecipes(newSelected);
  };

  const selectAll = () => {
    const allIndices = new Set(recipes.map((_, idx) => idx));
    setSelectedRecipes(allIndices);
  };

  const deselectAll = () => {
    setSelectedRecipes(new Set());
  };

  const handleImport = async () => {
    if (selectedRecipes.size === 0) {
      Alert.alert('No Selection', 'Please select at least one recipe to import.');
      return;
    }

    setIsImporting(true);

    try {
      // Get selected recipes
      const recipesToImport = Array.from(selectedRecipes)
        .sort((a, b) => a - b)
        .map(idx => recipes[idx]);

      // Save each recipe directly to the store
      recipesToImport.forEach((scrapedRecipe) => {
        const recipe = convertScrapedToRecipe(scrapedRecipe);
        addRecipe(recipe);
      });

      // Show success message
      const count = recipesToImport.length;
      Alert.alert(
        'Success!',
        `${count} recipe${count > 1 ? 's' : ''} imported successfully. You can find ${count > 1 ? 'them' : 'it'} in your recipe collection.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to home screen (Recipes tab)
              navigation.navigate('TabNavigator' as any, { screen: 'One' });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import recipes. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const renderRecipeCard = ({ item, index }: { item: ScrapedRecipe; index: number }) => {
    const isSelected = selectedRecipes.has(index);

    return (
      <TouchableOpacity
        style={[
          styles.recipeCard,
          isSelected && styles.recipeCardSelected,
        ]}
        onPress={() => toggleRecipe(index)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>

        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle}>{item.title}</Text>

          <View style={styles.recipeMetadata}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>🥘</Text>
              <Text style={styles.metadataText}>
                {item.ingredients.length} ingredient{item.ingredients.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>📝</Text>
              <Text style={styles.metadataText}>
                {item.instructions.length} step{item.instructions.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>⏱️</Text>
              <Text style={styles.metadataText}>{item.cookTime}min</Text>
            </View>
          </View>

          {item.description && (
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>
        Found {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''}
      </Text>

      {filename && (
        <Text style={styles.subtitle}>from {filename}</Text>
      )}

      <Text style={styles.description}>
        Select the recipes you want to import. Each will open in the recipe creator for review.
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={deselectAll} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Deselect All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectionCount}>
        <Text style={styles.selectionCountText}>
          {selectedRecipes.size} of {recipes.length} selected
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item, index) => `recipe-${index}-${item.title}`}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {selectedRecipes.size > 0 && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.importButton, isImporting && styles.importButtonDisabled]}
            onPress={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <View style={styles.importingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.importButtonText}>Importing...</Text>
              </View>
            ) : (
              <Text style={styles.importButtonText}>
                Import {selectedRecipes.size} Recipe{selectedRecipes.size !== 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.primary[600],
  },
  selectionCount: {
    backgroundColor: theme.colors.primary[50],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  selectionCountText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  recipeCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
  },
  recipeCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  checkboxContainer: {
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recipeMetadata: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataIcon: {
    fontSize: 14,
  },
  metadataText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  recipeDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary[100],
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.primary[700],
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    backgroundColor: theme.colors.background.primary,
  },
  importButton: {
    backgroundColor: theme.colors.success.main,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  importButtonDisabled: {
    backgroundColor: theme.colors.gray[400],
    opacity: 0.7,
  },
  importingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  importButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: 'white',
  },
});
