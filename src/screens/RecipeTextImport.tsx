import { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import { useTextImport } from '@hooks/useTextImport';
import { haptics } from '@utils/haptics';

export default function RecipeTextImportScreen() {
  const styles = useStyles(createStyles);
  const navigation = useNavigation();

  const {
    importText,
    setImportText,
    isProcessing,
    processingStep,
    pasteFromClipboard,
    parseAndImport,
  } = useTextImport();

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
          <Feather name="chevron-left" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleImport = async () => {
    const recipe = await parseAndImport({ generateAICover: true });

    // Auto-navigate to RecipeCreator if recipe was successfully parsed
    if (recipe) {
      haptics.success();
      navigation.goBack(); // Remove RecipeTextImport from stack
      setTimeout(() => {
        (navigation as any).navigate('RecipeCreator', {
          importedRecipe: recipe,
          fromWebImport: true
        });
      }, 100);
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
                  AI will parse and generate a cover photo
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>4</Text>
                <Text style={styles.instructionText}>
                  Review and save to your collection
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.pasteButton}
              onPress={pasteFromClipboard}
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
            <Text style={styles.processingText}>
              {processingStep || 'Processing...'}
            </Text>
            <Text style={styles.processingSubtext}>
              This will only take a moment...
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
  processingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  processingSubtext: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
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
