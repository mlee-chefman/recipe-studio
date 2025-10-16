import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { theme } from '~/theme';

export const BackButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <View className={styles.backButton}>
      <Feather name="chevron-left" size={16} color={theme.colors.primary[500]} />
      <Text className="ml-1" style={{ color: theme.colors.primary[500] }} onPress={onPress}>
        Back
      </Text>
    </View>
  );
};

const styles = {
  backButton: 'flex-row',
};
