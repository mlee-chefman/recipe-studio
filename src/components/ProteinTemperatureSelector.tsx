/**
 * Protein Temperature Selector Component
 * Allows users to select protein type and desired doneness level
 * Used for manual recipe creation with probe cooking
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';
import {
  TEMPERATURE_GUIDE,
  PROTEIN_LABELS,
  DONENESS_LABELS,
  TemperatureGuide,
  DonenesLevel,
} from '@constants/temperatureGuide';

interface ProteinTemperatureSelectorProps {
  onSelect: (temperature: number, proteinType: string, doneness: string, removeTemp?: number) => void;
  initialTemperature?: number;
  onCancel?: () => void;
}

export function ProteinTemperatureSelector({
  onSelect,
  initialTemperature,
  onCancel,
}: ProteinTemperatureSelectorProps) {
  const [expandedProtein, setExpandedProtein] = useState<string | null>(null);
  const [manualTemp, setManualTemp] = useState<string>(initialTemperature?.toString() || '');

  const toggleProtein = (proteinKey: string) => {
    setExpandedProtein(expandedProtein === proteinKey ? null : proteinKey);
  };

  const handleDonenessSelect = (protein: TemperatureGuide, doneness: DonenesLevel) => {
    setManualTemp(doneness.targetTemp.toString());
    onSelect(
      doneness.targetTemp,
      PROTEIN_LABELS[protein.nameKey] || protein.nameKey,
      DONENESS_LABELS[doneness.nameKey] || doneness.nameKey,
      doneness.removeTemp // Pass remove temp if available
    );
  };

  const handleManualSave = () => {
    const temp = parseInt(manualTemp);
    if (!isNaN(temp) && temp >= 100 && temp <= 250) {
      // For manual entry, remove_temp = target_temp
      onSelect(temp, 'Custom', 'Custom', temp);
    }
  };

  // Get color based on temperature (visual indicator)
  const getTempColor = (temp: number): string => {
    if (temp < 130) return theme.colors.error.main; // red - rare
    if (temp < 145) return theme.colors.warning.dark; // orange - medium rare
    if (temp < 155) return theme.colors.warning.main; // amber - medium
    if (temp < 170) return theme.colors.success.main; // lime - medium well
    return theme.colors.gray[500]; // stone - well done
  };

  // Get status bar height
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight + theme.spacing.md }]}>
        <Text style={styles.headerTitle}>Select Protein & Doneness</Text>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Feather name="x" size={28} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Manual Temperature Input */}
        <View style={styles.manualInputSection}>
          <Text style={styles.manualInputLabel}>Set Target Temperature</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              value={manualTemp}
              onChangeText={setManualTemp}
              placeholder="165"
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.tempUnit}>°F</Text>
            <TouchableOpacity
              style={[
                styles.setButton,
                (!manualTemp || isNaN(parseInt(manualTemp))) && styles.setButtonDisabled
              ]}
              onPress={handleManualSave}
              disabled={!manualTemp || isNaN(parseInt(manualTemp))}
            >
              <Text style={styles.setButtonText}>Set</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.manualInputHint}>Enter any temperature between 100-250°F</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use suggested temperatures</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Protein Suggestions */}
        <Text style={styles.sectionTitle}>Recommended temperatures by protein type:</Text>

        {TEMPERATURE_GUIDE.map((protein) => {
          const isExpanded = expandedProtein === protein.nameKey;

          return (
            <View key={protein.nameKey} style={styles.proteinSection}>
              {/* Protein Header - Tappable to expand/collapse */}
              <TouchableOpacity
                style={[styles.proteinCard, isExpanded && styles.proteinCardExpanded]}
                onPress={() => toggleProtein(protein.nameKey)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: protein.icon }}
                  style={styles.proteinIcon}
                  resizeMode="contain"
                />
                <Text style={styles.proteinLabel}>
                  {PROTEIN_LABELS[protein.nameKey] || protein.nameKey}
                </Text>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>

              {/* Doneness Options - Shown when expanded */}
              {isExpanded && (
                <View style={styles.donenessContainer}>
                  {protein.doneness.map((doneness) => (
                    <TouchableOpacity
                      key={doneness.nameKey}
                      style={styles.donenessCard}
                      onPress={() => handleDonenessSelect(protein, doneness)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.donenessContent}>
                        <View style={styles.donenessInfo}>
                          <View style={styles.donenessNameRow}>
                            <Text style={styles.donenessName}>
                              {DONENESS_LABELS[doneness.nameKey] || doneness.nameKey}
                            </Text>
                            {doneness.isUsdaApproved && (
                              <View style={styles.usdaBadge}>
                                <Feather name="shield" size={12} color={theme.colors.success.main} />
                                <Text style={styles.usdaBadgeText}>USDA</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.tempRow}>
                            <View
                              style={[
                                styles.tempIndicator,
                                { backgroundColor: getTempColor(doneness.targetTemp) },
                              ]}
                            />
                            <Text style={styles.tempText}>{doneness.targetTemp}°F</Text>
                            {doneness.removeTemp && (
                              <Text style={styles.removeTempText}>
                                (remove at {doneness.removeTemp}°F)
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {!doneness.isUsdaApproved && (
                        <View style={styles.warningBanner}>
                          <Feather name="info" size={14} color={theme.colors.warning.main} />
                          <Text style={styles.warningText}>
                            Not USDA approved - cook at your own risk
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={theme.colors.info.main} />
          <Text style={styles.infoText}>
            Temperatures shown are internal target temperatures. For best results, remove from
            heat at the "remove" temperature and let rest for carryover cooking.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    // paddingTop is added dynamically based on status bar height
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  manualInputSection: {
    marginBottom: theme.spacing.lg,
  },
  manualInputLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  manualInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl * 1.5,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    textAlign: 'center',
  },
  tempUnit: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.secondary,
  },
  setButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
  },
  setButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  setButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.inverse,
  },
  manualInputHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[300],
  },
  dividerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  proteinSection: {
    marginBottom: theme.spacing.md,
  },
  proteinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  proteinCardExpanded: {
    borderColor: theme.colors.primary[300],
    backgroundColor: theme.colors.primary[50],
  },
  proteinIcon: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.md,
  },
  proteinLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  donenessContainer: {
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  donenessCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  donenessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donenessInfo: {
    flex: 1,
  },
  donenessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  donenessName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  usdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    backgroundColor: theme.colors.success.light,
    borderRadius: theme.borderRadius.full,
  },
  usdaBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.success.main,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tempIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tempText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  removeTempText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.warning.light,
    borderRadius: theme.borderRadius.md,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning.dark,
  },
  infoBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.info.light,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.info.dark,
    lineHeight: 20,
  },
});
