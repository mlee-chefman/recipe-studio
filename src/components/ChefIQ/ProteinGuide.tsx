import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';
import {
  TEMPERATURE_GUIDE,
  PROTEIN_LABELS,
  DONENESS_LABELS,
} from '@constants/temperatureGuide';

interface ProteinGuideProps {
  showProteinGuide: boolean;
  expandedProtein: string | null;
  setExpandedProtein: (protein: string | null) => void;
  proteinGuideAnimation: Animated.Value;
  donenessAnimation: Animated.Value;
  onSelectDoneness: (targetTemp: number, removeTemp: number) => void;
  onSelectProteinInfo: (info: { proteinKey: string; donenessKey: string; icon: string }) => void;
}

export const ProteinGuide: React.FC<ProteinGuideProps> = ({
  showProteinGuide,
  expandedProtein,
  setExpandedProtein,
  proteinGuideAnimation,
  donenessAnimation,
  onSelectDoneness,
  onSelectProteinInfo,
}) => {
  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          maxHeight: proteinGuideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 500],
          }),
          opacity: proteinGuideAnimation,
        },
      ]}
    >
      {showProteinGuide && (
        <View style={styles.container}>
          <Text style={styles.subtitle}>Suggested by protein type:</Text>

          {/* Proteins - Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.proteinScroll}>
            {TEMPERATURE_GUIDE.map((protein) => {
              const isSelected = expandedProtein === protein.nameKey;
              return (
                <TouchableOpacity
                  key={protein.nameKey}
                  onPress={() => setExpandedProtein(isSelected ? null : protein.nameKey)}
                  style={[
                    styles.proteinCard,
                    isSelected ? styles.proteinCardSelected : styles.proteinCardUnselected,
                  ]}
                >
                  <View style={styles.proteinIconContainer}>
                    <Image
                      source={{ uri: protein.icon }}
                      style={styles.proteinIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.proteinName,
                      isSelected && styles.proteinNameSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {PROTEIN_LABELS[protein.nameKey] || protein.nameKey}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Doneness Options - Animated Horizontal Scroll */}
          <Animated.View
            style={[
              styles.donenessAnimatedContainer,
              {
                maxHeight: donenessAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: donenessAnimation,
              },
            ]}
          >
            {expandedProtein && (
              <View style={styles.donenessContainer}>
                <Text style={styles.donenessSubtitle}>Select doneness:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {TEMPERATURE_GUIDE.find((p) => p.nameKey === expandedProtein)?.doneness.map(
                    (doneness) => {
                      const protein = TEMPERATURE_GUIDE.find((p) => p.nameKey === expandedProtein);
                      return (
                        <TouchableOpacity
                          key={doneness.nameKey}
                          onPress={() => {
                            onSelectDoneness(
                              doneness.targetTemp,
                              doneness.removeTemp || doneness.targetTemp
                            );
                            onSelectProteinInfo({
                              proteinKey: expandedProtein,
                              donenessKey: doneness.nameKey,
                              icon: protein!.icon,
                            });
                          }}
                          style={styles.donenessCard}
                        >
                          <View style={styles.donenessHeader}>
                            <Text style={styles.donenessName} numberOfLines={1}>
                              {DONENESS_LABELS[doneness.nameKey] || doneness.nameKey}
                            </Text>
                            {doneness.isUsdaApproved && (
                              <View style={styles.usdaBadge}>
                                <Feather name="shield" size={8} color={theme.colors.success.main} />
                              </View>
                            )}
                          </View>
                          <Text style={styles.targetTemp}>{doneness.targetTemp}°F</Text>
                          {doneness.removeTemp &&
                            doneness.removeTemp !== doneness.targetTemp && (
                              <Text style={styles.removeTemp}>
                                Remove: {doneness.removeTemp}°F
                              </Text>
                            )}
                          {!doneness.isUsdaApproved && (
                            <Text style={styles.notUsdaWarning}>⚠️ Not USDA</Text>
                          )}
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    overflow: 'hidden',
  },
  container: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  proteinScroll: {
    marginBottom: 8,
  },
  proteinCard: {
    width: 70,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 12,
  },
  proteinCardSelected: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[300],
  },
  proteinCardUnselected: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.gray[200],
  },
  proteinIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  proteinIcon: {
    width: 32,
    height: 32,
  },
  proteinName: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  proteinNameSelected: {
    fontWeight: '600',
  },
  donenessAnimatedContainer: {
    overflow: 'hidden',
  },
  donenessContainer: {
    marginTop: 4,
  },
  donenessSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  donenessCard: {
    width: 110,
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    marginRight: 12,
  },
  donenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  donenessName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  usdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.success.light,
    gap: 2,
  },
  targetTemp: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary[600],
  },
  removeTemp: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  notUsdaWarning: {
    fontSize: 9,
    color: theme.colors.warning.main,
    marginTop: 2,
  },
});
