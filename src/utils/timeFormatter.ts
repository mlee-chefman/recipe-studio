/**
 * Utility functions for formatting time values
 */

/**
 * Formats cooking time from minutes to a human-readable string
 * @param minutes - The total time in minutes
 * @returns Formatted time string (e.g., "45 min", "1 hr 30 min", "3 hrs")
 */
export function formatCookTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }

  return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${remainingMinutes} min`;
}
