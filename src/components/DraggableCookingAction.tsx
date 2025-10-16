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
import { CookingAction, getApplianceById } from '@types/chefiq';
import { getCookingMethodIcon, formatKeyParameters } from '@utils/cookingActionHelpers';
import { theme } from '@theme/index';

interface DraggableCookingActionProps {
  cookingAction: CookingAction;
  currentStepIndex: number;
  onDragStart: () => void;
  onDragEnd: (fromStepIndex: number, targetStepIndex: number) => void;
  onRemove: () => void;
  onEdit: () => void;
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
  selectedAppliance,
  isReorderMode = false,
}: DraggableCookingActionProps) {
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
          <View className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <View className="flex-row items-center justify-between">
              {isReorderMode && (
                <View className="mr-2">
                  <Feather name="move" size={16} color="#22c55e" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-sm font-medium text-green-800">
                  {getCookingMethodIcon(
                    cookingAction.methodId,
                    selectedAppliance ? getApplianceById(selectedAppliance)?.thing_category_name : undefined
                  )} {cookingAction.methodName}
                </Text>
                <Text className="text-xs text-green-600 mt-1">
                  {formatKeyParameters(cookingAction)}
                </Text>
                {selectedAppliance && (
                  <Text className="text-xs text-green-500 mt-0.5">
                    {getApplianceById(selectedAppliance)?.name}
                  </Text>
                )}
              </View>
              {!isReorderMode && (
                <TouchableOpacity
                  onPress={onRemove}
                  className="w-6 h-6 bg-red-100 rounded-full items-center justify-center ml-2"
                >
                  <Text className="text-red-600 text-xs font-bold">×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}