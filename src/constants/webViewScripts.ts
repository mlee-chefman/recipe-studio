/**
 * WebView injected JavaScript scripts for recipe detection
 */

/**
 * JavaScript code to detect recipe structured data on web pages
 * Looks for JSON-LD Recipe schema and microdata markup
 */
export const RECIPE_DETECTION_SCRIPT = `
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

/**
 * Simple logging script for debugging WebView content loading
 */
export const DEBUG_LOGGING_SCRIPT = `
  console.log('WebView injected JavaScript running');
  true;
`;
