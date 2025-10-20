import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { theme } from '@theme/index';
import { RECIPE_OPTIONS } from '@constants/recipeDefaults';
import BaseModal from '../BaseModal';

interface TagsPickerModalProps {
  visible: boolean;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onAddCustomTag: (tag: string) => void;
  onClose: () => void;
}

export function TagsPickerModal({
  visible,
  selectedTags,
  onToggleTag,
  onAddCustomTag,
  onClose,
}: TagsPickerModalProps) {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      maxHeight="70%"
      backdropOpacity={0.3}
    >
      <View style={styles.header}>
        <View />
        <Text style={styles.title}>Add Tags</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneButton}>Done</Text>
        </TouchableOpacity>
      </View>
          <KeyboardAwareScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Common Tags</Text>
            <View style={styles.tagsGrid}>
              {RECIPE_OPTIONS.COMMON_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => onToggleTag(tag)}
                    style={[
                      styles.tagButton,
                      isSelected && styles.tagButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextSelected,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Custom Tag</Text>
            <View style={styles.customTagRow}>
              <TextInput
                style={styles.customTagInput}
                placeholder="Enter custom tag"
                onSubmitEditing={(e) => {
                  const customTag = e.nativeEvent.text.trim();
                  if (customTag && !selectedTags.includes(customTag)) {
                    onAddCustomTag(customTag);
                    // @ts-ignore
                    e.target.clear();
                  }
                }}
                returnKeyType="done"
              />
            </View>
      </KeyboardAwareScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  doneButton: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[500],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  tagButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  tagButtonSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  tagText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  tagTextSelected: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
  },
});
