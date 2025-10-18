import axios from 'axios';
import { decode } from 'html-entities';
import { analyzeRecipeForChefIQ, RecipeAnalysisResult } from './recipeAnalyzer';
import { processInstructions } from './helpers/instructionSplitter';

// Decode HTML entities using the html-entities library
const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  return decode(text);
};

export interface ScrapedRecipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: number;
  prepTime: number;
  servings: number;
  category?: string;
  tags?: string[];
  image?: string;
  // ChefIQ suggestions
  chefiqSuggestions?: RecipeAnalysisResult;
}

// Free CORS proxy services (rotate if one is down)
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://proxy.cors.sh/',
];

let currentProxyIndex = 0;

// Get the next CORS proxy
const getCorsProxy = () => {
  const proxy = CORS_PROXIES[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  return proxy;
};

// Convert ISO 8601 duration to minutes
const parseDuration = (duration: string): number => {
  if (!duration) return 30;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 30;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');

  return hours * 60 + minutes || 30;
};

// Parse JSON-LD structured data from HTML
const extractJsonLd = (html: string): any => {
  // Look for JSON-LD script tags
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);

  if (!jsonLdMatch) return null;

  for (const match of jsonLdMatch) {
    try {
      // Extract JSON content
      const jsonContent = match.replace(/<script[^>]*type="application\/ld\+json"[^>]*>|<\/script>/gi, '').trim();
      const data = JSON.parse(jsonContent);

      // Check if it's a Recipe type
      if (data['@type'] === 'Recipe' ||
          (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
        return data;
      }

      // Check if it's in @graph
      if (data['@graph']) {
        const recipe = data['@graph'].find((item: any) =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
        if (recipe) return recipe;
      }

      // Check if it's an array
      if (Array.isArray(data)) {
        const recipe = data.find((item: any) =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
        if (recipe) return recipe;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
};

// Parse ingredients from various formats
const parseIngredients = (ingredients: any): string[] => {
  if (!ingredients) return [];

  if (Array.isArray(ingredients)) {
    return ingredients.map(ing => {
      let text = '';
      if (typeof ing === 'string') text = ing.trim();
      else if (ing.name) text = ing.name.trim();
      else if (ing.text) text = ing.text.trim();
      else text = String(ing).trim();
      return decodeHtmlEntities(text);
    }).filter(Boolean);
  }

  if (typeof ingredients === 'string') {
    return ingredients.split('\n').map(s => decodeHtmlEntities(s.trim())).filter(Boolean);
  }

  return [];
};

// Parse instructions from various formats
const parseInstructions = (instructions: any): string[] => {
  if (!instructions) return [];

  if (Array.isArray(instructions)) {
    const parsed: string[] = [];

    instructions.forEach(inst => {
      if (typeof inst === 'string') {
        parsed.push(decodeHtmlEntities(inst.trim()));
      } else if (inst.text) {
        parsed.push(decodeHtmlEntities(inst.text.trim()));
      } else if (inst.name) {
        parsed.push(decodeHtmlEntities(inst.name.trim()));
      } else if (inst['@type'] === 'HowToStep') {
        if (inst.text) parsed.push(decodeHtmlEntities(inst.text.trim()));
        else if (inst.name) parsed.push(decodeHtmlEntities(inst.name.trim()));
      } else if (inst['@type'] === 'HowToSection' && inst.itemListElement) {
        const sectionSteps = parseInstructions(inst.itemListElement);
        parsed.push(...sectionSteps);
      }
    });

    return parsed.filter(Boolean);
  }

  if (typeof instructions === 'string') {
    return instructions.split(/\n|\. /).map(s => decodeHtmlEntities(s.trim())).filter(Boolean);
  }

  if (instructions.itemListElement) {
    return parseInstructions(instructions.itemListElement);
  }

  return [];
};

// Extract and validate image URL from various sources
const extractImage = (data: any, html: string = ''): string | undefined => {
  let imageUrl = '';

  // Try different image fields from JSON-LD
  if (data.image) {
    if (Array.isArray(data.image)) {
      // Get the first image or find the largest one
      const images = data.image.filter((img: any) => {
        if (typeof img === 'string') return img;
        if (img.url) return img.url;
        return null;
      });
      imageUrl = images[0];

      // If images have different sizes, try to find a larger one
      if (images.length > 1) {
        const largerImage = images.find((img: any) => {
          const imgUrl = typeof img === 'string' ? img : img.url;
          return imgUrl && (imgUrl.includes('large') || imgUrl.includes('high') || imgUrl.includes('1200') || imgUrl.includes('800'));
        });
        if (largerImage) {
          imageUrl = typeof largerImage === 'string' ? largerImage : largerImage.url;
        }
      }
    } else if (typeof data.image === 'string') {
      imageUrl = data.image;
    } else if (data.image.url) {
      imageUrl = data.image.url;
    }
  }

  // Try photo field as fallback
  if (!imageUrl && data.photo) {
    if (Array.isArray(data.photo)) {
      imageUrl = data.photo[0];
    } else if (typeof data.photo === 'string') {
      imageUrl = data.photo;
    } else if (data.photo.url) {
      imageUrl = data.photo.url;
    }
  }

  // If no JSON-LD image, try HTML meta tags
  if (!imageUrl && html) {
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
    } else {
      const twitterImageMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
      if (twitterImageMatch) {
        imageUrl = twitterImageMatch[1];
      }
    }
  }

  // Validate and clean the image URL
  if (imageUrl) {
    try {
      // Handle relative URLs
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        // This would need the base URL, for now skip relative paths
        return undefined;
      }

      // Validate URL format
      new URL(imageUrl);

      // Check if it's likely an image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const hasImageExtension = imageExtensions.some(ext =>
        imageUrl.toLowerCase().includes(ext)
      );

      // Many recipe sites use image services or don't have extensions, so allow those too
      if (hasImageExtension || imageUrl.includes('image') || imageUrl.includes('photo') || imageUrl.includes('recipe')) {
        return imageUrl;
      }
    } catch (e) {
      return undefined;
    }
  }

  return undefined;
};

// Extract and clean category from various sources
const extractCategory = (data: any, title: string = '', url: string = ''): string => {
  // Try different category fields from JSON-LD
  let category = '';

  if (data.recipeCategory) {
    category = Array.isArray(data.recipeCategory) ? data.recipeCategory[0] : data.recipeCategory;
  } else if (data.recipeCuisine) {
    category = Array.isArray(data.recipeCuisine) ? data.recipeCuisine[0] : data.recipeCuisine;
  } else if (data.keywords) {
    const keywords = Array.isArray(data.keywords) ? data.keywords.join(' ') : data.keywords;
    // Extract common food categories from keywords
    const foodCategories = ['italian', 'chinese', 'mexican', 'indian', 'thai', 'japanese', 'french', 'greek', 'dessert', 'breakfast', 'lunch', 'dinner', 'appetizer', 'soup', 'salad', 'pasta', 'pizza', 'cake', 'cookie', 'bread'];
    const foundCategory = foodCategories.find(cat => keywords.toLowerCase().includes(cat));
    if (foundCategory) {
      category = foundCategory.charAt(0).toUpperCase() + foundCategory.slice(1);
    }
  }

  // If no category found, try to infer from title
  if (!category || category === 'General') {
    category = inferCategoryFromTitle(title);
  }

  // If still no category, try to infer from URL
  if (!category || category === 'General') {
    category = inferCategoryFromUrl(url);
  }

  return category || 'General';
};

// Infer category from recipe title
const inferCategoryFromTitle = (title: string): string => {
  const titleLower = title.toLowerCase();

  // Cuisine types
  if (titleLower.includes('pasta') || titleLower.includes('spaghetti') || titleLower.includes('lasagna') || titleLower.includes('risotto')) return 'Italian';
  if (titleLower.includes('stir fry') || titleLower.includes('ramen') || titleLower.includes('teriyaki') || titleLower.includes('sushi')) return 'Asian';
  if (titleLower.includes('taco') || titleLower.includes('burrito') || titleLower.includes('enchilada') || titleLower.includes('quesadilla')) return 'Mexican';
  if (titleLower.includes('curry') || titleLower.includes('biryani') || titleLower.includes('tikka')) return 'Indian';
  if (titleLower.includes('pad thai') || titleLower.includes('tom yum')) return 'Thai';
  if (titleLower.includes('croissant') || titleLower.includes('baguette') || titleLower.includes('coq au vin')) return 'French';

  // Meal types
  if (titleLower.includes('breakfast') || titleLower.includes('pancake') || titleLower.includes('waffle') || titleLower.includes('omelette')) return 'Breakfast';
  if (titleLower.includes('cake') || titleLower.includes('cookie') || titleLower.includes('pie') || titleLower.includes('dessert') || titleLower.includes('ice cream')) return 'Dessert';
  if (titleLower.includes('soup') || titleLower.includes('bisque') || titleLower.includes('chowder') || titleLower.includes('broth')) return 'Soup';
  if (titleLower.includes('salad') || titleLower.includes('caesar') || titleLower.includes('vinaigrette')) return 'Salad';
  if (titleLower.includes('bread') || titleLower.includes('roll') || titleLower.includes('biscuit') || titleLower.includes('muffin')) return 'Bread';
  if (titleLower.includes('pizza')) return 'Pizza';
  if (titleLower.includes('sandwich') || titleLower.includes('burger') || titleLower.includes('wrap')) return 'Sandwich';

  // Protein types
  if (titleLower.includes('chicken') || titleLower.includes('poultry')) return 'Chicken';
  if (titleLower.includes('beef') || titleLower.includes('steak')) return 'Beef';
  if (titleLower.includes('pork') || titleLower.includes('bacon') || titleLower.includes('ham')) return 'Pork';
  if (titleLower.includes('fish') || titleLower.includes('salmon') || titleLower.includes('tuna') || titleLower.includes('seafood')) return 'Seafood';
  if (titleLower.includes('vegetarian') || titleLower.includes('vegan')) return 'Vegetarian';

  return 'General';
};

// Infer category from URL
const inferCategoryFromUrl = (url: string): string => {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('dessert') || urlLower.includes('sweet')) return 'Dessert';
  if (urlLower.includes('breakfast')) return 'Breakfast';
  if (urlLower.includes('dinner') || urlLower.includes('main')) return 'Dinner';
  if (urlLower.includes('appetizer') || urlLower.includes('starter')) return 'Appetizer';
  if (urlLower.includes('soup')) return 'Soup';
  if (urlLower.includes('salad')) return 'Salad';

  return 'General';
};

// Parse recipe from JSON-LD data
const parseRecipeFromJsonLd = async (data: any, url: string = '', html: string = ''): Promise<ScrapedRecipe | null> => {
  if (!data) return null;

  try {
    const ingredients = parseIngredients(data.recipeIngredient);
    const rawInstructions = parseInstructions(data.recipeInstructions);

    // Only return if we have meaningful data
    if (!data.name || (ingredients.length === 0 && rawInstructions.length === 0)) {
      return null;
    }

    // Process instructions: decode HTML and split if needed using Gemini
    const instructions = await processInstructions(rawInstructions);

    const title = decodeHtmlEntities(data.name || 'Untitled Recipe');
    const category = extractCategory(data, title, url);
    const image = extractImage(data, html);
    const cookTime = parseDuration(data.cookTime) || parseDuration(data.totalTime) || 30;
    const description = decodeHtmlEntities(data.description || data.about || '');

    // Analyze recipe for ChefIQ suggestions
    let chefiqSuggestions;
    try {
      chefiqSuggestions = analyzeRecipeForChefIQ(
        title,
        description,
        instructions,
        cookTime
      );
    } catch (error) {
      console.error('ChefIQ analysis failed:', error);
      chefiqSuggestions = {
        suggestedActions: [],
        confidence: 0,
        reasoning: ['Analysis failed - manual setup required']
      };
    }

    return {
      title,
      description,
      ingredients,
      instructions,
      cookTime,
      prepTime: parseDuration(data.prepTime) || 15,
      servings: parseInt(data.recipeYield) || parseInt(data.yield) || 4,
      category,
      image,
      chefiqSuggestions,
    };
  } catch (e) {
    return null;
  }
};

// Fallback HTML parsing for common recipe sites
const parseRecipeFromHtml = (html: string, url: string): ScrapedRecipe | null => {
  const recipe: ScrapedRecipe = {
    title: '',
    description: '',
    ingredients: [],
    instructions: [],
    cookTime: 30,
    prepTime: 15,
    servings: 4,
    category: 'General'
  };

  // Extract title
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    recipe.title = decodeHtmlEntities(titleMatch[1].trim().replace(/\s*\|.*$/, '').replace(/Recipe\s*-?\s*/i, ''));
  }

  // Extract description from meta tag
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                    html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  if (descMatch) {
    recipe.description = decodeHtmlEntities(descMatch[1].trim());
  }

  // Try to find ingredients using common patterns
  const ingredientPatterns = [
    /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
    /<span[^>]*itemprop="recipeIngredient"[^>]*>([^<]+)</gi,
    /<p[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
  ];

  for (const pattern of ingredientPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const ingredient = decodeHtmlEntities(match[1].trim().replace(/<[^>]*>/g, ''));
      if (ingredient && !ingredient.includes('<') && ingredient.length > 3) {
        recipe.ingredients.push(ingredient);
      }
    }
    if (recipe.ingredients.length > 0) break;
  }

  // Try to find instructions using common patterns
  const instructionPatterns = [
    /<li[^>]*class="[^"]*instruction[^"]*"[^>]*>(.*?)<\/li>/gis,
    /<div[^>]*class="[^"]*direction[^"]*"[^>]*>(.*?)<\/div>/gis,
    /<span[^>]*itemprop="recipeInstructions"[^>]*>(.*?)<\/span>/gis,
  ];

  for (const pattern of instructionPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const instruction = decodeHtmlEntities(match[1].trim().replace(/<[^>]*>/g, '').replace(/\s+/g, ' '));
      if (instruction && instruction.length > 10) {
        recipe.instructions.push(instruction);
      }
    }
    if (recipe.instructions.length > 0) break;
  }

  // Only return if we found something useful
  if (recipe.title && (recipe.ingredients.length > 0 || recipe.instructions.length > 0)) {
    // Extract category and image from title and URL
    recipe.category = extractCategory({}, recipe.title, url);
    recipe.image = extractImage({}, html);
    return recipe;
  }

  return null;
};

