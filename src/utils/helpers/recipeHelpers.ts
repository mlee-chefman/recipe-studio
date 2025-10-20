import { Recipe } from '~/types/recipe';
import { getUserProfile } from '~/modules/user/userService';

/**
 * Enrich recipes with author names and profile pictures by fetching user profiles
 * @param recipes - Array of recipes to enrich
 * @returns Promise<Recipe[]> - Recipes enriched with author information
 */
export const enrichRecipesWithAuthorNames = async (recipes: Recipe[]): Promise<Recipe[]> => {
  try {
    // Get unique user IDs that don't have author names or profile pictures
    const userIdsToFetch = new Set<string>();
    recipes.forEach(recipe => {
      if ((!recipe.authorName || !recipe.authorProfilePicture) && recipe.userId) {
        userIdsToFetch.add(recipe.userId);
      }
    });

    // Fetch user profiles for these user IDs
    const userProfileMap = new Map<string, { name: string; profilePicture?: string }>();
    await Promise.all(
      Array.from(userIdsToFetch).map(async (userId) => {
        try {
          const userProfile = await getUserProfile(userId);
          if (userProfile) {
            userProfileMap.set(userId, {
              name: userProfile.name,
              profilePicture: userProfile.profilePicture
            });
          }
        } catch (error) {
          console.error(`Error fetching user profile for ${userId}:`, error);
        }
      })
    );

    // Enrich recipes with author names and profile pictures
    return recipes.map(recipe => {
      if ((!recipe.authorName || !recipe.authorProfilePicture) && recipe.userId) {
        const userProfile = userProfileMap.get(recipe.userId);
        if (userProfile) {
          return {
            ...recipe,
            authorName: userProfile.name,
            authorProfilePicture: userProfile.profilePicture
          };
        }
      }
      return recipe;
    });
  } catch (error) {
    console.error('Error enriching recipes with author info:', error);
    return recipes; // Return original recipes if enrichment fails
  }
};

/**
 * Format cook time from hours and minutes to display string
 * @param hours - Number of hours
 * @param minutes - Number of minutes
 * @returns Formatted string (e.g., "1h 30m" or "30m")
 */
export const formatCookTime = (hours: number, minutes: number): string => {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Convert total minutes to hours and minutes
 * @param totalMinutes - Total cook time in minutes
 * @returns Object with hours and minutes
 */
export const minutesToHoursAndMinutes = (totalMinutes: number): { hours: number; minutes: number } => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
};

/**
 * Convert hours and minutes to total minutes
 * @param hours - Number of hours
 * @param minutes - Number of minutes
 * @returns Total minutes
 */
export const hoursAndMinutesToMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};
