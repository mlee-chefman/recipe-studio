import { forwardRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet } from 'react-native';

export type ViewMode = 'detailed' | 'compact' | 'grid';

interface ViewToggleButtonProps {
  viewMode: ViewMode;
  onToggle: () => void;
}

export const ViewToggleButton = forwardRef<typeof Pressable, ViewToggleButtonProps>(
  ({ viewMode, onToggle }, ref) => {
    // Icon mapping for each view mode
    const getIcon = (): any => {
      switch (viewMode) {
        case 'detailed':
          return 'list';
        case 'compact':
          return 'align-justify';
        case 'grid':
          return 'th';
        default:
          return 'list';
      }
    };

    return (
      <Pressable onPress={onToggle}>
        {({ pressed }) => (
          <FontAwesome
            name={getIcon()}
            size={22}
            color="#4CAF50"
            style={[
              styles.headerRight,
              {
                opacity: pressed ? 0.5 : 1,
              },
            ]}
          />
        )}
      </Pressable>
    );
  }
);

ViewToggleButton.displayName = 'ViewToggleButton';

export const styles = StyleSheet.create({
  headerRight: {
    marginRight: 15,
  },
});
