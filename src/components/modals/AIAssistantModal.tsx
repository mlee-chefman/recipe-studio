import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import BaseModal from '../BaseModal';

interface RemainingGenerations {
  daily: number;
  dailyLimit: number;
}

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  aiDescription: string;
  onChangeDescription: (text: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  remainingGenerations: RemainingGenerations | null;
}

export function AIAssistantModal({
  visible,
  onClose,
  aiDescription,
  onChangeDescription,
  onGenerate,
  isGenerating,
  remainingGenerations,
}: AIAssistantModalProps) {
  const styles = useStyles(createStyles);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
      maxHeight="70%"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="robot-excited"
            size={28}
            color={theme.colors.primary[500]}
            style={styles.headerIcon}
          />
          <Text style={styles.title}>
            AI Recipe Assistant
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Don't know where to start? Describe what you want to cook and let AI generate a complete recipe for you!
        </Text>

        {/* Remaining generations */}
        {remainingGenerations && (
          <View style={styles.generationsCard}>
            <Text style={styles.generationsText}>
              ✨ {remainingGenerations.daily} of {remainingGenerations.dailyLimit} generations remaining today
            </Text>
          </View>
        )}

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder='e.g., "simple pork chop" or "easy chicken pasta"'
          placeholderTextColor={theme.colors.gray[400]}
          value={aiDescription}
          onChangeText={onChangeDescription}
          editable={!isGenerating}
          multiline
          autoFocus
        />

        {/* Generate Button */}
        <TouchableOpacity
          onPress={onGenerate}
          disabled={isGenerating || !aiDescription.trim()}
          style={[
            styles.generateButton,
            (isGenerating || !aiDescription.trim()) && styles.generateButtonDisabled
          ]}
        >
          {isGenerating ? (
            <View style={styles.generatingContent}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.generateButtonText}>
                Generating Recipe...
              </Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>
              Generate Recipe
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary[700],
  },
  description: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  generationsCard: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  generationsText: {
    fontSize: 14,
    color: theme.colors.primary[700],
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
    shadowOpacity: 0,
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
