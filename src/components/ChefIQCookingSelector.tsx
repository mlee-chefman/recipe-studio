import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cookingFunctions as rj40Functions, getSmartCookerDefaultState } from '@utils/rj40CookingFunctions';
import { cookingFunctions as cq50Functions } from '@utils/cq50CookingFunctions';
import { CookingAction, getApplianceById } from '~/types/chefiq';
import { theme } from '@theme/index';
import {
  TEMPERATURE_GUIDE,
  PROTEIN_LABELS,
  DONENESS_LABELS,
  TemperatureGuide,
  DonenesLevel,
} from '@constants/temperatureGuide';

interface ChefIQCookingSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: CookingAction) => void;
  applianceId: string;
  useProbe?: boolean;
  initialAction?: CookingAction;
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
  initialAction,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [parameters, setParameters] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [expandedProtein, setExpandedProtein] = useState<string | null>(null);
  const [manualTemp, setManualTemp] = useState<string>('');
  const [manualRemoveTemp, setManualRemoveTemp] = useState<string>('');
  const [showProteinGuide, setShowProteinGuide] = useState(false);
  const [selectedProteinInfo, setSelectedProteinInfo] = useState<{ proteinKey: string; donenessKey: string; icon: string } | null>(null);
  const [showRemoveTemp, setShowRemoveTemp] = useState(false);

  // Animations for protein guide and doneness options
  const proteinGuideAnimation = useRef(new Animated.Value(0)).current;
  const donenessAnimation = useRef(new Animated.Value(0)).current;

  const appliance = getApplianceById(applianceId);
  const isRJ40 = appliance?.thing_category_name === 'cooker';
  const isCQ50 = appliance?.thing_category_name === 'oven';
  const methods = isRJ40 ? RJ40_METHODS : CQ50_METHODS;

  useEffect(() => {
    // Only initialize when modal becomes visible
    if (!visible) return;

    if (initialAction) {
      // Load from initial action for editing
      console.log('Loading initial action for editing:', initialAction);
      console.log('Method ID:', initialAction.methodId, 'Type:', typeof initialAction.methodId);
      console.log('Available methods:', methods);

      // For RJ40, ensure methodId is a number. For CQ50, keep as string.
      let methodId = isRJ40 && typeof initialAction.methodId === 'string'
        ? parseInt(initialAction.methodId)
        : initialAction.methodId;

      // If we can't find the method by ID, try to find it by name (for auto-imported recipes)
      if (!methods.find(m => m.id === methodId) && initialAction.methodName) {
        console.log('Method not found by ID, trying by name:', initialAction.methodName);

        // Normalize method names to handle variations
        const normalizedName = initialAction.methodName.toLowerCase().trim();
        const foundMethod = methods.find(m => {
          const methodNameLower = m.name.toLowerCase();
          // Direct match
          if (methodNameLower === normalizedName) return true;
          // Handle "Sauté" -> "Sear/Sauté"
          if (normalizedName === 'sauté' && methodNameLower.includes('sauté')) return true;
          if (normalizedName === 'saute' && methodNameLower.includes('sauté')) return true;
          if (normalizedName === 'sear' && methodNameLower.includes('sear')) return true;
          // Handle "Air Fry" variations
          if (normalizedName === 'air fry' && methodNameLower.includes('air fry')) return true;
          return false;
        });

        if (foundMethod) {
          console.log('Found method by name:', foundMethod);
          methodId = foundMethod.id;
        }
      }

      console.log('Final methodId:', methodId, 'Type:', typeof methodId);
      setSelectedMethod(methodId);
      setParameters(initialAction.parameters || {});
      setValidationErrors({});

      // If editing an existing action with remove temp that's different from target, show the remove temp field
      if (initialAction.parameters?.remove_probe_temp &&
          initialAction.parameters?.target_probe_temp &&
          initialAction.parameters.remove_probe_temp !== initialAction.parameters.target_probe_temp) {
        setShowRemoveTemp(true);
      }
    } else if (isRJ40 && methods.length > 0) {
      const defaultMethod = methods[0];
      setSelectedMethod(defaultMethod.id);
      setParameters(getSmartCookerDefaultState(defaultMethod.id));
      setValidationErrors({});
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
      setValidationErrors({});
    }
  }, [visible, applianceId, isRJ40, isCQ50, methods, initialAction]);

  // Animate protein guide show/hide
  useEffect(() => {
    Animated.timing(proteinGuideAnimation, {
      toValue: showProteinGuide ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showProteinGuide]);

  // Animate doneness options show/hide
  useEffect(() => {
    Animated.timing(donenessAnimation, {
      toValue: expandedProtein ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expandedProtein]);

  const handleMethodChange = (methodId: any) => {
    setSelectedMethod(methodId);
    setValidationErrors({}); // Clear validation errors when changing method

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

  const validateParameter = (key: string, value: any): string | null => {
    // Allow empty strings during editing - don't validate
    if (value === '' || value === undefined || value === null) {
      return null;
    }

    if (isRJ40) {
      const methodSettings = rj40Functions[selectedMethod];
      if (!methodSettings) return null;

      if (key === 'cooking_time' && methodSettings.cookingTime) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return 'Cooking time must be a number';
        // Value is in seconds, so compare to min/max in seconds
        if (numValue < methodSettings.cookingTime.min) {
          return `Cooking time must be at least ${Math.floor(methodSettings.cookingTime.min / 60)} minutes`;
        }
        if (numValue > methodSettings.cookingTime.max) {
          return `Cooking time must not exceed ${Math.floor(methodSettings.cookingTime.max / 60)} minutes`;
        }
      }

      if (key === 'cooking_temp' && methodSettings.cookingTemp) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return 'Temperature must be a number';
        if (numValue < methodSettings.cookingTemp.min) {
          return `Temperature must be at least ${methodSettings.cookingTemp.min}°F`;
        }
        if (numValue > methodSettings.cookingTemp.max) {
          return `Temperature must not exceed ${methodSettings.cookingTemp.max}°F`;
        }
      }
    } else if (isCQ50) {
      const methodSettings = cq50Functions[selectedMethod];
      if (!methodSettings) return null;

      if (key === 'cooking_time' && methodSettings.settings?.cooking_time) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return 'Cooking time must be a number';
        // Value is in seconds, so compare to min/max in seconds
        if (numValue < methodSettings.settings.cooking_time.min) {
          return `Cooking time must be at least ${Math.floor(methodSettings.settings.cooking_time.min / 60)} minutes`;
        }
        if (numValue > methodSettings.settings.cooking_time.max) {
          return `Cooking time must not exceed ${Math.floor(methodSettings.settings.cooking_time.max / 60)} minutes`;
        }
      }

      if (key === 'target_cavity_temp' && methodSettings.settings?.target_cavity_temp) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return 'Temperature must be a number';
        const tempSettings = methodSettings.settings.target_cavity_temp[0];
        if (numValue < tempSettings.min) {
          return `Temperature must be at least ${tempSettings.min}°F`;
        }
        if (numValue > tempSettings.max) {
          return `Temperature must not exceed ${tempSettings.max}°F`;
        }
      }

      if (key === 'target_probe_temp' && useProbe) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return 'Temperature must be a number';
        if (numValue < 100) {
          return 'Probe temperature must be at least 100°F';
        }
        if (numValue > 300) {
          return 'Probe temperature must not exceed 300°F';
        }
      }

      if (key === 'remove_probe_temp' && useProbe) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return 'Temperature must be a number';
        if (numValue < 100) {
          return 'Remove temperature must be at least 100°F';
        }
        if (parameters.target_probe_temp && numValue > parameters.target_probe_temp) {
          return `Remove temperature must not exceed target temperature (${parameters.target_probe_temp}°F)`;
        }
      }
    }

    return null;
  };

  const updateParameter = (key: string, value: any) => {
    setParameters({ ...parameters, [key]: value });

    // Validate the parameter
    const error = validateParameter(key, value);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[key] = error;
      } else {
        delete newErrors[key];
      }
      return newErrors;
    });
  };

  const updateBothProbeTemps = (targetTemp: number, removeTemp: number) => {
    setParameters({ ...parameters, target_probe_temp: targetTemp, remove_probe_temp: removeTemp });

    // Validate target temp
    const targetError = validateParameter('target_probe_temp', targetTemp);

    // Validate remove temp against the NEW target temp
    const removeError = (() => {
      const numValue = parseInt(removeTemp.toString());
      if (isNaN(numValue)) return 'Temperature must be a number';
      if (numValue < 100) return 'Remove temperature must be at least 100°F';
      if (numValue > targetTemp) {
        return `Remove temperature must not exceed target temperature (${targetTemp}°F)`;
      }
      return null;
    })();

    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (targetError) {
        newErrors.target_probe_temp = targetError;
      } else {
        delete newErrors.target_probe_temp;
      }
      if (removeError) {
        newErrors.remove_probe_temp = removeError;
      } else {
        delete newErrors.remove_probe_temp;
      }
      return newErrors;
    });
  };

  const handleTargetTempChange = (text: string) => {
    if (text === '') {
      setParameters({ ...parameters, target_probe_temp: undefined, remove_probe_temp: undefined });
      setManualTemp('');
      setShowRemoveTemp(false);
      return;
    }
    const temp = parseInt(text);
    if (!isNaN(temp)) {
      // Only update remove temp if it's already shown and needs adjustment
      if (showRemoveTemp && parameters.remove_probe_temp) {
        const removeTemp = parameters.remove_probe_temp > temp ? temp : parameters.remove_probe_temp;
        updateBothProbeTemps(temp, removeTemp);
        if (removeTemp !== parameters.remove_probe_temp) {
          setManualRemoveTemp(removeTemp.toString());
        }
      } else {
        updateParameter('target_probe_temp', temp);
      }
      setManualTemp(text);
    }
  };

  const handleInitializeRemoveTemp = () => {
    if (parameters.target_probe_temp) {
      const defaultRemoveTemp = Math.max(100, parameters.target_probe_temp - 5);
      updateParameter('remove_probe_temp', defaultRemoveTemp);
      setManualRemoveTemp(defaultRemoveTemp.toString());
      setShowRemoveTemp(true);
    }
  };

  const handleRemoveTempChange = (text: string) => {
    if (text === '') {
      updateParameter('remove_probe_temp', undefined);
      setManualRemoveTemp('');
      return;
    }
    const temp = parseInt(text);
    if (!isNaN(temp)) {
      updateParameter('remove_probe_temp', temp);
      setManualRemoveTemp(text);
    }
  };

  const handleSave = () => {
    const method = methods.find(m => m.id === selectedMethod);
    if (!method || !applianceId) return;

    // Fill in default values for any undefined parameters
    const finalParameters = { ...parameters };

    if (isRJ40) {
      const methodSettings = rj40Functions[selectedMethod];
      if (methodSettings) {
        if (finalParameters.cooking_time === undefined && methodSettings.cookingTime) {
          finalParameters.cooking_time = methodSettings.cookingTime.default;
        }
        if (finalParameters.cooking_temp === undefined && methodSettings.cookingTemp) {
          finalParameters.cooking_temp = methodSettings.cookingTemp.default;
        }
      }
    } else if (isCQ50) {
      const methodSettings = cq50Functions[selectedMethod];
      if (methodSettings?.settings) {
        if (finalParameters.cooking_time === undefined && methodSettings.settings.cooking_time) {
          finalParameters.cooking_time = methodSettings.settings.cooking_time.default;
        }
        if (finalParameters.target_cavity_temp === undefined && methodSettings.settings.target_cavity_temp) {
          finalParameters.target_cavity_temp = methodSettings.settings.target_cavity_temp[0].default;
        }
        if (finalParameters.target_probe_temp === undefined && useProbe) {
          finalParameters.target_probe_temp = 160;
        }
      }
    }

    const action: CookingAction = {
      id: `action_${Date.now()}`,
      applianceId,
      methodId: selectedMethod,
      methodName: method.name,
      parameters: finalParameters,
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
          <Text className="text-base font-semibold mb-2">Cooking Time (minutes)</Text>
          <View style={{ alignItems: 'flex-start' }}>
            <View
              style={{
                borderWidth: 2,
                borderColor: validationErrors.cooking_time
                  ? theme.colors.error.main
                  : parameters.cooking_time
                    ? theme.colors.primary[500]
                    : theme.colors.gray[300],
                backgroundColor: theme.colors.background.secondary,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              <TextInput
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                  textAlign: 'center',
                  padding: 0,
                  minWidth: 60,
                }}
                value={
                  parameters.cooking_time !== undefined && parameters.cooking_time !== null
                    ? String(Math.floor(parameters.cooking_time / 60))
                    : ''
                }
                placeholder="---"
                placeholderTextColor={theme.colors.gray[400]}
                keyboardType="number-pad"
                returnKeyType="done"
                onChangeText={(text) => {
                  if (text === '') {
                    updateParameter('cooking_time', undefined);
                  } else {
                    const minutes = parseInt(text);
                    if (!isNaN(minutes)) {
                      updateParameter('cooking_time', minutes * 60);
                    }
                  }
                }}
              />
            </View>
          </View>
          {validationErrors.cooking_time && (
            <Text className="text-red-500 text-sm mt-1">{validationErrors.cooking_time}</Text>
          )}
          <Text className="text-gray-500 text-xs mt-1">
            Range: {Math.floor((methodSettings.cookingTime?.min || 0) / 60)} - {Math.floor((methodSettings.cookingTime?.max || 14400) / 60)} minutes
          </Text>
        </View>

        {/* Temperature (for certain methods) */}
        {methodSettings.cookingTemp && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Temperature (°F)</Text>
            <View style={{ alignItems: 'flex-start' }}>
              <View
                style={{
                  borderWidth: 2,
                  borderColor: validationErrors.cooking_temp
                    ? theme.colors.error.main
                    : parameters.cooking_temp
                      ? theme.colors.primary[500]
                      : theme.colors.gray[300],
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  minWidth: 100,
                  alignItems: 'center',
                }}
              >
                <TextInput
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: theme.colors.text.primary,
                    textAlign: 'center',
                    padding: 0,
                    minWidth: 60,
                  }}
                  value={
                    parameters.cooking_temp !== undefined && parameters.cooking_temp !== null
                      ? String(parameters.cooking_temp)
                      : ''
                  }
                  placeholder="---"
                  placeholderTextColor={theme.colors.gray[400]}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onChangeText={(text) => {
                    if (text === '') {
                      updateParameter('cooking_temp', undefined);
                    } else {
                      updateParameter('cooking_temp', text);
                    }
                  }}
                />
              </View>
            </View>
            {validationErrors.cooking_temp && (
              <Text className="text-red-500 text-sm mt-1">{validationErrors.cooking_temp}</Text>
            )}
            <Text className="text-gray-500 text-xs mt-1">
              Range: {methodSettings.cookingTemp.min}°F - {methodSettings.cookingTemp.max}°F
            </Text>
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
        {/* Cooking Time or Probe Temperature */}
        {useProbe ? (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-semibold">🌡️ Probe Temperatures</Text>
              <TouchableOpacity
                onPress={() => setShowProteinGuide(!showProteinGuide)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: showProteinGuide ? theme.colors.primary[500] : theme.colors.primary[100],
                  borderWidth: 1,
                  borderColor: showProteinGuide ? theme.colors.primary[600] : theme.colors.primary[300],
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: showProteinGuide ? 'white' : theme.colors.primary[700] }}>
                  {showProteinGuide ? 'Hide' : 'Suggestions'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Protein Guide - Animated */}
            <Animated.View
              style={{
                maxHeight: proteinGuideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500],
                }),
                opacity: proteinGuideAnimation,
                overflow: 'hidden',
              }}
            >
              {showProteinGuide && (
                <View
                  style={{
                    backgroundColor: theme.colors.gray[50],
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.gray[200],
                  }}
                >
                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 8 }}>
                    Suggested by protein type:
                  </Text>

                  {/* Proteins - Horizontal Scroll */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {TEMPERATURE_GUIDE.map((protein) => {
                      const isSelected = expandedProtein === protein.nameKey;
                      return (
                        <TouchableOpacity
                          key={protein.nameKey}
                          onPress={() => setExpandedProtein(isSelected ? null : protein.nameKey)}
                          className="items-center mr-3"
                          style={{
                            width: 70,
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: isSelected ? theme.colors.primary[50] : theme.colors.background.primary,
                            borderWidth: 1,
                            borderColor: isSelected ? theme.colors.primary[300] : theme.colors.gray[200],
                          }}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: 'rgba(0,0,0,0.08)',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <Image
                              source={{ uri: protein.icon }}
                              style={{ width: 32, height: 32 }}
                              resizeMode="contain"
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: isSelected ? '600' : '500',
                              color: theme.colors.text.primary,
                              textAlign: 'center'
                            }}
                            numberOfLines={2}
                          >
                            {PROTEIN_LABELS[protein.nameKey] || protein.nameKey}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Doneness Options - Animated Horizontal Scroll */}
                  <Animated.View
                    style={{
                      maxHeight: donenessAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                      opacity: donenessAnimation,
                      overflow: 'hidden',
                    }}
                  >
                    {expandedProtein && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.text.secondary, marginBottom: 6 }}>
                          Select doneness:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {TEMPERATURE_GUIDE.find(p => p.nameKey === expandedProtein)?.doneness.map((doneness) => {
                            const protein = TEMPERATURE_GUIDE.find(p => p.nameKey === expandedProtein);
                            return (
                              <TouchableOpacity
                                key={doneness.nameKey}
                                onPress={() => {
                                  // Only set remove temp if it's different from target
                                  if (doneness.removeTemp && doneness.removeTemp !== doneness.targetTemp) {
                                    updateBothProbeTemps(doneness.targetTemp, doneness.removeTemp);
                                    setManualRemoveTemp(doneness.removeTemp.toString());
                                    setShowRemoveTemp(true);
                                  } else {
                                    updateParameter('target_probe_temp', doneness.targetTemp);
                                    setShowRemoveTemp(false);
                                  }
                                  setManualTemp(doneness.targetTemp.toString());
                                  setSelectedProteinInfo({
                                    proteinKey: expandedProtein,
                                    donenessKey: doneness.nameKey,
                                    icon: protein!.icon,
                                  });
                                  setExpandedProtein(null);
                                  setShowProteinGuide(false);
                                }}
                                className="mr-3"
                                style={{
                                  width: 110,
                                  padding: 10,
                                  borderRadius: 8,
                                  backgroundColor: theme.colors.background.primary,
                                  borderWidth: 1,
                                  borderColor: theme.colors.gray[200],
                                }}
                              >
                                <View className="flex-row items-center" style={{ gap: 4, marginBottom: 4 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary }} numberOfLines={1}>
                                    {DONENESS_LABELS[doneness.nameKey] || doneness.nameKey}
                                  </Text>
                                  {doneness.isUsdaApproved && (
                                    <View
                                      className="flex-row items-center px-1 rounded-full"
                                      style={{ backgroundColor: theme.colors.success.light, gap: 2 }}
                                    >
                                      <Feather name="shield" size={8} color={theme.colors.success.main} />
                                    </View>
                                  )}
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary[600] }}>
                                  {doneness.targetTemp}°F
                                </Text>
                                {doneness.removeTemp && doneness.removeTemp !== doneness.targetTemp && (
                                  <Text style={{ fontSize: 10, color: theme.colors.text.secondary }}>
                                    Remove: {doneness.removeTemp}°F
                                  </Text>
                                )}
                                {!doneness.isUsdaApproved && (
                                  <Text style={{ fontSize: 9, color: theme.colors.warning.main, marginTop: 2 }}>
                                    ⚠️ Not USDA
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </Animated.View>
                </View>
              )}
            </Animated.View>

            {/* Selected Protein Info Chip */}
            {selectedProteinInfo && (
              <View
                className="flex-row items-center mb-2 p-2 rounded-lg"
                style={{
                  backgroundColor: theme.colors.primary[50],
                  borderWidth: 1,
                  borderColor: theme.colors.primary[200],
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                  }}
                >
                  <Image
                    source={{ uri: selectedProteinInfo.icon }}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.primary[800] }}>
                  {PROTEIN_LABELS[selectedProteinInfo.proteinKey]} - {DONENESS_LABELS[selectedProteinInfo.donenessKey]}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedProteinInfo(null)}
                  style={{ padding: 4 }}
                >
                  <Feather name="x" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Target and Remove Temperature - Compact with Native Keyboard */}
            <View className="flex-row mb-2" style={{ gap: 12, alignItems: 'flex-start' }}>
              {/* Target Temperature */}
              <View>
                <Text style={{ fontSize: 11, color: theme.colors.text.secondary, marginBottom: 4, height: 15, lineHeight: 15 }}>
                  Target (°F)
                </Text>
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: validationErrors.target_probe_temp
                      ? theme.colors.error.main
                      : parameters.target_probe_temp
                        ? theme.colors.primary[500]
                        : theme.colors.gray[300],
                    backgroundColor: theme.colors.background.secondary,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    minWidth: 90,
                    alignItems: 'center',
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: theme.colors.text.primary,
                      textAlign: 'center',
                      padding: 0,
                      minWidth: 50,
                    }}
                    value={
                      parameters.target_probe_temp !== undefined && parameters.target_probe_temp !== null
                        ? String(parameters.target_probe_temp)
                        : ''
                    }
                    placeholder="---"
                    placeholderTextColor={theme.colors.gray[400]}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onChangeText={handleTargetTempChange}
                  />
                </View>
              </View>

              {/* Remove Temperature - Shows when explicitly requested by user */}
              {showRemoveTemp && parameters.target_probe_temp && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, height: 15 }}>
                    <Text style={{ fontSize: 11, color: theme.colors.text.secondary, flex: 1, lineHeight: 15 }}>
                      Remove (°F)
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowRemoveTemp(false);
                        updateParameter('remove_probe_temp', undefined);
                        setManualRemoveTemp('');
                      }}
                      style={{ padding: 0, marginLeft: 4 }}
                    >
                      <Feather name="x" size={14} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      borderWidth: 2,
                      borderColor: validationErrors.remove_probe_temp
                        ? theme.colors.error.main
                        : parameters.remove_probe_temp && parameters.remove_probe_temp !== parameters.target_probe_temp
                          ? theme.colors.warning.main
                          : theme.colors.gray[300],
                      backgroundColor: theme.colors.background.secondary,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      minWidth: 90,
                      alignItems: 'center',
                    }}
                  >
                    <TextInput
                      style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: theme.colors.text.primary,
                        textAlign: 'center',
                        padding: 0,
                        minWidth: 50,
                      }}
                      value={
                        parameters.remove_probe_temp !== undefined && parameters.remove_probe_temp !== null
                          ? String(parameters.remove_probe_temp)
                          : ''
                      }
                      placeholder="---"
                      placeholderTextColor={theme.colors.gray[400]}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onChangeText={handleRemoveTempChange}
                    />
                  </View>
                </View>
              )}

              {/* Button to add Remove Temperature */}
              {!showRemoveTemp && parameters.target_probe_temp && (
                <View>
                  <View style={{ height: 15, marginBottom: 4 }} />
                  <TouchableOpacity
                    onPress={handleInitializeRemoveTemp}
                    style={{
                      borderWidth: 2,
                      borderColor: theme.colors.primary[300],
                      borderStyle: 'dashed',
                      backgroundColor: theme.colors.primary[50],
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      minWidth: 90,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ height: 24, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, color: theme.colors.primary[600], textAlign: 'center' }}>+</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: theme.colors.primary[700], fontWeight: '600', marginTop: 2 }}>
                      Remove Temp
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Helper text */}
            {parameters.target_probe_temp && showRemoveTemp && (
              <Text style={{ fontSize: 10, color: validationErrors.remove_probe_temp ? theme.colors.error.main : theme.colors.text.secondary, marginBottom: 8 }}>
                {validationErrors.remove_probe_temp || `Remove temp for carryover cooking (≤ ${parameters.target_probe_temp}°F)`}
              </Text>
            )}

            {validationErrors.target_probe_temp && (
              <Text className="text-red-500 text-sm mt-1">{validationErrors.target_probe_temp}</Text>
            )}
          </View>
        ) : (
          settings.cooking_time && (
            <View className="mb-4">
              <Text className="text-base font-semibold mb-2">Cooking Time (minutes)</Text>
              <View style={{ alignItems: 'flex-start' }}>
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: validationErrors.cooking_time
                      ? theme.colors.error.main
                      : parameters.cooking_time
                        ? theme.colors.primary[500]
                        : theme.colors.gray[300],
                    backgroundColor: theme.colors.background.secondary,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: theme.colors.text.primary,
                      textAlign: 'center',
                      padding: 0,
                      minWidth: 60,
                    }}
                    value={
                      parameters.cooking_time !== undefined && parameters.cooking_time !== null
                        ? String(Math.floor(parameters.cooking_time / 60))
                        : ''
                    }
                    placeholder="---"
                    placeholderTextColor={theme.colors.gray[400]}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onChangeText={(text) => {
                      if (text === '') {
                        updateParameter('cooking_time', undefined);
                      } else {
                        const minutes = parseInt(text);
                        if (!isNaN(minutes)) {
                          updateParameter('cooking_time', minutes * 60);
                        }
                      }
                    }}
                  />
                </View>
              </View>
              {validationErrors.cooking_time && (
                <Text className="text-red-500 text-sm mt-1">{validationErrors.cooking_time}</Text>
              )}
              <Text className="text-gray-500 text-xs mt-1">
                Range: {Math.floor(settings.cooking_time.min / 60)} - {Math.floor(settings.cooking_time.max / 60)} minutes
              </Text>
            </View>
          )
        )}

        {/* Temperature */}
        {settings.target_cavity_temp && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Temperature (°F)</Text>
            <View style={{ alignItems: 'flex-start' }}>
              <View
                style={{
                  borderWidth: 2,
                  borderColor: validationErrors.target_cavity_temp
                    ? theme.colors.error.main
                    : parameters.target_cavity_temp
                      ? theme.colors.primary[500]
                      : theme.colors.gray[300],
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  minWidth: 100,
                  alignItems: 'center',
                }}
              >
                <TextInput
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: theme.colors.text.primary,
                    textAlign: 'center',
                    padding: 0,
                    minWidth: 60,
                  }}
                  value={
                    parameters.target_cavity_temp !== undefined && parameters.target_cavity_temp !== null
                      ? String(parameters.target_cavity_temp)
                      : ''
                  }
                  placeholder="---"
                  placeholderTextColor={theme.colors.gray[400]}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onChangeText={(text) => {
                    if (text === '') {
                      updateParameter('target_cavity_temp', undefined);
                    } else {
                      const temp = parseInt(text);
                      if (!isNaN(temp)) {
                        updateParameter('target_cavity_temp', temp);
                      }
                    }
                  }}
                />
              </View>
            </View>
            {validationErrors.target_cavity_temp && (
              <Text className="text-red-500 text-sm mt-1">{validationErrors.target_cavity_temp}</Text>
            )}
            <Text className="text-gray-500 text-xs mt-1">
              Range: {settings.target_cavity_temp[0].min}°F - {settings.target_cavity_temp[0].max}°F
            </Text>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
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

        <ScrollView
          className="flex-1 p-4"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
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
            disabled={Object.keys(validationErrors).length > 0}
            className="rounded-lg py-3"
            style={{
              backgroundColor: Object.keys(validationErrors).length > 0
                ? theme.colors.gray[300]
                : theme.colors.primary[500]
            }}
          >
            <Text className="text-white text-center text-lg font-bold">
              Save Cooking Action
            </Text>
          </TouchableOpacity>
          {Object.keys(validationErrors).length > 0 && (
            <Text className="text-red-500 text-sm text-center mt-2">
              Please fix validation errors before saving
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChefIQCookingSelector;