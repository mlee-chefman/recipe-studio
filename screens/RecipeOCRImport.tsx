import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  TextInput
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { ScrapedRecipe } from '../utils/recipeScraper';
import { recognizeText } from '../utils/googleVisionOCR';
import { parseRecipeWithGemini } from '../utils/geminiRecipeParser';

export default function RecipeOCRImportScreen() {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedRecipe, setParsedRecipe] = useState<ScrapedRecipe | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitle: 'Scan Recipe',
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

  // Fallback parser when Gemini is not available
  const parseRecipeFromText = (text: string, imageUri: string): ScrapedRecipe => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Try to find title (usually first line or largest text)
    const title = lines[0] || 'Untitled Recipe';

    // Find ingredients section
    const ingredientKeywords = ['ingredient', 'ingredients:', 'what you need', 'you will need'];
    const ingredientStartIndex = lines.findIndex(line =>
      ingredientKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );

    // Find instructions section
    const instructionKeywords = ['instruction', 'instructions:', 'direction', 'directions:', 'method', 'steps', 'how to'];
    const instructionStartIndex = lines.findIndex(line =>
      instructionKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );

    let ingredients: string[] = [];
    let instructions: string[] = [];

    if (ingredientStartIndex !== -1) {
      const endIndex = instructionStartIndex !== -1 ? instructionStartIndex : lines.length;
      ingredients = lines
        .slice(ingredientStartIndex + 1, endIndex)
        .filter(line => {
          const trimmed = line.trim();
          // Skip section headers
          return !instructionKeywords.some(keyword => trimmed.toLowerCase().includes(keyword));
        })
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    if (instructionStartIndex !== -1) {
      instructions = lines
        .slice(instructionStartIndex + 1)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // If parsing failed, put all text as instructions
    if (ingredients.length === 0 && instructions.length === 0) {
      instructions = lines.slice(1); // Skip title
    }

    return {
      title,
      description: '',
      ingredients: ingredients.length > 0 ? ingredients : [''],
      instructions: instructions.length > 0 ? instructions : [''],
      cookTime: 30,
      prepTime: 15,
      servings: 4,
      category: '',
      image: imageUri,
    };
  };

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setProcessingStep('Extracting text from image...');

    try {
      // Step 1: Extract text with OCR
      const ocrResult = await recognizeText(uri);

      if (!ocrResult.success) {
        Alert.alert(
          'Text Recognition Failed',
          ocrResult.error || 'Could not extract text from the image. Please try again.'
        );
        setImageUri(null);
        return;
      }

      const text = ocrResult.text;

      if (!text || text.trim().length === 0) {
        Alert.alert(
          'No Text Found',
          'Could not detect any text in the image. Please try with a clearer image.'
        );
        setImageUri(null);
        return;
      }

      setExtractedText(text);
      setImageUri(uri);

      // Step 2: Parse recipe with Gemini AI
      setProcessingStep('Organizing recipe with AI...');
      const parseResult = await parseRecipeWithGemini(text, uri);

      if (!parseResult.success) {
        // If Gemini parsing fails, use fallback parser
        console.warn('Gemini parsing failed:', parseResult.error);
        console.log('Using fallback parser instead...');

        // Show alert only once to inform user
        Alert.alert(
          'AI Parsing Unavailable',
          'Could not parse recipe with AI. Using basic parsing instead. You can edit the recipe after importing if needed.',
          [{ text: 'OK' }]
        );

        // Use fallback parser
        const fallbackRecipe = parseRecipeFromText(text, uri);
        setParsedRecipe(fallbackRecipe);
        return;
      }

      if (parseResult.recipe) {
        setParsedRecipe(parseResult.recipe);
      }

    } catch (error) {
      console.error('Processing Error:', error);
      Alert.alert(
        'Processing Failed',
        'Could not process the image. Please try again with a different image.'
      );
      setImageUri(null);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permissions are required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        // Check if it's an image
        if (result.assets[0].mimeType?.startsWith('image/')) {
          await processImage(uri);
        } else if (result.assets[0].mimeType === 'application/pdf') {
          Alert.alert(
            'PDF Not Supported Yet',
            'PDF text extraction is coming soon. Please use an image file instead.'
          );
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Could not open the file. Please try again.');
    }
  };

  const handleImport = () => {
    if (!extractedText.trim()) {
      Alert.alert('No Text', 'Please scan an image first.');
      return;
    }

    if (!parsedRecipe) {
      Alert.alert('No Recipe', 'Please scan an image first.');
      return;
    }

    // Navigate to recipe creator with parsed recipe
    // Remove this screen from the stack first
    navigation.goBack(); // Remove RecipeOCRImport from stack
    setTimeout(() => {
      (navigation as any).navigate('RecipeCreator', {
        importedRecipe: parsedRecipe,
        fromWebImport: true
      });
    }, 100); // Small delay to ensure goBack completes first
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image Source',
      'Choose where to get the recipe image from',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Browse Files', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        {!imageUri && !isProcessing && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to scan a recipe</Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Take a photo or select an image of your recipe
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  The app will automatically extract the text
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  Review and edit the extracted recipe if needed
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>4</Text>
                <Text style={styles.instructionText}>
                  Import the recipe to your collection
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="contain"
            />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={showImageOptions}
            >
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.processingText}>
              {processingStep || 'Processing...'}
            </Text>
          </View>
        )}

        {/* Extracted Text */}
        {extractedText && !isProcessing && (
          <View style={styles.textContainer}>
            <View style={styles.textHeader}>
              <Text style={styles.textTitle}>Extracted Text</Text>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                <Text style={styles.editButton}>{isEditing ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={extractedText}
                onChangeText={setExtractedText}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <ScrollView style={styles.textDisplay} nestedScrollEnabled>
                <Text style={styles.textContent}>{extractedText}</Text>
              </ScrollView>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {!imageUri && !isProcessing && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={showImageOptions}
          >
            <Text style={styles.primaryButtonText}>Select Image</Text>
          </TouchableOpacity>
        )}

        {extractedText && !isProcessing && (
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImport}
          >
            <Text style={styles.importButtonText}>Import Recipe</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginVertical: theme.spacing.xl,
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
  imageContainer: {
    marginBottom: theme.spacing.lg,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.gray[100],
  },
  changeImageButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  changeImageText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.primary[600],
  },
  processingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  processingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  textContainer: {
    marginBottom: theme.spacing.xl,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  textTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  editButton: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.primary[600],
  },
  textInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 200,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  textDisplay: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  textContent: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  bottomActions: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    backgroundColor: theme.colors.background.primary,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: 'white',
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