// Main scraper function
export const scrapeRecipe = async (url: string): Promise<ScrapedRecipe> => {
  let lastError: any = null;

  // Try with different CORS proxies
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxy = getCorsProxy();
      const proxyUrl = proxy + encodeURIComponent(url);

      const response = await axios.get(proxyUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const html = response.data;

      // First try JSON-LD extraction
      const jsonLdData = extractJsonLd(html);
      if (jsonLdData) {
        const recipe = await parseRecipeFromJsonLd(jsonLdData, url, html);
        if (recipe) {
          console.log('Successfully extracted recipe using JSON-LD');
          return recipe;
        }
      }

      // Fallback to HTML parsing
      const htmlRecipe = parseRecipeFromHtml(html, url);
      if (htmlRecipe) {
        console.log('Successfully extracted recipe using HTML parsing');
        return htmlRecipe;
      }

      // If we got here, we couldn't parse the recipe but the request worked
      break;

    } catch (error) {
      lastError = error;
      console.log(`Proxy ${i + 1} failed, trying next...`);
      continue;
    }
  }

  // If all attempts failed, return a template for manual entry
  console.log('Could not automatically extract recipe, providing template');

  const hostname = new URL(url).hostname;
  const fallbackCategory = inferCategoryFromUrl(url);

  return {
    title: 'Recipe from ' + hostname,
    description: `Could not automatically extract recipe from: ${url}\n\nPlease copy the recipe details from the website and paste them into the fields below.`,
    ingredients: ['Copy and paste ingredients from the website'],
    instructions: ['Copy and paste instructions from the website'],
    cookTime: 30,
    prepTime: 15,
    servings: 4,
    category: fallbackCategory
  };
};

// Test if a URL is valid
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};