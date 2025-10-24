import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAppTheme } from '@theme/index';
import { haptics } from '@utils/haptics';

interface ChefIQExportModalProps {
  visible: boolean;
  onClose: () => void;
  exportJSON: string;
  recipeName: string;
}

export const ChefIQExportModal: React.FC<ChefIQExportModalProps> = ({
  visible,
  onClose,
  exportJSON,
  recipeName,
}) => {
  const theme = useAppTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(exportJSON);
      haptics.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      haptics.error();
      Alert.alert('Copy Failed', 'Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: exportJSON,
        title: `${recipeName} - ChefIQ Recipe`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Only parse if we have valid JSON
  let parsedData: any = null;
  let hasCookingActions = false;

  if (exportJSON && exportJSON.trim()) {
    try {
      parsedData = JSON.parse(exportJSON);
      hasCookingActions = parsedData.sections?.some(
        (s: any) => s.sections_recipes_actions?.length > 0
      );
    } catch (error) {
      console.error('Failed to parse export JSON:', error);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            paddingTop: Platform.OS === 'ios' ? 60 : theme.spacing.xl,
            paddingBottom: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.light,
            backgroundColor: theme.colors.background.primary,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              flex: 1,
            }}
          >
            Export Preview
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: theme.spacing.sm }}>
            <Feather name="x" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Recipe Info */}
        {parsedData && (
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              backgroundColor: theme.colors.background.secondary,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
              }}
            >
              {parsedData.name || recipeName}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="layers" size={14} color={theme.colors.text.secondary} />
                <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                  {parsedData.sections?.length || 0} sections
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="list" size={14} color={theme.colors.text.secondary} />
                <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                  {parsedData.steps?.length || 0} steps
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="package" size={14} color={theme.colors.text.secondary} />
                <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                  {parsedData.ingredients?.length || 0} ingredients
                </Text>
              </View>
              {hasCookingActions && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather name="zap" size={14} color={theme.colors.success[600]} />
                  <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.success[600] }}>
                    Smart cooking
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* JSON Preview */}
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: theme.colors.gray[900],
          }}
          contentContainerStyle={{
            padding: theme.spacing.md,
          }}
        >
          <Text
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.gray[300],
              lineHeight: 20,
            }}
          >
            {exportJSON}
          </Text>
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={{
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.light,
            backgroundColor: theme.colors.background.primary,
          }}
        >
          <TouchableOpacity
            onPress={handleCopyToClipboard}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: copied ? theme.colors.success[500] : theme.colors.gray[200],
              gap: theme.spacing.sm,
            }}
          >
            <Feather
              name={copied ? 'check' : 'copy'}
              size={18}
              color={copied ? 'white' : theme.colors.text.primary}
            />
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: copied ? 'white' : theme.colors.text.primary,
              }}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: theme.colors.primary[500],
              gap: theme.spacing.sm,
            }}
          >
            <Feather name="share" size={18} color="white" />
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: 'white',
              }}
            >
              Share Export
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
