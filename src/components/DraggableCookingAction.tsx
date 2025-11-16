import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { CookingAction, getApplianceById } from '~/types/chefiq';
import { getCookingMethodIcon, formatKeyParameters } from '@utils/cookingActionHelpers';
import { theme, useAppTheme } from '@theme/index';

interface DraggableCookingActionProps {
  cookingAction: CookingAction;
  currentStepIndex: number;
  onDragStart: () => void;
  onDragEnd: (fromStepIndex: number, targetStepIndex: number) => void;
  onRemove: () => void;
  onEdit: () => void;
  onShowTempInfo?: () => void;
  selectedAppliance?: string;
  isReorderMode?: boolean;
}

export function DraggableCookingAction({
  cookingAction,
  currentStepIndex,
  onDragStart,
  onDragEnd,
  onRemove,
  onEdit,
  onShowTempInfo,
  selectedAppliance,
  isReorderMode = false,
}: DraggableCookingActionProps) {
  const appTheme = useAppTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      runOnJS(onDragStart)();
      scale.value = withSpring(1.1);
      opacity.value = withSpring(0.8);
    },
    onActive: (event) => {
      // Only allow vertical movement
      translateX.value = 0;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      // Calculate which step this was dropped on based on Y position
      const stepHeight = 120; // More accurate height including cooking action
      let targetStepIndex = currentStepIndex;

      // Only move if dragged significantly
      if (Math.abs(event.translationY) > 40) {
        const steps = Math.round(event.translationY / stepHeight);
        targetStepIndex = currentStepIndex + steps;

        // Clamp to valid range - don't let it go negative
        targetStepIndex = Math.max(0, targetStepIndex);
      }

      console.log('Drag calculation:', {
        translationY: event.translationY,
        currentStepIndex,
        targetStepIndex,
        stepHeight
      });

      runOnJS(onDragEnd)(currentStepIndex, targetStepIndex);

      // Reset position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: translateY.value !== 0 ? 1000 : 1,
    };
  });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      enabled={isReorderMode}
      activeOffsetY={[-10, 10]}
      failOffsetX={[-15, 15]}
    >
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={!isReorderMode ? onEdit : undefined}
          activeOpacity={isReorderMode ? 1 : 0.7}
        >
          <View className="border rounded-lg p-3 mt-2" style={{
            backgroundColor: appTheme.colors.primary[50],
            borderColor: appTheme.colors.primary[200]
          }}>
            <View className="flex-row items-center justify-between">
              {isReorderMode && (
                <View className="mr-2">
                  <Feather name="move" size={16} color={theme.colors.primary[500]} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-sm font-medium" style={{ color: appTheme.colors.primary[800] }}>
                  {getCookingMethodIcon(
                    cookingAction.methodId,
                    selectedAppliance ? getApplianceById(selectedAppliance)?.thing_category_name : undefined
                  )} {cookingAction.methodName}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-xs mt-1 flex-1" style={{ color: appTheme.colors.primary[600] }}>
                    {formatKeyParameters(cookingAction)}
                  </Text>
                  {cookingAction.parameters.target_probe_temp && onShowTempInfo && !isReorderMode && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onShowTempInfo();
                      }}
                      className="ml-2 p-1"
                    >
                      <Feather name="info" size={14} color={theme.colors.info.main} />
                    </TouchableOpacity>
                  )}
                </View>
                {selectedAppliance && (
                  <Text className="text-xs mt-0.5" style={{ color: appTheme.colors.primary[500] }}>
                    {getApplianceById(selectedAppliance)?.name}
                  </Text>
                )}
              </View>
              {!isReorderMode && (
                <TouchableOpacity
                  onPress={onRemove}
                  className="w-6 h-6 rounded-full items-center justify-center ml-2"
                  style={{ backgroundColor: appTheme.colors.error.light }}
                >
                  <Text className="text-xs font-bold" style={{ color: appTheme.colors.error.dark }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}