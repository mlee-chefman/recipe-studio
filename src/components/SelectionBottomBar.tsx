import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';

interface SelectionBottomBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
}

export const SelectionBottomBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
}: SelectionBottomBarProps) => {
  const styles = useStyles(createStyles);
  const allSelected = selectedCount === totalCount;

  return (
    <View style={styles.selectionBottomBar}>
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionText}>
          {selectedCount} selected
        </Text>
        <View style={styles.selectionActions}>
          {allSelected ? (
            <TouchableOpacity onPress={onDeselectAll} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Deselect All</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onSelectAll} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Select All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onDelete}
            disabled={selectedCount === 0}
            style={[styles.deleteButton, selectedCount === 0 && styles.deleteButtonDisabled]}
          >
            <FontAwesome name="trash" size={18} color="white" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  selectionBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.main,
    paddingBottom: 20,
    ...theme.shadows.md,
  },
  selectionInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
