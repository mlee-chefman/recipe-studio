import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '~/theme';
import { ScrapedRecipe } from '~/utils/recipeScraper';
import { parseMultipleRecipes } from '~/services/gemini.service';
import { extractTextFromPDF } from '~/utils/pdfExtractor';
import { useRecipeStore, Recipe } from '~/store/store';
import { convertScrapedToRecipe } from '~/utils/helpers/recipeConversion';
import { IMPORT_MESSAGES, IMPORT_ERRORS, IMPORT_SUCCESS, IMPORT_ALERTS, IMPORT_BUTTONS } from '~/constants/importMessages';

export default function RecipePDFImportScreen() {
  const navigation = useNavigation();
  const addRecipe = useRecipeStore((state) => state.addRecipe);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitle: 'Import from PDF',
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

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile({
          name: result.assets[0].name,
          uri: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(IMPORT_ALERTS.ERROR, 'Could not open file picker. Please try again.');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      Alert.alert(IMPORT_ALERTS.NO_FILE, IMPORT_ERRORS.NO_FILE);
      return;
    }

    setIsProcessing(true);
    setProcessingStep(IMPORT_MESSAGES.PDF.EXTRACTING);

    try {
      // Step 1: Extract text from PDF
      const textResult = await extractTextFromPDF(selectedFile.uri);

      if (!textResult.success || !textResult.text) {
        Alert.alert(
          IMPORT_ALERTS.EXTRACTION_FAILED,
          textResult.error || IMPORT_ERRORS.TEXT_EXTRACTION_FAILED
        );
        setIsProcessing(false);
        return;
      }

      // Step 2: Parse recipes from extracted text
      setProcessingStep(IMPORT_MESSAGES.PDF.PARSING);
      const parseResult = await parseMultipleRecipes(textResult.text);

      if (!parseResult.success || parseResult.recipes.length === 0) {
        Alert.alert(
          IMPORT_ALERTS.NO_RECIPES,
          parseResult.error || IMPORT_ERRORS.NO_RECIPES_FOUND
        );
        setIsProcessing(false);
        return;
      }

      // Navigate based on number of recipes found
      if (parseResult.recipes.length === 1) {
        // Single recipe - save directly
        const recipe = convertScrapedToRecipe(parseResult.recipes[0]);
        addRecipe(recipe);

        Alert.alert(
          IMPORT_ALERTS.SUCCESS,
          IMPORT_SUCCESS.SINGLE_RECIPE,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('TabNavigator' as any, { screen: 'One' });
              }
            }
          ]
        );
      } else {
        // Multiple recipes - show selection screen
        navigation.goBack();
        setTimeout(() => {
          (navigation as any).navigate('RecipeSelection', {
            recipes: parseResult.recipes,
            source: 'pdf',
            filename: selectedFile.name,
          });
        }, 100);
      }
    } catch (error) {
      console.error('PDF import error:', error);
      Alert.alert(IMPORT_ALERTS.ERROR, IMPORT_ERRORS.UNEXPECTED_ERROR);
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
            <Text style={styles.instructionsTitle}>Import PDF Cookbook</Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Select a PDF file containing recipe(s)
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  AI will extract text from the PDF
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  Automatically detect all recipes in the document
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>4</Text>
                <Text style={styles.instructionText}>
                  Choose which recipes to import
                </Text>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>📝 Works with:</Text>
              <Text style={styles.noticeText}>
                • Digital cookbooks (PDF format)
              </Text>
              <Text style={styles.noticeText}>
                • Scanned recipe collections
              </Text>
              <Text style={styles.noticeText}>
                • Multiple recipes in one document
              </Text>
            </View>
          </View>
        )}

        {/* File Selection */}
        {!isProcessing && (
          <View style={styles.fileContainer}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={pickPDF}
            >
              <Text style={styles.selectButtonIcon}>📄</Text>
              <Text style={styles.selectButtonText}>
                {selectedFile ? IMPORT_BUTTONS.CHANGE_PDF : IMPORT_BUTTONS.SELECT_PDF}
              </Text>
            </TouchableOpacity>

            {selectedFile && (
              <View style={styles.selectedFileCard}>
                <View style={styles.fileIcon}>
                  <Text style={styles.fileIconText}>📄</Text>
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileLabel}>Ready to import</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.processingText}>
              {processingStep || IMPORT_MESSAGES.PDF.PROCESSING}
            </Text>
            <Text style={styles.processingSubtext}>
              {IMPORT_MESSAGES.PDF.PROCESSING_LONG}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      {!isProcessing && selectedFile && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImport}
          >
            <Text style={styles.importButtonText}>{IMPORT_BUTTONS.EXTRACT_IMPORT}</Text>
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
  noticeBox: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  noticeTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.xs,
  },
  noticeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  fileContainer: {
    marginBottom: theme.spacing.xl,
  },
  selectButton: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  selectButtonIcon: {
    fontSize: 24,
  },
  selectButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: 'white',
  },
  selectedFileCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success.light,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.success.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIconText: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  fileLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success.main,
  },
  processingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 300,
    justifyContent: 'center',
  },
  processingText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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
  importButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: 'white',
  },
});
