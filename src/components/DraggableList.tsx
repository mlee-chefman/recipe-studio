import React from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';

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

  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const newData = [...data];
    [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
    onReorder(newData);
  };

  const moveItemDown = (index: number) => {
    if (index === data.length - 1) return;
    const newData = [...data];
    [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
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

  const renderReorderItem = ({ item, index }: { item: T; index: number }) => {
    const canMoveUp = index > 0;
    const canMoveDown = index < data.length - 1;
    const isEmpty = item && String(item).trim() === '';

    return (
      <View style={{ paddingVertical: 4 }}>
        <View className="flex-row items-center gap-2">
          {/* Up/Down buttons */}
          {!isEmpty && (
            <View
              className="rounded-lg overflow-hidden"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.gray[200],
              }}
            >
              <TouchableOpacity
                onPress={() => moveItemUp(index)}
                disabled={!canMoveUp}
                className="w-7 h-5 items-center justify-center"
                style={{
                  backgroundColor: canMoveUp ? theme.colors.primary[100] : theme.colors.gray[50],
                  borderBottomWidth: 0.5,
                  borderBottomColor: theme.colors.gray[200],
                }}
              >
                <Feather
                  name="chevron-up"
                  size={14}
                  color={canMoveUp ? theme.colors.primary[600] : theme.colors.gray[300]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveItemDown(index)}
                disabled={!canMoveDown}
                className="w-7 h-5 items-center justify-center"
                style={{
                  backgroundColor: canMoveDown ? theme.colors.primary[100] : theme.colors.gray[50],
                }}
              >
                <Feather
                  name="chevron-down"
                  size={14}
                  color={canMoveDown ? theme.colors.primary[600] : theme.colors.gray[300]}
                />
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-1">
            {renderItem(item, index, isReorderMode)}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={containerClassName}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={isReorderMode ? renderReorderItem : renderRegularItem}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}