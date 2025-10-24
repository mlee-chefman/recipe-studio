import * as React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme } from '~/theme';
import { SortOption } from '@store/store';
import { Ionicons } from '@expo/vector-icons';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'newest', label: 'Newest First', description: 'Most recently created recipes first', icon: 'calendar-outline' },
  { value: 'oldest', label: 'Oldest First', description: 'Oldest recipes first', icon: 'time-outline' },
  { value: 'title-asc', label: 'Title (A-Z)', description: 'Alphabetical order', icon: 'text-outline' },
  { value: 'title-desc', label: 'Title (Z-A)', description: 'Reverse alphabetical order', icon: 'text-outline' },
  { value: 'cooktime-asc', label: 'Cook Time (Low to High)', description: 'Shortest cooking time first', icon: 'hourglass-outline' },
  { value: 'cooktime-desc', label: 'Cook Time (High to Low)', description: 'Longest cooking time first', icon: 'hourglass-outline' },
];

export const SortModal = ({ visible, onClose, selectedSort, onSortChange }: SortModalProps) => {
  const appTheme = useAppTheme();

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl"
          style={[
            styles.modalContent,
            { backgroundColor: appTheme.colors.background.primary }
          ]}
        >
          {/* Header */}
          <View className="px-6 py-4 border-b" style={{ borderBottomColor: appTheme.colors.border.light }}>
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold" style={{ color: appTheme.colors.text.primary }}>
                Sort By
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="close" size={24} color={appTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Options */}
          <ScrollView
            className="px-6 py-4"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 500 }}
          >
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSortSelect(option.value)}
                className="flex-row items-center py-4 border-b"
                style={{ borderBottomColor: appTheme.colors.border.light }}
              >
                {/* Icon */}
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: selectedSort === option.value
                      ? appTheme.colors.primary[100]
                      : appTheme.colors.gray[100]
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={selectedSort === option.value
                      ? appTheme.colors.primary[600]
                      : appTheme.colors.text.secondary
                    }
                  />
                </View>

                {/* Label and Description */}
                <View className="flex-1">
                  <Text
                    className="text-base font-medium mb-1"
                    style={{
                      color: selectedSort === option.value
                        ? appTheme.colors.primary[600]
                        : appTheme.colors.text.primary
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ color: appTheme.colors.text.secondary }}
                  >
                    {option.description}
                  </Text>
                </View>

                {/* Check Icon */}
                {selectedSort === option.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={appTheme.colors.primary[500]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
});
