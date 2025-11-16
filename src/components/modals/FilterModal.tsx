import * as React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useAppTheme } from '~/theme';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  difficulties: string[];
  allTags: string[];
  appliances: { id: string; name: string }[];
  selectedCategory: string;
  selectedDifficulty: string;
  selectedTags: string[];
  selectedAppliance: string;
  onCategoryChange: (category: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onTagsChange: (tags: string[]) => void;
  onApplianceChange: (appliance: string) => void;
  onClearFilters: () => void;
}

const DropdownSection = ({
  title,
  options,
  selectedValue,
  onSelect,
  placeholder
}: {
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const appTheme = useAppTheme();

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3" style={{ color: appTheme.colors.text.primary }}>{title}</Text>

      {/* Dropdown Button */}
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="border rounded-lg px-4 py-3 flex-row justify-between items-center"
        style={{
          backgroundColor: appTheme.colors.surface.primary,
          borderColor: appTheme.colors.border.main
        }}
      >
        <Text className="text-base" style={{
          color: selectedValue ? appTheme.colors.text.primary : appTheme.colors.text.disabled
        }}>
          {selectedValue || placeholder}
        </Text>
        <Text className={`transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} style={{ color: appTheme.colors.text.tertiary }}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Dropdown Options */}
      {isOpen && (
        <View
          className="border border-t-0 rounded-b-lg"
          style={{
            maxHeight: 280,
            backgroundColor: appTheme.colors.surface.primary,
            borderColor: appTheme.colors.border.main
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            style={{ maxHeight: 280 }}
          >
            {/* Clear option */}
            <TouchableOpacity
              onPress={() => {
                onSelect('');
                setIsOpen(false);
              }}
              className="px-4 py-3 border-b"
              style={{ borderBottomColor: appTheme.colors.border.light }}
            >
              <Text className="text-base italic" style={{ color: appTheme.colors.text.disabled }}>Clear selection</Text>
            </TouchableOpacity>

            {/* Options */}
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className="px-4 py-3 border-b"
                style={{
                  backgroundColor: selectedValue === option ? appTheme.colors.primary[50] : 'transparent',
                  borderBottomColor: appTheme.colors.border.light
                }}
              >
                <Text className="text-base" style={{
                  color: selectedValue === option ? appTheme.colors.primary[700] : appTheme.colors.text.primary,
                  fontWeight: selectedValue === option ? '500' : '400'
                }}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const TagsSection = ({
  title,
  options,
  selectedTags,
  onToggle
}: {
  title: string;
  options: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}) => {
  const appTheme = useAppTheme();

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3" style={{ color: appTheme.colors.text.primary }}>{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => onToggle(tag)}
              className="px-3 py-2 rounded-full"
              style={{
                backgroundColor: isSelected ? appTheme.colors.primary[500] : appTheme.colors.gray[100],
                borderWidth: 1,
                borderColor: isSelected ? appTheme.colors.primary[500] : appTheme.colors.gray[300]
              }}
            >
              <Text
                className="text-sm"
                style={{
                  color: isSelected ? 'white' : appTheme.colors.text.primary,
                  fontWeight: isSelected ? '600' : '400'
                }}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedTags.length > 0 && (
        <Text className="text-xs mt-2" style={{ color: appTheme.colors.text.secondary }}>
          Recipes must have ALL selected tags ({selectedTags.length} selected)
        </Text>
      )}
    </View>
  );
};

export const FilterModal = ({
  visible,
  onClose,
  categories,
  difficulties,
  allTags,
  appliances,
  selectedCategory,
  selectedDifficulty,
  selectedTags,
  selectedAppliance,
  onCategoryChange,
  onDifficultyChange,
  onTagsChange,
  onApplianceChange,
  onClearFilters
}: FilterModalProps) => {
  const appTheme = useAppTheme();

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const hasActiveFilters = selectedCategory || selectedDifficulty || selectedTags.length > 0 || selectedAppliance;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: appTheme.colors.background.secondary }}>
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b" style={{
          backgroundColor: appTheme.colors.background.primary,
          borderBottomColor: appTheme.colors.border.main
        }}>
          <Text className="text-xl font-bold" style={{ color: appTheme.colors.text.primary }}>Filter Recipes</Text>
          <TouchableOpacity
            onPress={onClose}
            className="rounded-full w-8 h-8 items-center justify-center"
            style={{ backgroundColor: appTheme.colors.gray[100] }}
          >
            <Text className="font-bold text-lg" style={{ color: appTheme.colors.text.secondary }}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4">
          {/* Category Dropdown */}
          <DropdownSection
            title="Category"
            options={categories}
            selectedValue={selectedCategory}
            onSelect={onCategoryChange}
            placeholder="Select a category"
          />

          {/* Difficulty Dropdown */}
          <DropdownSection
            title="Difficulty"
            options={difficulties}
            selectedValue={selectedDifficulty}
            onSelect={onDifficultyChange}
            placeholder="Select difficulty level"
          />

          {/* ChefIQ Appliance Dropdown */}
          {appliances.length > 0 && (
            <DropdownSection
              title="ChefIQ Appliance"
              options={appliances.map(a => a.name)}
              selectedValue={appliances.find(a => a.id === selectedAppliance)?.name || ''}
              onSelect={(name) => {
                const appliance = appliances.find(a => a.name === name);
                onApplianceChange(appliance?.id || '');
              }}
              placeholder="Select an appliance"
            />
          )}

          {/* Tags Multi-Select */}
          {allTags.length > 0 && (
            <TagsSection
              title="Tags"
              options={allTags}
              selectedTags={selectedTags}
              onToggle={handleTagToggle}
            />
          )}

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={onClearFilters}
              className="border rounded-lg px-4 py-3 items-center mt-4"
              style={{
                backgroundColor: appTheme.colors.error.light,
                borderColor: appTheme.colors.error.dark
              }}
            >
              <Text className="font-medium text-base" style={{ color: appTheme.colors.error.dark }}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t" style={{
          backgroundColor: appTheme.colors.background.primary,
          borderTopColor: appTheme.colors.border.main
        }}>
          <TouchableOpacity
            onPress={onClose}
            className="rounded-lg px-6 py-3 items-center"
            style={{ backgroundColor: appTheme.colors.primary[500] }}
          >
            <Text className="text-white font-semibold text-base">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
