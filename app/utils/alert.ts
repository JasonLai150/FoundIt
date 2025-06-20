import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void => {
  // For web platforms, use browser alert/confirm
  if (Platform.OS === 'web') {
    const fullMessage = message ? `${title}\n\n${message}` : title;
    
    if (buttons && buttons.length > 1) {
      // Use confirm for multiple buttons
      const result = window.confirm(fullMessage);
      if (result && buttons[1]?.onPress) {
        buttons[1].onPress();
      } else if (!result && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      // Use alert for single button
      window.alert(fullMessage);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // For mobile platforms, use React Native Alert
    Alert.alert(title, message, buttons);
  }
};

// Convenience functions
export const showErrorAlert = (title: string, message: string) => {
  showAlert(title, message, [{ text: 'OK', style: 'default' }]);
};

export const showSuccessAlert = (title: string, message: string) => {
  showAlert(title, message, [{ text: 'OK', style: 'default' }]);
};

export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  showAlert(title, message, [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    { text: 'OK', style: 'default', onPress: onConfirm }
  ]);
}; 