import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Keyboard } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '~/theme';
import { RECIPE_DETECTION_SCRIPT, DEBUG_LOGGING_SCRIPT } from '~/constants/webViewScripts';
import { isExcludedUrl, formatAndValidateUrl } from '~/utils/helpers/urlHelpers';
import { useWebViewImport } from '~/hooks/useWebViewImport';

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
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  // WebView import hook
  const { isImportable, isImporting, handleMessage, handleImport, resetImportable } = useWebViewImport({
    onImportSuccess: (scrapedRecipe) => {
      // Navigate to recipe creator with the scraped data
      navigation.goBack(); // Remove RecipeWebImport from stack
      setTimeout(() => {
        (navigation as any).navigate('RecipeCreator', {
          importedRecipe: scrapedRecipe,
          fromWebImport: true
        });
      }, 100); // Small delay to ensure goBack completes first
    },
  });

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
      resetImportable();
    }
  };

  const handleUrlSubmit = () => {
    const validatedUrl = formatAndValidateUrl(urlInput);

    if (validatedUrl) {
      console.log('Setting URL to:', validatedUrl);
      setCurrentUrl(validatedUrl);
      setIsEditingUrl(false);
      Keyboard.dismiss();
    } else {
      Alert.alert('Invalid URL', 'Please enter a valid URL');
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
        injectedJavaScriptBeforeContentLoaded={DEBUG_LOGGING_SCRIPT}
        injectedJavaScript={RECIPE_DETECTION_SCRIPT}
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
          onPress={() => handleImport(currentUrl)}
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
