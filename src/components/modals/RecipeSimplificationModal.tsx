import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import { Step } from '~/types/recipe';

interface RecipeSimplificationModalProps {
  visible: boolean;
  onClose: () => void;
  originalSteps: Step[];
  simplifiedSteps: Step[];
  changesSummary: string;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  isProcessing?: boolean;
  isRegenerating?: boolean;
}

export function RecipeSimplificationModal({
  visible,
  onClose,
  originalSteps,
  simplifiedSteps,
  changesSummary,
  onAccept,
  onReject,
  onRegenerate,
  isProcessing = false,
  isRegenerating = false,
}: RecipeSimplificationModalProps) {
  const styles = useStyles(createStyles);
  const [summaryExpanded, setSummaryExpanded] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    if (visible) {
      console.log('SimplificationModal opened');
      console.log('Original steps:', originalSteps?.length);
      console.log('Simplified steps:', simplifiedSteps?.length);
      console.log('Changes summary:', changesSummary);
    }
  }, [visible, originalSteps, simplifiedSteps, changesSummary]);

  // Don't render if we don't have valid data
  if (!visible || !simplifiedSteps || simplifiedSteps.length === 0) {
    if (visible) {
      console.warn('Modal visible but no valid data!', {
        hasSimplifiedSteps: !!simplifiedSteps,
        length: simplifiedSteps?.length
      });
    }
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="auto-fix"
                size={24}
                color={theme.colors.primary[500]}
                style={styles.headerIcon}
              />
              <Text style={styles.title}>AI Recipe Simplification</Text>
            </View>
            <TouchableOpacity
              onPress={onRegenerate}
              style={styles.regenerateButton}
              disabled={isRegenerating}>
              {isRegenerating ? (
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              ) : (
                <MaterialCommunityIcons
                  name="refresh"
                  size={24}
                  color={theme.colors.primary[500]}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Summary - Compact */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Ionicons name="information-circle" size={16} color={theme.colors.primary[600]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryText} numberOfLines={summaryExpanded ? undefined : 2}>
                    {changesSummary}
                  </Text>
                  <Text
                      onPress={() => setSummaryExpanded(!summaryExpanded)}
                      style={styles.seeMoreInline}>
                      {summaryExpanded ? 'see less' : 'see more'}
                    </Text>
                </View>
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.statCompact}>{originalSteps.length}</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={16}
                  color={theme.colors.text.tertiary}
                />
                <Text style={styles.statCompact}>{simplifiedSteps.length}</Text>
              </View>
            </View>
          </View>

          {/* Side-by-Side Comparison */}
          <View style={styles.columnsHeader}>
            <View style={styles.columnHeaderLeft}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.columnHeaderText}>Original ({originalSteps.length})</Text>
            </View>
            <View style={styles.columnHeaderRight}>
              <MaterialCommunityIcons name="auto-fix" size={16} color={theme.colors.primary[600]} />
              <Text style={[styles.columnHeaderText, styles.simplifiedHeaderText]}>
                Simplified ({simplifiedSteps.length})
              </Text>
            </View>
          </View>

          <ScrollView style={styles.comparisonContainer} showsVerticalScrollIndicator={false}>
            {/* Create rows for side-by-side comparison */}
            {Array.from({ length: Math.max(originalSteps.length, simplifiedSteps.length) }).map(
              (_, index) => (
                <View key={`row-${index}`} style={styles.comparisonRow}>
                  {/* Original Step */}
                  <View style={styles.columnLeft}>
                    {originalSteps[index] ? (
                      <View style={styles.stepCard}>
                        <View style={styles.stepNumberAbsolute}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{originalSteps[index].text}</Text>
                      </View>
                    ) : (
                      <View style={styles.emptyStep} />
                    )}
                  </View>

                  {/* Simplified Step */}
                  <View style={styles.columnRight}>
                    {simplifiedSteps[index] ? (
                      <View style={[styles.stepCard, styles.simplifiedStepCard]}>
                        <View
                          style={[styles.stepNumberAbsolute, styles.simplifiedStepNumberAbsolute]}>
                          <Text style={[styles.stepNumberText, styles.simplifiedStepNumberText]}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={styles.stepText}>{simplifiedSteps[index].text}</Text>
                      </View>
                    ) : (
                      <View style={styles.emptyStep} />
                    )}
                  </View>
                </View>
              )
            )}
            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Action Buttons - Removed Edit First */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              onPress={onReject}
              style={[styles.actionButton, styles.rejectButton]}
              disabled={isProcessing || isRegenerating}>
              <Ionicons name="close-circle-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Keep Original</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAccept}
              style={[styles.actionButton, styles.acceptButton]}
              disabled={isProcessing || isRegenerating}>
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Use Simplified</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
    backgroundColor: theme.colors.surface.primary,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  regenerateButton: {
    padding: 8,
    marginLeft: 8,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: theme.colors.primary[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  summaryText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statCompact: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary[600],
  },
  seeMoreInline: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary[600],
    textDecorationLine: 'underline',
  },
  columnsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
    backgroundColor: theme.colors.surface.secondary,
  },
  columnHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  columnHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  columnHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  simplifiedHeaderText: {
    color: theme.colors.primary[600],
  },
  comparisonContainer: {
    flex: 1,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
  },
  stepCard: {
    position: 'relative',
    padding: 10,
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  simplifiedStepCard: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[300],
  },
  stepNumberAbsolute: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  simplifiedStepNumberAbsolute: {
    backgroundColor: theme.colors.primary[500],
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  simplifiedStepNumberText: {
    color: 'white',
  },
  stepText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  emptyStep: {
    height: 20,
  },
  bottomPadding: {
    height: 100,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: theme.colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.main,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary[500],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  rejectButtonText: {
    color: theme.colors.text.secondary,
  },
});
