import * as React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { theme } from '../theme';
import { CHEFIQ_APPLIANCES } from '../types/chefiq';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  difficulties: string[];
  allTags: string[];
  appliances: Array<{ id: string; name: string }>;
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

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">{title}</Text>
      
      {/* Dropdown Button */}
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row justify-between items-center"
      >
        <Text className={`text-base ${selectedValue ? 'text-gray-800' : 'text-gray-500'}`}>
          {selectedValue || placeholder}
        </Text>
        <Text className={`text-gray-500 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Dropdown Options */}
      {isOpen && (
        <View
          className="bg-white border border-gray-300 border-t-0 rounded-b-lg"
          style={{ maxHeight: 280 }}
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
              className="px-4 py-3 border-b border-gray-100"
            >
              <Text className="text-base text-gray-500 italic">Clear selection</Text>
            </TouchableOpacity>

            {/* Options */}
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className="px-4 py-3 border-b border-gray-100"
                style={{
                  backgroundColor: selectedValue === option ? theme.colors.primary[50] : 'transparent'
                }}
              >
                <Text className="text-base" style={{
                  color: selectedValue === option ? theme.colors.primary[700] : theme.colors.text.primary,
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
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => onToggle(tag)}
              className="px-3 py-2 rounded-full"
              style={{
                backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[100],
                borderWidth: 1,
                borderColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[300]
              }}
            >
              <Text
                className="text-sm"
                style={{
                  color: isSelected ? 'white' : theme.colors.text.primary,
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
        <Text className="text-xs mt-2" style={{ color: theme.colors.text.secondary }}>
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
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
          <Text className="text-xl font-bold text-gray-800">Filter Recipes</Text>
          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-100 rounded-full w-8 h-8 items-center justify-center"
          >
            <Text className="text-gray-600 font-bold text-lg">×</Text>
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
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 items-center mt-4"
            >
              <Text className="text-red-700 font-medium text-base">Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t border-gray-200 bg-white">
          <TouchableOpacity
            onPress={onClose}
            className="rounded-lg px-6 py-3 items-center"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            <Text className="text-white font-semibold text-base">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
