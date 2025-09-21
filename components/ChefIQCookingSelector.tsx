import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { cookingFunctions as rj40Functions, getSmartCookerDefaultState } from '../utils/rj40CookingFunctions';
import { cookingFunctions as cq50Functions } from '../utils/cq50CookingFunctions';
import { CookingAction, getApplianceById } from '../types/chefiq';
import { theme } from '../theme';

interface ChefIQCookingSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: CookingAction) => void;
  applianceId: string;
  useProbe?: boolean;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

const RJ40_METHODS = [
  { id: 0, name: 'Pressure Cook', icon: '🍲' },
  { id: 1, name: 'Sear/Sauté', icon: '🔥' },
  { id: 2, name: 'Steam', icon: '💨' },
  { id: 3, name: 'Slow Cook', icon: '🥘' },
  { id: 15, name: 'Keep Warm', icon: '♨️' },
  { id: 16, name: 'Ferment', icon: '🥛' },
  { id: 17, name: 'Sterilize', icon: '🧼' },
  { id: 5, name: 'Sous Vide', icon: '🌊' },
];

const CQ50_METHODS = [
  { id: 'METHOD_AIR_FRY', name: 'Air Fry', icon: '🍟' },
  { id: 'METHOD_BAKE', name: 'Bake', icon: '🍞' },
  { id: 'METHOD_ROAST', name: 'Roast', icon: '🍖' },
  { id: 'METHOD_BROIL', name: 'Broil', icon: '🔥' },
  { id: 'METHOD_AIR_BROIL', name: 'Air Broil', icon: '💨🔥' },
  { id: 'METHOD_TOAST', name: 'Toast', icon: '🍞' },
  { id: 'METHOD_DEHYDRATE', name: 'Dehydrate', icon: '🍇' },
  { id: 'METHOD_PROOF', name: 'Proof', icon: '🥖' },
  { id: 'METHOD_REHEAT', name: 'Reheat', icon: '♨️' },
  { id: 'METHOD_KEEP_WARM', name: 'Keep Warm', icon: '🔆' },
  { id: 'METHOD_SLOW_COOK', name: 'Slow Cook', icon: '🥘' },
];

