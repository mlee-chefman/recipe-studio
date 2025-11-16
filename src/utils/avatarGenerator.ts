/**
 * Generates a random avatar URL for users
 * Uses DiceBear Avatars API (https://www.dicebear.com/)
 */

const AVATAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'big-ears',
  'big-smile',
  'bottts',
  'croodles',
  'fun-emoji',
  'icons',
  'initials',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
  'shapes',
  'thumbs',
];

/**
 * Simple hash function to convert string to number
 * @param str - String to hash
 * @returns Number hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic avatar URL based on user ID
 * Same userId will always generate the same avatar
 * @param userId - The user's unique ID
 * @param seed - Optional seed for deterministic avatar generation
 * @returns Avatar URL
 */
export function generateAvatarUrl(userId: string, seed?: string): string {
  // Use userId or provided seed to ensure consistent avatar for the same user
  const avatarSeed = seed || userId;

  // Use hash of userId to pick a consistent style
  const hash = hashString(avatarSeed);
  const styleIndex = hash % AVATAR_STYLES.length;
  const style = AVATAR_STYLES[styleIndex];

  // Generate avatar URL using DiceBear API
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}`;
}

/**
 * Generate an avatar with a specific style
 * @param userId - The user's unique ID
 * @param style - The avatar style to use
 * @returns Avatar URL
 */
export function generateAvatarUrlWithStyle(
  userId: string,
  style: 'adventurer' | 'avataaars' | 'bottts' | 'fun-emoji' | 'initials' | 'lorelei' | 'micah' | 'pixel-art' = 'adventurer'
): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(userId)}`;
}

/**
 * Get initials-based avatar (shows user initials)
 * @param name - The user's name
 * @returns Avatar URL with initials
 */
export function generateInitialsAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

/**
 * Generate a set of preset avatars for user selection
 * @param count - Number of avatars to generate
 * @returns Array of avatar URLs
 */
export function generatePresetAvatars(count: number = 12): string[] {
  const styles = [
    'adventurer',
    'avataaars',
    'bottts',
    'fun-emoji',
    'lorelei',
    'micah',
    'miniavs',
    'pixel-art',
  ];

  const seeds = [
    'Felix',
    'Aneka',
    'Charlie',
    'Max',
    'Sophie',
    'Oliver',
    'Emma',
    'Lucas',
    'Mia',
    'Noah',
    'Ava',
    'Leo',
  ];

  const avatars: string[] = [];

  for (let i = 0; i < count && i < seeds.length; i++) {
    const style = styles[i % styles.length];
    const seed = seeds[i];
    avatars.push(`https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`);
  }

  return avatars;
}
