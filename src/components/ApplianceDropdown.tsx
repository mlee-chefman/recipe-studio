import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { CHEFIQ_APPLIANCES, ChefIQAppliance } from '@types/chefiq';
import { theme } from '@theme/index';

interface ApplianceDropdownProps {
  selectedAppliance: string;
  onSelect: (categoryId: string) => void;
  placeholder?: string;
}

export const ApplianceDropdown: React.FC<ApplianceDropdownProps> = ({
  selectedAppliance,
  onSelect,
  placeholder = 'Select ChefIQ Appliance...'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedApplianceData = CHEFIQ_APPLIANCES.find(
    appliance => appliance.category_id === selectedAppliance
  );

  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    setIsOpen(false);
  };

  const renderApplianceItem = ({ item }: { item: ChefIQAppliance }) => (
    <TouchableOpacity
      onPress={() => handleSelect(item.category_id)}
      className="flex-row items-center p-3 border-b border-gray-100"
    >
      <Image
        source={{ uri: item.picture }}
        style={{ width: 48, height: 32 }}
        resizeMode="contain"
      />
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-gray-800">{item.name}</Text>
        <Text className="text-sm text-gray-500 capitalize">{item.thing_category_name}</Text>
      </View>
      {selectedAppliance === item.category_id && (
        <Text style={{ color: theme.colors.primary[500] }} className="font-bold">✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderNoneOption = () => (
    <TouchableOpacity
      onPress={() => handleSelect('')}
      className="flex-row items-center p-3 border-b border-gray-100"
    >
      <View className="w-8 h-8 bg-gray-200 rounded mr-3 items-center justify-center">
        <Text className="text-gray-500">—</Text>
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-gray-800">None</Text>
        <Text className="text-sm text-gray-500">No appliance selected</Text>
      </View>
      {!selectedAppliance && (
        <Text style={{ color: theme.colors.primary[500] }} className="font-bold">✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      {/* Dropdown Button */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          {selectedApplianceData ? (
            <>
              <Image
                source={{ uri: selectedApplianceData.picture }}
                style={{ width: 32, height: 20 }}
                resizeMode="contain"
              />
              <Text className="ml-2 text-base text-gray-700">
                {selectedApplianceData.name}
              </Text>
            </>
          ) : (
            <Text className="text-base text-gray-500">{placeholder}</Text>
          )}
        </View>
        <Text className="text-gray-400 ml-2">▼</Text>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-lg mx-4 max-w-sm w-full max-h-96">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">
                Select Appliance
              </Text>
            </View>

            <FlatList
              data={[null, ...CHEFIQ_APPLIANCES.sort((a, b) => a.order - b.order)]}
              keyExtractor={(item) => item?.category_id || 'none'}
              renderItem={({ item }) =>
                item ? renderApplianceItem({ item }) : renderNoneOption()
              }
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 300 }}
            />

            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              className="p-3 border-t border-gray-200"
            >
              <Text className="text-center font-medium" style={{ color: theme.colors.primary[500] }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};