const ChefIQCookingSelector: React.FC<ChefIQCookingSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  applianceId,
  useProbe = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [parameters, setParameters] = useState<any>({});

  const appliance = getApplianceById(applianceId);
  const isRJ40 = appliance?.thing_category_name === 'cooker';
  const isCQ50 = appliance?.thing_category_name === 'oven';
  const methods = isRJ40 ? RJ40_METHODS : CQ50_METHODS;

  useEffect(() => {
    if (isRJ40 && methods.length > 0) {
      const defaultMethod = methods[0];
      setSelectedMethod(defaultMethod.id);
      setParameters(getSmartCookerDefaultState(defaultMethod.id));
    } else if (isCQ50 && methods.length > 0) {
      const defaultMethod = methods[0];
      setSelectedMethod(defaultMethod.id);
      const methodSettings = cq50Functions[defaultMethod.id];
      setParameters({
        cooking_time: methodSettings?.settings?.cooking_time?.default || 1800,
        target_cavity_temp: methodSettings?.settings?.target_cavity_temp?.[0]?.default || 350,
        fan_speed: methodSettings?.settings?.fan_speed?.default || 0,
        temp_level: methodSettings?.settings?.temp_level?.default,
        shade_level: methodSettings?.settings?.shade_level?.default,
      });
    }
  }, [applianceId, isRJ40, isCQ50, methods]);

  const handleMethodChange = (methodId: any) => {
    setSelectedMethod(methodId);

    if (isRJ40) {
      setParameters(getSmartCookerDefaultState(methodId));
    } else if (isCQ50) {
      const methodSettings = cq50Functions[methodId];
      setParameters({
        cooking_time: methodSettings?.settings?.cooking_time?.default || 1800,
        target_cavity_temp: methodSettings?.settings?.target_cavity_temp?.[0]?.default || 350,
        fan_speed: methodSettings?.settings?.fan_speed?.default || 0,
        temp_level: methodSettings?.settings?.temp_level?.default,
        shade_level: methodSettings?.settings?.shade_level?.default,
        auto_start: methodSettings?.settings?.auto_start?.default,
        keep_warm: methodSettings?.settings?.keep_warm?.default,
      });
    }
  };

  const updateParameter = (key: string, value: any) => {
    setParameters({ ...parameters, [key]: value });
  };

  const handleSave = () => {
    const method = methods.find(m => m.id === selectedMethod);
    if (!method || !applianceId) return;

    const action: CookingAction = {
      id: `action_${Date.now()}`,
      applianceId,
      methodId: selectedMethod,
      methodName: method.name,
      parameters,
    };

    onSelect(action);
  };

  const renderRJ40Parameters = () => {
    const methodSettings = rj40Functions[selectedMethod];
    if (!methodSettings) return null;

    return (
      <View className="mt-4">
        {/* Cooking Time */}
        <View className="mb-4">
          <Text className="text-base font-semibold mb-2">Cooking Time</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
              value={formatTime(parameters.cooking_time || methodSettings.cookingTime?.default || 900)}
              editable={false}
            />
            <View className="flex-row ml-2">
              <TouchableOpacity
                onPress={() => {
                  const current = parameters.cooking_time || methodSettings.cookingTime?.default || 900;
                  const min = methodSettings.cookingTime?.min || 0;
                  const granularity = methodSettings.cookingTime?.granularity || 60;
                  const newValue = Math.max(min, current - granularity);
                  updateParameter('cooking_time', newValue);
                }}
                className="bg-gray-200 px-3 py-2 rounded-l-lg"
              >
                <Text className="font-bold">-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const current = parameters.cooking_time || methodSettings.cookingTime?.default || 900;
                  const max = methodSettings.cookingTime?.max || 14400;
                  const granularity = methodSettings.cookingTime?.granularity || 60;
                  const newValue = Math.min(max, current + granularity);
                  updateParameter('cooking_time', newValue);
                }}
                className="bg-gray-200 px-3 py-2 rounded-r-lg border-l border-gray-300"
              >
                <Text className="font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Temperature (for certain methods) */}
        {methodSettings.cookingTemp && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Temperature (°F)</Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
                value={String(parameters.cooking_temp || methodSettings.cookingTemp.default)}
                keyboardType="numeric"
                onChangeText={(text) => updateParameter('cooking_temp', parseInt(text) || 0)}
              />
            </View>
          </View>
        )}

        {/* Pressure Level (for pressure cooking) */}
        {selectedMethod === 0 && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Pressure Level</Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => updateParameter('pres_level', 1)}
                className="flex-1 py-2 px-4 rounded-l-lg"
                style={{
                  backgroundColor: parameters.pres_level === 1 ? theme.colors.primary[500] : theme.colors.gray[200]
                }}
              >
                <Text className={`text-center font-semibold ${
                  parameters.pres_level === 1 ? 'text-white' : 'text-gray-700'
                }`}>High</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateParameter('pres_level', 0)}
                className="flex-1 py-2 px-4 rounded-r-lg border-l"
                style={{
                  backgroundColor: parameters.pres_level === 0 ? theme.colors.primary[500] : theme.colors.gray[200]
                }}
              >
                <Text className={`text-center font-semibold ${
                  parameters.pres_level === 0 ? 'text-white' : 'text-gray-700'
                }`}>Low</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pressure Release (for pressure cooking) */}
        {selectedMethod === 0 && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Pressure Release</Text>
            <View className="flex-row">
              {['Quick', 'Pulse', 'Natural'].map((release, index) => (
                <TouchableOpacity
                  key={release}
                  onPress={() => updateParameter('pres_release', index)}
                  className={`flex-1 py-2 px-4 ${
                    index === 0 ? 'rounded-l-lg' : index === 2 ? 'rounded-r-lg' : ''
                  } ${
                    parameters.pres_release === index ? 'bg-green-500' : 'bg-gray-200'
                  } ${index > 0 ? 'border-l' : ''}`}
                >
                  <Text className={`text-center font-semibold text-sm ${
                    parameters.pres_release === index ? 'text-white' : 'text-gray-700'
                  }`}>{release}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Keep Warm */}
        {(selectedMethod === 0 || selectedMethod === 3) && (
          <View className="mb-4 flex-row justify-between items-center">
            <Text className="text-base font-semibold">Keep Warm</Text>
            <Switch
              value={parameters.keep_warm === 1}
              onValueChange={(value) => updateParameter('keep_warm', value ? 1 : 0)}
            />
          </View>
        )}
      </View>
    );
  };

  const renderCQ50Parameters = () => {
    const methodSettings = cq50Functions[selectedMethod];
    if (!methodSettings) return null;

    const settings = methodSettings.settings;

    return (
      <View className="mt-4">
        {/* Cooking Time or Target Temperature */}
        {useProbe ? (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">🌡️ Target Temperature (°F)</Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 border border-orange-300 rounded-lg px-3 py-2 text-base bg-orange-50"
                value={String(parameters.target_probe_temp || 160)}
                keyboardType="numeric"
                onChangeText={(text) => updateParameter('target_probe_temp', parseInt(text) || 160)}
              />
              <View className="flex-row ml-2">
                <TouchableOpacity
                  onPress={() => {
                    const current = parameters.target_probe_temp || 160;
                    const newValue = Math.max(100, current - 5);
                    updateParameter('target_probe_temp', newValue);
                  }}
                  className="bg-orange-200 px-3 py-2 rounded-l-lg"
                >
                  <Text className="font-bold text-orange-800">-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const current = parameters.target_probe_temp || 160;
                    const newValue = Math.min(300, current + 5);
                    updateParameter('target_probe_temp', newValue);
                  }}
                  className="bg-orange-200 px-3 py-2 rounded-r-lg border-l border-orange-300"
                >
                  <Text className="font-bold text-orange-800">+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-xs text-orange-600 mt-1">
              Probe will monitor internal temperature (100-300°F)
            </Text>
          </View>
        ) : (
          settings.cooking_time && (
            <View className="mb-4">
              <Text className="text-base font-semibold mb-2">Cooking Time</Text>
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
                  value={formatTime(parameters.cooking_time || settings.cooking_time.default)}
                  editable={false}
                />
                <View className="flex-row ml-2">
                  <TouchableOpacity
                    onPress={() => {
                      const current = parameters.cooking_time || settings.cooking_time.default;
                      const min = settings.cooking_time.min;
                      const granularity = settings.cooking_time.granularity;
                      const newValue = Math.max(min, current - granularity);
                      updateParameter('cooking_time', newValue);
                    }}
                    className="bg-gray-200 px-3 py-2 rounded-l-lg"
                  >
                    <Text className="font-bold">-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const current = parameters.cooking_time || settings.cooking_time.default;
                      const max = settings.cooking_time.max;
                      const granularity = settings.cooking_time.granularity;
                      const newValue = Math.min(max, current + granularity);
                      updateParameter('cooking_time', newValue);
                    }}
                    className="bg-gray-200 px-3 py-2 rounded-r-lg border-l border-gray-300"
                  >
                    <Text className="font-bold">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        )}

        {/* Temperature */}
        {settings.target_cavity_temp && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Temperature (°F)</Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
                value={String(parameters.target_cavity_temp || settings.target_cavity_temp[0].default)}
                keyboardType="numeric"
                onChangeText={(text) => updateParameter('target_cavity_temp', parseInt(text) || 0)}
              />
            </View>
          </View>
        )}

        {/* Temperature Level (for broil methods) */}
        {settings.temp_level && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Temperature Level</Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => updateParameter('temp_level', 0)}
                className={`flex-1 py-2 px-4 rounded-l-lg ${
                  parameters.temp_level === 0 ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  parameters.temp_level === 0 ? 'text-white' : 'text-gray-700'
                }`}>Low</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateParameter('temp_level', 1)}
                className={`flex-1 py-2 px-4 rounded-r-lg border-l ${
                  parameters.temp_level === 1 ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  parameters.temp_level === 1 ? 'text-white' : 'text-gray-700'
                }`}>High</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Fan Speed */}
        {settings.fan_speed && settings.fan_speed.options && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Fan Speed</Text>
            <View className="flex-row">
              {['Off', 'Low', 'Med', 'High'].map((speed, index) => {
                if (!settings.fan_speed.options?.includes(index)) return null;
                return (
                  <TouchableOpacity
                    key={speed}
                    onPress={() => updateParameter('fan_speed', index)}
                    className={`flex-1 py-2 px-3 ${
                      index === 0 ? 'rounded-l-lg' : index === 3 ? 'rounded-r-lg' : ''
                    } ${
                      parameters.fan_speed === index ? 'bg-green-500' : 'bg-gray-200'
                    } ${index > 0 ? 'border-l' : ''}`}
                  >
                    <Text className={`text-center font-semibold text-xs ${
                      parameters.fan_speed === index ? 'text-white' : 'text-gray-700'
                    }`}>{speed}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Keep Warm */}
        {settings.keep_warm && (
          <View className="mb-4 flex-row justify-between items-center">
            <Text className="text-base font-semibold">Keep Warm</Text>
            <Switch
              value={parameters.keep_warm}
              onValueChange={(value) => updateParameter('keep_warm', value)}
            />
          </View>
        )}

        {/* Auto Start */}
        {settings.auto_start && (
          <View className="mb-4 flex-row justify-between items-center">
            <Text className="text-base font-semibold">Auto Start</Text>
            <Switch
              value={parameters.auto_start !== false}
              onValueChange={(value) => updateParameter('auto_start', value)}
            />
          </View>
        )}
      </View>
    );
  };

  if (!applianceId) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <View className="flex-1">
            <Text className="text-xl font-bold">
              {appliance?.name || 'ChefIQ'} Settings
            </Text>
            {useProbe && (
              <Text className="text-sm text-orange-600 mt-1">
                🌡️ Thermometer Probe Mode
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-lg text-gray-600 font-bold">×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Method Selection */}
          <View className="mb-4">
            <Text className="text-lg font-semibold mb-2">Cooking Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {methods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => handleMethodChange(method.id)}
                  className={`mr-3 px-4 py-3 rounded-lg ${
                    selectedMethod === method.id ? 'bg-green-500' : 'bg-gray-100'
                  }`}
                >
                  <Text className="text-2xl text-center mb-1">{method.icon}</Text>
                  <Text className={`text-sm font-semibold ${
                    selectedMethod === method.id ? 'text-white' : 'text-gray-700'
                  }`}>{method.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Parameters */}
          {isRJ40 ? renderRJ40Parameters() : renderCQ50Parameters()}
        </ScrollView>

        {/* Save Button */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSave}
            className="rounded-lg py-3"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            <Text className="text-white text-center text-lg font-bold">
              Save Cooking Action
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ChefIQCookingSelector;