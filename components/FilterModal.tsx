import * as React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  difficulties: string[];
  selectedCategory: string;
  selectedDifficulty: string;
  onCategoryChange: (category: string) => void;
  onDifficultyChange: (difficulty: string) => void;
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
        <View className="bg-white border border-gray-300 border-t-0 rounded-b-lg max-h-40">
          <ScrollView showsVerticalScrollIndicator={false}>
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
                className={`px-4 py-3 border-b border-gray-100 ${
                  selectedValue === option ? 'bg-blue-50' : ''
                }`}
              >
                <Text className={`text-base ${
                  selectedValue === option ? 'text-blue-700 font-medium' : 'text-gray-800'
                }`}>
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

export const FilterModal = ({
  visible,
  onClose,
  categories,
  difficulties,
  selectedCategory,
  selectedDifficulty,
  onCategoryChange,
  onDifficultyChange,
  onClearFilters
}: FilterModalProps) => {
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

          {/* Clear All Filters Button */}
          {(selectedCategory || selectedDifficulty) && (
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
            className="bg-blue-500 rounded-lg px-6 py-3 items-center"
          >
            <Text className="text-white font-semibold text-base">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
