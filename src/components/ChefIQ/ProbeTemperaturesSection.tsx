import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Animated } from 'react-native';
import { theme } from '@theme/index';
import { TemperatureInput } from './TemperatureInput';
import { AddRemoveTempButton } from './AddRemoveTempButton';
import { ProteinGuideButton } from './ProteinGuideButton';
import { ProteinGuide } from './ProteinGuide';
import { SelectedProteinChip } from './SelectedProteinChip';
import { Parameters, ValidationErrors } from '@utils/helpers/cookingValidation';

interface ProbeTemperaturesSectionProps {
  parameters: Parameters;
  validationErrors: ValidationErrors;
  showRemoveTemp: boolean;
  showProteinGuide: boolean;
  setShowProteinGuide: (show: boolean) => void;
  selectedProteinInfo: {
    proteinKey: string;
    donenessKey: string;
    icon: string;
  } | null;
  setSelectedProteinInfo: (info: any) => void;
  expandedProtein: string | null;
  setExpandedProtein: (protein: string | null) => void;
  proteinGuideAnimation: Animated.Value;
  donenessAnimation: Animated.Value;
  handleTargetTempChange: (text: string) => void;
  handleRemoveTempChange: (text: string) => void;
  handleInitializeRemoveTemp: () => void;
  handleHideRemoveTemp: () => void;
  updateBothProbeTemps: (target: number, remove: number) => void;
  updateParameter: (key: string, value: any) => void;
  setManualTemp: (temp: string) => void;
  setManualRemoveTemp: (temp: string) => void;
  setShowRemoveTemp: (show: boolean) => void;
}

export const ProbeTemperaturesSection: React.FC<ProbeTemperaturesSectionProps> = ({
  parameters,
  validationErrors,
  showRemoveTemp,
  showProteinGuide,
  setShowProteinGuide,
  selectedProteinInfo,
  setSelectedProteinInfo,
  expandedProtein,
  setExpandedProtein,
  proteinGuideAnimation,
  donenessAnimation,
  handleTargetTempChange,
  handleRemoveTempChange,
  handleInitializeRemoveTemp,
  handleHideRemoveTemp,
  updateBothProbeTemps,
  updateParameter,
  setManualTemp,
  setManualRemoveTemp,
  setShowRemoveTemp,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌡️ Probe Temperatures</Text>
        <ProteinGuideButton
          showProteinGuide={showProteinGuide}
          onPress={() => setShowProteinGuide(!showProteinGuide)}
        />
      </View>

      {/* Protein Guide */}
      <ProteinGuide
        showProteinGuide={showProteinGuide}
        expandedProtein={expandedProtein}
        setExpandedProtein={setExpandedProtein}
        proteinGuideAnimation={proteinGuideAnimation}
        donenessAnimation={donenessAnimation}
        onSelectDoneness={(targetTemp, removeTemp) => {
          // Only set remove temp if it's different from target
          if (removeTemp && removeTemp !== targetTemp) {
            updateBothProbeTemps(targetTemp, removeTemp);
            setManualRemoveTemp(removeTemp.toString());
            setShowRemoveTemp(true);
          } else {
            updateParameter('target_probe_temp', targetTemp);
            setShowRemoveTemp(false);
          }
          setManualTemp(targetTemp.toString());
        }}
        onSelectProteinInfo={(info) => {
          setSelectedProteinInfo(info);
          setExpandedProtein(null);
          setShowProteinGuide(false);
        }}
      />

      {/* Selected Protein Chip */}
      {selectedProteinInfo && (
        <SelectedProteinChip
          proteinInfo={selectedProteinInfo}
          onRemove={() => setSelectedProteinInfo(null)}
        />
      )}

      {/* Temperature Inputs */}
      <View style={styles.inputRow}>
        <TemperatureInput
          label="Target (°F)"
          value={parameters.target_probe_temp}
          onChangeText={handleTargetTempChange}
          hasError={!!validationErrors.target_probe_temp}
        />

        {showRemoveTemp && parameters.target_probe_temp && (
          <TemperatureInput
            label="Remove (°F)"
            value={parameters.remove_probe_temp}
            onChangeText={handleRemoveTempChange}
            hasError={!!validationErrors.remove_probe_temp}
            isWarning={
              !!parameters.remove_probe_temp &&
              parameters.remove_probe_temp !== parameters.target_probe_temp
            }
            showCloseButton
            onClose={handleHideRemoveTemp}
          />
        )}

        {!showRemoveTemp && parameters.target_probe_temp && (
          <AddRemoveTempButton onPress={handleInitializeRemoveTemp} />
        )}
      </View>

      {/* Helper text */}
      {parameters.target_probe_temp && showRemoveTemp && (
        <Text
          style={[
            styles.helperText,
            validationErrors.remove_probe_temp && styles.errorText,
          ]}
        >
          {validationErrors.remove_probe_temp ||
            `Remove temp for carryover cooking (≤ ${parameters.target_probe_temp}°F)`}
        </Text>
      )}

      {/* Target validation error */}
      {validationErrors.target_probe_temp && (
        <Text style={styles.validationError}>{validationErrors.target_probe_temp}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  errorText: {
    color: theme.colors.error.main,
  },
  validationError: {
    color: theme.colors.error.main,
    fontSize: 14,
    marginTop: 4,
  },
});
