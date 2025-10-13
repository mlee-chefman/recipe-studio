import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Keyboard } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { scrapeRecipe } from '../utils/recipeScraper';

type RecipeWebImportRouteProp = RouteProp<{ RecipeWebImport: { initialUrl?: string } }, 'RecipeWebImport'>;

export default function RecipeWebImportScreen() {
  const navigation = useNavigation();
  const route = useRoute<RecipeWebImportRouteProp>();
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  const [currentUrl, setCurrentUrl] = useState(route.params?.initialUrl || 'https://www.google.com');
  const [urlInput, setUrlInput] = useState(route.params?.initialUrl || 'https://www.google.com');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportable, setIsImportable] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  // Debug log
  useEffect(() => {
    console.log('RecipeWebImport mounted with URL:', currentUrl);
  }, []);

  useEffect(() => {
    console.log('currentUrl changed to:', currentUrl);
  }, [currentUrl]);

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
  };

  const handleLoadStart = () => {
    console.log('WebView started loading:', currentUrl);
  };

  const handleLoadEnd = () => {
    console.log('WebView finished loading:', currentUrl);
  };

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
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
      headerTitle: '',
      headerRight: () => null,
    });
  }, [navigation]);

  // Check if URL should be excluded (search engines, social media)
  const isExcludedUrl = (url: string) => {
    const excludedPatterns = [
      /google\.com\/search/i,
      /youtube\.com/i,
      /facebook\.com/i,
      /twitter\.com/i,
      /instagram\.com/i,
      /pinterest\.com/i,
      /reddit\.com/i,
    ];
    return excludedPatterns.some(pattern => pattern.test(url));
  };

  // Inject JavaScript to detect JSON-LD recipe data
  const injectedJavaScript = `
    (function() {
      function checkForRecipe() {
        try {
          // Look for JSON-LD recipe data
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          let hasRecipe = false;
          let recipeDetails = null;

          for (let script of scripts) {
            try {
              const data = JSON.parse(script.textContent);

              // Check if it's directly a Recipe type
              if (data['@type'] === 'Recipe' ||
                  (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
                hasRecipe = true;
                recipeDetails = {
                  title: data.name || null,
                  hasIngredients: Array.isArray(data.recipeIngredient) && data.recipeIngredient.length > 0,
                  hasInstructions: !!data.recipeInstructions
                };
                break;
              }

              // Check if it's in @graph array
              if (data['@graph'] && Array.isArray(data['@graph'])) {
                const recipeData = data['@graph'].find(item =>
                  item['@type'] === 'Recipe' ||
                  (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
                );
                if (recipeData) {
                  hasRecipe = true;
                  recipeDetails = {
                    title: recipeData.name || null,
                    hasIngredients: Array.isArray(recipeData.recipeIngredient) && recipeData.recipeIngredient.length > 0,
                    hasInstructions: !!recipeData.recipeInstructions
                  };
                  break;
                }
              }

              // Check if data itself is an array
              if (Array.isArray(data)) {
                const recipeData = data.find(item =>
                  item['@type'] === 'Recipe' ||
                  (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
                );
                if (recipeData) {
                  hasRecipe = true;
                  recipeDetails = {
                    title: recipeData.name || null,
                    hasIngredients: Array.isArray(recipeData.recipeIngredient) && recipeData.recipeIngredient.length > 0,
                    hasInstructions: !!recipeData.recipeInstructions
                  };
                  break;
                }
              }
            } catch (e) {
              // Ignore individual parsing errors
              console.log('Error parsing JSON-LD:', e);
            }
          }

          // Also check for common recipe microdata or schema.org markup as fallback
          if (!hasRecipe) {
            const microdataElement = document.querySelector('[itemtype*="schema.org/Recipe"]');
            if (microdataElement) {
              hasRecipe = true;
              recipeDetails = {
                title: microdataElement.querySelector('[itemprop="name"]')?.textContent || null,
                hasIngredients: !!microdataElement.querySelector('[itemprop="recipeIngredient"]'),
                hasInstructions: !!microdataElement.querySelector('[itemprop="recipeInstructions"]')
              };
            }
          }

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'recipeDetection',
            hasRecipe: hasRecipe,
            recipeDetails: recipeDetails,
            url: window.location.href
          }));
        } catch (error) {
          console.log('Error in checkForRecipe:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'recipeDetection',
            hasRecipe: false,
            url: window.location.href
          }));
        }
      }

      // Check on load
      if (document.readyState === 'complete') {
        checkForRecipe();
      } else {
        window.addEventListener('load', checkForRecipe);
      }

      // Re-check after delays for SPAs and dynamic content
      setTimeout(checkForRecipe, 1000);
      setTimeout(checkForRecipe, 2500);
    })();
    true;
  `;

  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState.url, 'loading:', navState.loading);

    // Don't update currentUrl to about:blank
    if (navState.url && navState.url !== 'about:blank') {
      setCurrentUrl(navState.url);
      // Update URL input if not currently editing
      if (!isEditingUrl) {
        setUrlInput(navState.url);
      }
    }

    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsLoading(navState.loading);

    // Reset importable state when navigating to a new page or on excluded URLs
    // JavaScript detection will set it to true if a recipe is found
    if (isExcludedUrl(navState.url) || navState.loading) {
      setIsImportable(false);
    }
  };

  const handleUrlSubmit = () => {
    let url = urlInput.trim();

    // If no protocol, assume https
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Validate URL
    try {
      new URL(url);
      console.log('Setting URL to:', url);
      setCurrentUrl(url);
      setIsEditingUrl(false);
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Invalid URL', 'Please enter a valid URL');
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'recipeDetection') {
        // Only mark as importable if we actually found Recipe structured data
        // and the URL is not excluded
        const shouldBeImportable = data.hasRecipe && !isExcludedUrl(data.url);

        setIsImportable(shouldBeImportable);

        // Log for debugging
        if (data.hasRecipe && data.recipeDetails) {
          console.log('Recipe detected:', {
            url: data.url,
            title: data.recipeDetails.title,
            hasIngredients: data.recipeDetails.hasIngredients,
            hasInstructions: data.recipeDetails.hasInstructions,
          });
        }
      }
    } catch (e) {
      // Ignore non-JSON messages
      console.log('Error parsing WebView message:', e);
    }
  };

  const handleImport = async () => {
    if (!currentUrl || !isImportable) return;

    setIsImporting(true);

    try {
      const scrapedRecipe = await scrapeRecipe(currentUrl);

      // Navigate to recipe creator with the scraped data
      // Use replace to remove this screen from the stack
      navigation.goBack(); // Remove RecipeWebImport from stack
      setTimeout(() => {
        (navigation as any).navigate('RecipeCreator', {
          importedRecipe: scrapedRecipe,
          fromWebImport: true
        });
      }, 100); // Small delay to ensure goBack completes first

    } catch (error) {
      Alert.alert(
        'Import Failed',
        'Could not import recipe from this page. Please try a different recipe or enter it manually.',
        [{ text: 'OK' }]
      );
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          style={[styles.navIconButton, !canGoBack && styles.navIconButtonDisabled]}>
          <Text style={[styles.navIconText, !canGoBack && styles.navIconTextDisabled]}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
          style={[styles.navIconButton, !canGoForward && styles.navIconButtonDisabled]}>
          <Text style={[styles.navIconText, !canGoForward && styles.navIconTextDisabled]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => webViewRef.current?.reload()} style={styles.navIconButton}>
          <Text style={styles.navIconText}>↻</Text>
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            value={urlInput}
            onChangeText={setUrlInput}
            onFocus={() => setIsEditingUrl(true)}
            onBlur={() => setIsEditingUrl(false)}
            onSubmitEditing={handleUrlSubmit}
            placeholder="Search or enter URL"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
          />
        </View>

        <TouchableOpacity onPress={handleUrlSubmit} style={styles.goButton}>
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      {currentUrl && (
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{ uri: currentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('HTTP error:', nativeEvent);
        }}
        injectedJavaScriptBeforeContentLoaded={`
          console.log('WebView injected JavaScript running');
          true;
        `}
        injectedJavaScript={injectedJavaScript}
        style={styles.webview}
        startInLoadingState={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        mixedContentMode="always"
      />
      )}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={{ marginTop: 10, color: theme.colors.text.secondary }}>
            Loading {currentUrl}...
          </Text>
        </View>
      )}

      {/* Floating Import Button */}
      <View
        style={[
          styles.floatingButtonContainer,
          { bottom: Math.max(insets.bottom + theme.spacing.lg, theme.spacing.xl) },
        ]}>
        <TouchableOpacity
          onPress={handleImport}
          disabled={!isImportable || isImporting}
          style={[styles.importButton, !isImportable && styles.importButtonDisabled]}
          activeOpacity={0.8}>
          {isImporting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.importButtonText}>
              {isImportable ? 'Import Recipe' : 'Browse to a Recipe'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    // backgroundColor: 'white',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    gap: theme.spacing.xs,
  },
  navIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconButtonDisabled: {
    backgroundColor: theme.colors.gray[50],
  },
  navIconText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  navIconTextDisabled: {
    color: theme.colors.gray[300],
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    height: 36,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  goButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
  },
  goButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  floatingButtonContainer: {
    position: 'absolute',
    // bottom is set dynamically with safe area insets
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  importButtonDisabled: {
    backgroundColor: theme.colors.gray[400],
  },
  importButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
  },
});
