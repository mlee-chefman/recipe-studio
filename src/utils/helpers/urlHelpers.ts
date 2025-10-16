/**
 * Helper functions for URL validation and formatting
 */

/**
 * Patterns for URLs that should be excluded from recipe import
 * (search engines, social media, etc.)
 */
const EXCLUDED_URL_PATTERNS = [
  /google\.com\/search/i,
  /youtube\.com/i,
  /facebook\.com/i,
  /twitter\.com/i,
  /instagram\.com/i,
  /pinterest\.com/i,
  /reddit\.com/i,
];

/**
 * Check if URL should be excluded from recipe detection
 * Returns true for search engines, social media, and other non-recipe sites
 */
export function isExcludedUrl(url: string): boolean {
  return EXCLUDED_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Format a URL string by adding protocol if missing
 * Assumes https:// if no protocol is specified
 */
export function formatUrl(url: string): string {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return trimmedUrl;
  }

  // If no protocol, assume https
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return 'https://' + trimmedUrl;
  }

  return trimmedUrl;
}

/**
 * Validate if a string is a valid URL
 * Returns true if the URL can be parsed successfully
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Format and validate a URL in one step
 * Returns formatted URL if valid, null otherwise
 */
export function formatAndValidateUrl(url: string): string | null {
  const formatted = formatUrl(url);
  return isValidUrl(formatted) ? formatted : null;
}
