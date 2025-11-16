import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { CHEFIQ_APPLIANCES, ChefIQAppliance } from '~/types/chefiq';
import { theme, useAppTheme } from '@theme/index';

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
  const appTheme = useAppTheme();

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
      className="flex-row items-center p-3 border-b"
      style={{ borderBottomColor: appTheme.colors.border.light }}
    >
      <Image
        source={{ uri: item.picture }}
        style={{ width: 48, height: 32 }}
        resizeMode="contain"
      />
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium" style={{ color: appTheme.colors.text.primary }}>{item.name}</Text>
        <Text className="text-sm capitalize" style={{ color: appTheme.colors.text.tertiary }}>{item.thing_category_name}</Text>
      </View>
      {selectedAppliance === item.category_id && (
        <Text style={{ color: theme.colors.primary[500] }} className="font-bold">✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderNoneOption = () => (
    <TouchableOpacity
      onPress={() => handleSelect('')}
      className="flex-row items-center p-3 border-b"
      style={{ borderBottomColor: appTheme.colors.border.light }}
    >
      <View className="w-8 h-8 rounded mr-3 items-center justify-center" style={{ backgroundColor: appTheme.colors.gray[200] }}>
        <Text style={{ color: appTheme.colors.text.tertiary }}>—</Text>
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium" style={{ color: appTheme.colors.text.primary }}>None</Text>
        <Text className="text-sm" style={{ color: appTheme.colors.text.tertiary }}>No appliance selected</Text>
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
        className="border rounded-lg px-3 py-3 flex-row items-center justify-between"
        style={{
          backgroundColor: appTheme.colors.surface.primary,
          borderColor: appTheme.colors.border.main
        }}
      >
        <View className="flex-row items-center flex-1">
          {selectedApplianceData ? (
            <>
              <Image
                source={{ uri: selectedApplianceData.picture }}
                style={{ width: 32, height: 20 }}
                resizeMode="contain"
              />
              <Text className="ml-2 text-base" style={{ color: appTheme.colors.text.secondary }}>
                {selectedApplianceData.name}
              </Text>
            </>
          ) : (
            <Text className="text-base" style={{ color: appTheme.colors.text.disabled }}>{placeholder}</Text>
          )}
        </View>
        <Text className="ml-2" style={{ color: appTheme.colors.text.disabled }}>▼</Text>
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
          <View className="rounded-lg mx-4 max-w-sm w-full max-h-96" style={{ backgroundColor: appTheme.colors.surface.primary }}>
            <View className="p-4 border-b" style={{ borderBottomColor: appTheme.colors.border.main }}>
              <Text className="text-lg font-semibold" style={{ color: appTheme.colors.text.primary }}>
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
              className="p-3 border-t"
              style={{ borderTopColor: appTheme.colors.border.main }}
            >
              <Text className="text-center font-medium" style={{ color: theme.colors.primary[500] }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};