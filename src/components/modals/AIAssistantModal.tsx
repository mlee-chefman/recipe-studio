import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@theme/index';

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
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
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
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary[700],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  generateButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
});
