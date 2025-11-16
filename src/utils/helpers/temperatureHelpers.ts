/**
 * Calculates a default remove temperature based on target temperature
 * @param targetTemp - The target probe temperature
 * @returns Remove temperature (5°F below target, minimum 100°F)
 */
export const calculateDefaultRemoveTemp = (targetTemp: number): number => {
  return Math.max(100, targetTemp - 5);
};

/**
 * Ensures remove temperature doesn't exceed target temperature
 * @param removeTemp - The remove temperature to check
 * @param targetTemp - The target temperature limit
 * @returns Adjusted remove temperature
 */
export const ensureRemoveTempValid = (removeTemp: number, targetTemp: number): number => {
  return removeTemp > targetTemp ? targetTemp : removeTemp;
};

/**
 * Checks if remove temperature is different from target temperature
 * @param removeTemp - The remove temperature
 * @param targetTemp - The target temperature
 * @returns true if temperatures are different and remove temp should be shown
 */
export const shouldShowRemoveTemp = (removeTemp: number | undefined, targetTemp: number | undefined): boolean => {
  if (!removeTemp || !targetTemp) return false;
  return removeTemp !== targetTemp;
};
