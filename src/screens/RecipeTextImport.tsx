import { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';

import { parseMultipleRecipes } from '@services/gemini.service';
import { useRecipeStore } from '@store/store';

import { convertScrapedToRecipe } from '@utils/helpers/recipeConversion';

export default function RecipeTextImportScreen() {
  const styles = useStyles(createStyles);

  const navigation = useNavigation();
  const addRecipe = useRecipeStore((state) => state.addRecipe);
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [recipesFound, setRecipesFound] = useState<number>(0);
  const [totalEstimate, setTotalEstimate] = useState<number>(0);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitle: 'Import from Text',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            paddingLeft: theme.spacing.lg,
            paddingRight: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Feather name="x" size={28} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setImportText(text);
      } else {
        Alert.alert('No Text', 'Clipboard is empty or contains no text.');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Error', 'Could not read from clipboard.');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      Alert.alert('No Text', 'Please paste or enter recipe text first.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Analyzing text...');
    setRecipesFound(0);
    setTotalEstimate(0);
    setProgressPercentage(0);

    try {
      const result = await parseMultipleRecipes(importText, (status, found, estimate) => {
        setProcessingStep(status);
        if (found !== undefined) {
          setRecipesFound(found);
        }
        if (estimate !== undefined && estimate > 0) {
          setTotalEstimate(estimate);
          // Calculate progress percentage (cap at 100%)
          const progress = found !== undefined ? Math.min((found / estimate) * 100, 100) : 0;
          setProgressPercentage(progress);
        }
      });

      if (!result.success || result.recipes.length === 0) {
        Alert.alert(
          'Import Failed',
          result.error || 'Could not find any recipes in the text. Please make sure the text contains recipe information.'
        );
        setIsProcessing(false);
        return;
      }

      // Navigate based on number of recipes found
      if (result.recipes.length === 1) {
        // Single recipe - save directly
        const recipe = convertScrapedToRecipe(result.recipes[0]);
        addRecipe(recipe);

        Alert.alert(
          'Success!',
          'Recipe imported successfully. You can find it in your recipe collection.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('TabNavigator' as any, { screen: 'Home' });
              }
            }
          ]
        );
      } else {
        // Multiple recipes - show selection screen
        navigation.goBack();
        setTimeout(() => {
          (navigation as any).navigate('RecipeSelection', {
            recipes: result.recipes,
            source: 'text'
          });
        }, 100);
      }
    } catch (error) {
      console.error('Text import error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        {!isProcessing && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to import text</Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Copy recipe text from Notes, Messages, or any app
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  Paste it here or type directly
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  AI will automatically detect and parse recipes
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>4</Text>
                <Text style={styles.instructionText}>
                  Works with single recipes or multiple recipes at once
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePasteFromClipboard}
            >
              <Text style={styles.pasteButtonText}>📋 Paste from Clipboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Text Input */}
        {!isProcessing && (
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>Recipe Text</Text>
            <TextInput
              style={styles.textInput}
              value={importText}
              onChangeText={setImportText}
              multiline
              textAlignVertical="top"
              placeholder="Paste or type recipe text here...

Example:
Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup butter
- 1 cup chocolate chips

Instructions:
1. Preheat oven to 350°F
2. Mix ingredients
3. Bake for 12 minutes"
              placeholderTextColor={theme.colors.gray[400]}
            />
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>

            {/* Progress Percentage */}
            <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>

            {/* Status Text */}
            <Text style={styles.processingText}>
              {processingStep || 'Parsing recipes with AI...'}
            </Text>

            {/* Recipe Count */}
            {totalEstimate > 0 && (
              <Text style={styles.recipeCount}>
                {recipesFound > 0
                  ? `Found ${recipesFound} of ~${totalEstimate} recipes`
                  : `Estimated ${totalEstimate} recipes in text`
                }
              </Text>
            )}

            <Text style={styles.processingSubtext}>
              This may take a moment for multiple recipes
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      {!isProcessing && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[
              styles.importButton,
              !importText.trim() && styles.importButtonDisabled
            ]}
            onPress={handleImport}
            disabled={!importText.trim()}
          >
            <Text style={styles.importButtonText}>Parse & Import</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  instructionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  instructionsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  instructionsList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[100],
    color: theme.colors.primary[600],
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    textAlign: 'center',
    lineHeight: 32,
  },
  instructionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  pasteButton: {
    backgroundColor: theme.colors.primary[100],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
  pasteButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  textContainer: {
    marginBottom: theme.spacing.xl,
  },
  textLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 400,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  processingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 300,
    justifyContent: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary[600],
    marginTop: theme.spacing.sm,
  },
  processingText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  recipeCount: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.success.main,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  bottomActions: {
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
    backgroundColor: theme.colors.gray[300],
  },
  importButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: 'white',
  },
});
