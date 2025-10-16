import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
  DragEndParams,
} from 'react-native-draggable-flatlist';
import { Feather } from '@expo/vector-icons';

interface DraggableListProps<T> {
  data: T[];
  onReorder: (data: T[]) => void;
  renderItem: (item: T, index: number, isReorderMode: boolean) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  containerClassName?: string;
  isReorderMode?: boolean;
}

export function SimpleDraggableList<T>({
  data,
  onReorder,
  renderItem,
  keyExtractor = (_, index) => `item-${index}`,
  containerClassName = '',
  isReorderMode = false,
}: DraggableListProps<T>) {
  const handleDragEnd = ({ data: newData }: DragEndParams<T>) => {
    onReorder(newData);
  };

  const renderRegularItem = ({ item, index }: { item: T; index: number }) => {
    return (
      <View style={{ paddingVertical: 4 }}>
        <View className="flex-row items-center">
          <View className="flex-1">
            {renderItem(item, index, false)}
          </View>
        </View>
      </View>
    );
  };

  const renderDraggableItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<T>) => {
    const index = getIndex();
    if (index === undefined) return null;

    return (
      <ScaleDecorator>
        <View
          style={{
            opacity: isActive ? 0.8 : 1,
            backgroundColor: isActive ? '#f3f4f6' : 'transparent',
            borderRadius: isActive ? 8 : 0,
            paddingVertical: 4,
          }}
        >
          {isReorderMode && (
            <TouchableOpacity
              onLongPress={item && String(item).trim() !== '' ? drag : undefined}
              delayLongPress={400}
              disabled={isActive || (item && String(item).trim() === '')}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
              }}
            />
          )}
          <View className="flex-row items-center">
            {isReorderMode && item && String(item).trim() !== '' && (
              <View className="pr-2">
                <Feather name="menu" size={20} color="#9CA3AF" />
              </View>
            )}
            <View className="flex-1">
              {renderItem(item, index, isReorderMode)}
            </View>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  if (!isReorderMode) {
    // Use regular FlatList when not in reorder mode to avoid gesture conflicts
    return (
      <View className={containerClassName}>
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderRegularItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    );
  }

  // Use DraggableFlatList only when in reorder mode
  return (
    <View className={containerClassName}>
      <DraggableFlatList
        data={data}
        onDragEnd={handleDragEnd}
        keyExtractor={keyExtractor}
        renderItem={renderDraggableItem}
        scrollEnabled={false}
        containerStyle={{ overflow: 'visible' }}
        contentContainerStyle={{ paddingBottom: 20 }}
        activationDistance={8}
        autoscrollThreshold={60}
        dragItemOverflow={true}
        keyboardShouldPersistTaps="handled"
        onDragBegin={() => console.log('Drag started')}
        panGestureHandlerProps={{
          minPointers: 1,
          maxPointers: 1,
          activeOffsetY: [-5, 5],
          shouldCancelWhenOutside: false,
          enabled: true,
        }}
      />
    </View>
  );
}