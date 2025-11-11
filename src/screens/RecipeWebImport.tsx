import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Keyboard, Animated } from 'react-native';
import { CTAButton } from '@components/CTAButton';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import { RECIPE_DETECTION_SCRIPT, DEBUG_LOGGING_SCRIPT } from '@constants/webViewScripts';
import { isExcludedUrl, formatAndValidateUrl } from '@utils/helpers/urlHelpers';
import { useWebViewImport } from '@hooks/useWebViewImport';

type RecipeWebImportRouteProp = RouteProp<{ RecipeWebImport: { initialUrl?: string } }, 'RecipeWebImport'>;

export default function RecipeWebImportScreen() {
  const styles = useStyles(createStyles);

  const navigation = useNavigation();
  const route = useRoute<RecipeWebImportRouteProp>();
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const isEditingUrlRef = useRef(false);

  const [currentUrl, setCurrentUrl] = useState(route.params?.initialUrl || 'https://duckduckgo.com');
  const [urlInput, setUrlInput] = useState(route.params?.initialUrl || 'https://duckduckgo.com');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  // // Debug log
  // useEffect(() => {
  //   console.log('RecipeWebImport mounted with URL:', currentUrl);
  // }, []);

  // useEffect(() => {
  //   console.log('currentUrl changed to:', currentUrl);
  // }, [currentUrl]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: loadProgress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [loadProgress]);

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
  };

  const handleLoadStart = () => {
    console.log('WebView started loading:', currentUrl);
    setLoadProgress(0.1); // Start with a small progress
  };

  const handleLoadEnd = () => {
    console.log('WebView finished loading:', currentUrl);
    setLoadProgress(1); // Complete the progress
    // Hide progress bar after a short delay
    setTimeout(() => {
      setLoadProgress(0);
    }, 300);
  };

  const handleLoadProgress = ({ nativeEvent }: any) => {
    const progress = nativeEvent.progress;
    // Ensure progress is at least 0.1 when loading starts
    setLoadProgress(Math.max(0.1, progress));
  };

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
      },
      headerTintColor: theme.colors.text.primary,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            paddingLeft: theme.spacing.md,
            paddingRight: theme.spacing.sm,
          }}
        >
          <Feather name="chevron-left" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={styles.headerSearchContainer}>
          <View style={styles.headerInputContainer}>
            <TextInput
              style={styles.headerInput}
              value={urlInput}
              onChangeText={setUrlInput}
              onFocus={() => {
                setIsEditingUrl(true);
                isEditingUrlRef.current = true;
              }}
              onBlur={() => {
                setIsEditingUrl(false);
                isEditingUrlRef.current = false;
              }}
              onSubmitEditing={handleUrlSubmit}
              placeholder="Search or enter URL"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              selectTextOnFocus
            />
            <TouchableOpacity
              onPress={() => webViewRef.current?.reload()}
              style={styles.refreshButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.refreshButtonText}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
      headerTitleContainerStyle: {
        flex: 1,
        paddingHorizontal: 0,
        marginHorizontal: 0,
        left: 0,
        right: 0,
      },
      headerRight: () => <View style={{ width: theme.spacing.md }} />,
    });
  }, [navigation, canGoBack, canGoForward, urlInput]);

  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState.url, 'loading:', navState.loading);

    // Block Google's redirect loop (detected by no_sw_cr parameter)
    if (navState.url && navState.url.includes('no_sw_cr=1')) {
      console.log('Blocking Google redirect loop');
      return;
    }

    // Don't update currentUrl to about:blank
    if (navState.url && navState.url !== 'about:blank') {
      // Only update currentUrl if it's actually different to prevent unnecessary re-renders
      if (navState.url !== currentUrl) {
        setCurrentUrl(navState.url);
        // Only update URL input if not currently editing (use ref for immediate check)
        if (!isEditingUrlRef.current) {
          setUrlInput(navState.url);
        }
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
      isEditingUrlRef.current = false;
      Keyboard.dismiss();
    } else {
      Alert.alert('Invalid URL', 'Please enter a valid URL');
    }
  };


  return (
    <View style={styles.container}>
      {/* WebView */}
      {currentUrl && (
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{ uri: currentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={(request) => {
          // Block Google's redirect loop
          if (request.url.includes('no_sw_cr=1')) {
            console.log('Blocking redirect to:', request.url);
            return false;
          }
          return true;
        }}
        onMessage={handleMessage}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onLoadProgress={handleLoadProgress}
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

      {/* Progress Bar - like modern browsers */}
      {loadProgress > 0 && loadProgress < 1 && (
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNavContainer,
          { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) },
        ]}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          style={[styles.bottomNavButton, !canGoBack && styles.bottomNavButtonDisabled]}>
          <Text style={[styles.bottomNavText, !canGoBack && styles.bottomNavTextDisabled]}>←</Text>
        </TouchableOpacity>

        {/* Import Button */}
        <View style={styles.importButtonContainer}>
          <CTAButton
            onPress={() => handleImport(currentUrl)}
            disabled={!isImportable}
            loading={isImporting}
            text={isImportable ? 'Import Recipe' : 'Browse to a Recipe'}
            loadingText="Importing..."
            fullWidth={true}
          />
        </View>

        {/* Forward Button */}
        <TouchableOpacity
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
          style={[styles.bottomNavButton, !canGoForward && styles.bottomNavButtonDisabled]}>
          <Text style={[styles.bottomNavText, !canGoForward && styles.bottomNavTextDisabled]}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
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
  progressBarContainer: {
    position: 'absolute',
    top: 0, // Position at the very top, right below the header
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: 2,
  },
  // Header search bar styles
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 0,
  },
  headerInputContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    height: 34,
    paddingRight: 4,
  },
  headerInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  refreshButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  // Bottom navigation
  bottomNavContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  bottomNavButton: {
    width: 50,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavButtonDisabled: {
    backgroundColor: theme.colors.gray[50],
  },
  bottomNavText: {
    fontSize: 20,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  bottomNavTextDisabled: {
    color: theme.colors.gray[300],
  },
  importButtonContainer: {
    flex: 1,
  },
});
