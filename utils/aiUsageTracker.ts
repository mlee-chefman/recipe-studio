import AsyncStorage from '@react-native-async-storage/async-storage';

// Usage limits configuration
export const USAGE_LIMITS = {
  FREE_TIER: {
    generationsPerDay: 3,
    generationsPerMonth: 20,
  },
};

interface UsageStats {
  dailyGenerations: number;
  monthlyGenerations: number;
  lastGenerationDate: string; // ISO date string
  lastResetDate: string; // ISO date string for monthly reset
}

const STORAGE_KEY = '@ai_recipe_usage';

/**
 * Get current usage statistics from storage
 */
async function getUsageStats(): Promise<UsageStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading usage stats:', error);
  }

  // Default stats for new users
  return {
    dailyGenerations: 0,
    monthlyGenerations: 0,
    lastGenerationDate: new Date().toISOString(),
    lastResetDate: new Date().toISOString(),
  };
}

/**
 * Save usage statistics to storage
 */
async function saveUsageStats(stats: UsageStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving usage stats:', error);
  }
}

/**
 * Check if it's a new day compared to last generation
 */
function isNewDay(lastDate: string): boolean {
  const last = new Date(lastDate);
  const now = new Date();

  return (
    last.getFullYear() !== now.getFullYear() ||
    last.getMonth() !== now.getMonth() ||
    last.getDate() !== now.getDate()
  );
}

/**
 * Check if it's a new month compared to last reset
 */
function isNewMonth(lastDate: string): boolean {
  const last = new Date(lastDate);
  const now = new Date();

  return (
    last.getFullYear() !== now.getFullYear() ||
    last.getMonth() !== now.getMonth()
  );
}

/**
 * Check if user can generate a recipe (within limits)
 * Returns { allowed: boolean, remaining: { daily, monthly }, message?: string }
 */
export async function checkUsageLimit(): Promise<{
  allowed: boolean;
  remaining: { daily: number; monthly: number };
  message?: string;
}> {
  const stats = await getUsageStats();
  const limits = USAGE_LIMITS.FREE_TIER;
  const now = new Date();

  // Reset daily counter if it's a new day
  if (isNewDay(stats.lastGenerationDate)) {
    stats.dailyGenerations = 0;
    stats.lastGenerationDate = now.toISOString();
  }

  // Reset monthly counter if it's a new month
  if (isNewMonth(stats.lastResetDate)) {
    stats.monthlyGenerations = 0;
    stats.lastResetDate = now.toISOString();
  }

  const remainingDaily = limits.generationsPerDay - stats.dailyGenerations;
  const remainingMonthly = limits.generationsPerMonth - stats.monthlyGenerations;

  // Check daily limit
  if (stats.dailyGenerations >= limits.generationsPerDay) {
    return {
      allowed: false,
      remaining: { daily: 0, monthly: remainingMonthly },
      message: `You've reached your daily limit of ${limits.generationsPerDay} AI recipe generations. Try again tomorrow!`,
    };
  }

  // Check monthly limit
  if (stats.monthlyGenerations >= limits.generationsPerMonth) {
    return {
      allowed: false,
      remaining: { daily: remainingDaily, monthly: 0 },
      message: `You've reached your monthly limit of ${limits.generationsPerMonth} AI recipe generations. Limit resets next month.`,
    };
  }

  return {
    allowed: true,
    remaining: { daily: remainingDaily, monthly: remainingMonthly },
  };
}

/**
 * Record a successful recipe generation
 * Call this after successful API response
 */
export async function recordGeneration(): Promise<void> {
  const stats = await getUsageStats();
  const now = new Date();

  // Reset counters if needed (safety check)
  if (isNewDay(stats.lastGenerationDate)) {
    stats.dailyGenerations = 0;
  }
  if (isNewMonth(stats.lastResetDate)) {
    stats.monthlyGenerations = 0;
    stats.lastResetDate = now.toISOString();
  }

  // Increment counters
  stats.dailyGenerations += 1;
  stats.monthlyGenerations += 1;
  stats.lastGenerationDate = now.toISOString();

  await saveUsageStats(stats);
}

/**
 * Get remaining generations for display in UI
 */
export async function getRemainingGenerations(): Promise<{
  daily: number;
  monthly: number;
  dailyLimit: number;
  monthlyLimit: number;
}> {
  const stats = await getUsageStats();
  const limits = USAGE_LIMITS.FREE_TIER;

  // Reset counters if needed
  if (isNewDay(stats.lastGenerationDate)) {
    stats.dailyGenerations = 0;
  }
  if (isNewMonth(stats.lastResetDate)) {
    stats.monthlyGenerations = 0;
  }

  return {
    daily: Math.max(0, limits.generationsPerDay - stats.dailyGenerations),
    monthly: Math.max(0, limits.generationsPerMonth - stats.monthlyGenerations),
    dailyLimit: limits.generationsPerDay,
    monthlyLimit: limits.generationsPerMonth,
  };
}

/**
 * Reset usage stats (for testing/admin purposes)
 */
export async function resetUsageStats(): Promise<void> {
  const stats: UsageStats = {
    dailyGenerations: 0,
    monthlyGenerations: 0,
    lastGenerationDate: new Date().toISOString(),
    lastResetDate: new Date().toISOString(),
  };
  await saveUsageStats(stats);
}
