import './global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import Navigation from '@navigation/index';
import { useAppTheme } from '@theme/index';

export default function App() {
  const theme = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <KeyboardProvider>
        <Navigation />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
