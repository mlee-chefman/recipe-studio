/**
 * Temperature Info Modal
 * Shows detected protein and doneness info for imported recipes
 * Allows quick refinement of temperature based on preferred doneness
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';
import {
  TEMPERATURE_GUIDE,
  PROTEIN_LABELS,
  DONENESS_LABELS,
  TemperatureGuide,
  DonenesLevel,
  detectProteinType,
  findDonenessForTemp,
} from '@constants/temperatureGuide';
import BaseModal from './BaseModal';

interface TemperatureInfoModalProps {
  visible: boolean;
  onClose: () => void;
  currentTemperature: number;
  recipeText: string; // Recipe title + instructions for protein detection
  onTemperatureChange: (newTemp: number, doneness: string, removeTemp?: number) => void;
}

export function TemperatureInfoModal({
  visible,
  onClose,
  currentTemperature,
  recipeText,
  onTemperatureChange,
}: TemperatureInfoModalProps) {
  const [detectedProtein, setDetectedProtein] = useState<TemperatureGuide | null>(null);
  const [currentDoneness, setCurrentDoneness] = useState<DonenesLevel | null>(null);
  const [manualTemp, setManualTemp] = useState<string>(currentTemperature?.toString() || '');

  useEffect(() => {
    if (visible && recipeText) {
      // Detect protein type from recipe
      const protein = detectProteinType(recipeText);
      setDetectedProtein(protein);

      // Find current doneness level
      if (protein && currentTemperature) {
        const doneness = findDonenessForTemp(protein, currentTemperature);
        setCurrentDoneness(doneness);
      }

      // Set manual temp to current temp
      setManualTemp(currentTemperature?.toString() || '');
    }
  }, [visible, recipeText, currentTemperature]);

  const handleDonenessSelect = (doneness: DonenesLevel) => {
    onTemperatureChange(
      doneness.targetTemp,
      DONENESS_LABELS[doneness.nameKey] || doneness.nameKey,
      doneness.removeTemp // Pass remove temp if available
    );
  };

  const handleManualSave = () => {
    const temp = parseInt(manualTemp);
    if (!isNaN(temp) && temp >= 100 && temp <= 250) {
      // For manual entry, remove_temp = target_temp
      onTemperatureChange(temp, 'Custom', temp);
    }
  };

  const handleKeepCurrent = () => {
    onClose();
  };

  if (!detectedProtein) {
    return null;
  }

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      maxHeight="80%"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Temperature Guide</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Detected Protein */}
            <View style={styles.detectedSection}>
              <Image
                source={{ uri: detectedProtein.icon }}
                style={styles.proteinIcon}
                resizeMode="contain"
              />
              <View style={styles.detectedInfo}>
                <Text style={styles.detectedLabel}>Detected Protein</Text>
                <Text style={styles.detectedValue}>
                  {PROTEIN_LABELS[detectedProtein.nameKey] || detectedProtein.nameKey}
                </Text>
              </View>
            </View>

            {/* Manual Temperature Input */}
            <View style={styles.manualInputSection}>
              <Text style={styles.manualInputLabel}>Adjust Temperature</Text>
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
                    styles.updateButton,
                    (!manualTemp || isNaN(parseInt(manualTemp)) || parseInt(manualTemp) === currentTemperature) && styles.updateButtonDisabled
                  ]}
                  onPress={handleManualSave}
                  disabled={!manualTemp || isNaN(parseInt(manualTemp)) || parseInt(manualTemp) === currentTemperature}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
              {currentDoneness && (
                <View style={styles.donenessTag}>
                  <Text style={styles.donenessTagText}>
                    {DONENESS_LABELS[currentDoneness.nameKey] || currentDoneness.nameKey}
                  </Text>
                  {currentDoneness.isUsdaApproved && (
                    <View style={styles.usdaBadgeSmall}>
                      <Feather name="shield" size={10} color={theme.colors.success.main} />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or choose doneness level</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Doneness Options */}
            <Text style={styles.sectionTitle}>Recommended temperatures:</Text>
            <View style={styles.donenessOptions}>
              {detectedProtein.doneness.map((doneness) => {
                const isCurrentDoneness = currentDoneness?.nameKey === doneness.nameKey;

                return (
                  <TouchableOpacity
                    key={doneness.nameKey}
                    style={[
                      styles.donenessOption,
                      isCurrentDoneness && styles.donenessOptionCurrent,
                    ]}
                    onPress={() => handleDonenessSelect(doneness)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.donenessOptionContent}>
                      <View style={styles.donenessOptionHeader}>
                        <Text style={styles.donenessOptionName}>
                          {DONENESS_LABELS[doneness.nameKey] || doneness.nameKey}
                        </Text>
                        {doneness.isUsdaApproved && (
                          <View style={styles.usdaBadge}>
                            <Feather name="shield" size={10} color={theme.colors.success.main} />
                            <Text style={styles.usdaBadgeText}>USDA</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.donenessOptionTemp}>{doneness.targetTemp}°F</Text>
                      {doneness.removeTemp && (
                        <Text style={styles.donenessOptionRemove}>
                          Remove at {doneness.removeTemp}°F
                        </Text>
                      )}
                    </View>
                    {isCurrentDoneness && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Feather name="info" size={14} color={theme.colors.info.main} />
              <Text style={styles.infoNoteText}>
                These are recommended internal temperatures. Always verify with a meat thermometer.
              </Text>
      </View>
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
  },
  detectedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  proteinIcon: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.md,
  },
  detectedInfo: {
    flex: 1,
  },
  detectedLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  detectedValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[700],
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
    marginBottom: theme.spacing.sm,
  },
  manualInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    textAlign: 'center',
  },
  tempUnit: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.secondary,
  },
  updateButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.lg,
  },
  updateButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  updateButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.inverse,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
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
  donenessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.full,
  },
  donenessTagText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  donenessOptions: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  donenessOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  donenessOptionCurrent: {
    borderColor: theme.colors.primary[300],
    backgroundColor: theme.colors.primary[50],
  },
  donenessOptionContent: {
    flex: 1,
  },
  donenessOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  donenessOptionName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  donenessOptionTemp: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  donenessOptionRemove: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  usdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.colors.success.light,
    borderRadius: theme.borderRadius.full,
  },
  usdaBadgeSmall: {
    padding: 2,
  },
  usdaBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.success.main,
  },
  currentBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.full,
  },
  currentBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: 'white',
  },
  infoNote: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.info.light,
    borderRadius: theme.borderRadius.lg,
  },
  infoNoteText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.info.dark,
    lineHeight: 18,
  },
});
