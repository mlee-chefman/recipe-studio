import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for providing tactile feedback on user actions.
 * Uses appropriate intensity levels based on action importance.
 */

export const haptics = {
  /**
   * Light haptic feedback for minor interactions
   * Use for: toggles, selection, minor button presses
   */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium haptic feedback for standard interactions
   * Use for: most buttons, form submissions, navigation
   */
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Success haptic feedback for positive outcomes
   * Use for: save success, import success, creation success
   */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning haptic feedback for cautionary actions
   * Use for: validation errors, warnings, confirmations
   */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error haptic feedback for failures
   * Use for: errors, failed operations, critical issues
   */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Heavy haptic feedback for important/destructive actions
   * Use for: delete actions, critical confirmations
   */
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Selection haptic feedback for picking items
   * Use for: checkbox toggles, radio selections, list item selections
   */
  selection: () => {
    Haptics.selectionAsync();
  },
};
