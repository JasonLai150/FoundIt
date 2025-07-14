import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface MessageInputModalProps {
  visible: boolean;
  recipientName: string;
  onSend: (message: string) => void;
  onSendWithoutMessage: () => void;
  onCancel: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function MessageInputModal({
  visible,
  recipientName,
  onSend,
  onSendWithoutMessage,
  onCancel
}: MessageInputModalProps) {
  const [message, setMessage] = useState('');
  const textInputRef = useRef<TextInput>(null);

  // Reset message when modal opens/closes and handle focus
  React.useEffect(() => {
    if (!visible) {
      setMessage('');
    } else if (visible && Platform.OS === 'ios') {
      // On iOS, delay focus to ensure modal animation completes
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300); // Wait for modal animation
    }
  }, [visible]);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
    } else {
      onSendWithoutMessage();
    }
    setMessage('');
  };

  const handleCancel = () => {
    setMessage('');
    onCancel();
  };

  const handleSendWithoutMessage = () => {
    setMessage('');
    onSendWithoutMessage();
  };

  const handleInputPress = () => {
    textInputRef.current?.focus();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSubmitEditing = () => {
    // Dismiss keyboard when user presses return
    Keyboard.dismiss();
  };

  const characterCount = message.length;
  const isOverLimit = characterCount > 200;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'}
      onRequestClose={handleCancel}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={handleCancel} 
                style={styles.cancelButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Add a message</Text>
                <Text style={styles.headerSubtitle}>to {recipientName}</Text>
              </View>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
              <Text style={styles.promptText}>
                Send a message with your like to stand out!
              </Text>
              
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={handleInputPress}
                activeOpacity={1}
              >
                <TextInput
                  ref={textInputRef}
                  style={[styles.textInput, isOverLimit && styles.textInputError]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Write something interesting..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={250} // Allow typing a bit over to show error
                  textAlignVertical="top"
                  autoFocus={Platform.OS === 'android'} // Only auto-focus on Android
                  blurOnSubmit={true}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmitEditing}
                />
                <View style={styles.characterCount}>
                  <Text style={[
                    styles.characterCountText,
                    isOverLimit && styles.characterCountError
                  ]}>
                    {characterCount}/200
                  </Text>
                </View>
              </TouchableOpacity>

              {isOverLimit && (
                <Text style={styles.errorText}>
                  Message too long. Please keep it under 200 characters.
                </Text>
              )}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={handleSendWithoutMessage}
                style={styles.skipButton}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip & Like</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSend}
                style={[styles.sendButton, isOverLimit && styles.sendButtonDisabled]}
                disabled={isOverLimit}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                activeOpacity={isOverLimit ? 1 : 0.7}
              >
                <Ionicons 
                  name="heart" 
                  size={18} 
                  color={isOverLimit ? "#ccc" : "#fff"} 
                />
                <Text style={[styles.sendButtonText, isOverLimit && styles.sendButtonTextDisabled]}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      android: {
        paddingTop: 16, // Extra padding for Android status bar
      },
    }),
  },
  cancelButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'flex-start',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  content: {
    flex: 1,
    padding: 20,
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: Platform.OS === 'ios' ? 120 : 100,
    position: 'relative',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: Platform.OS === 'ios' ? 120 : 100,
    maxHeight: 200,
    ...Platform.select({
      android: {
        textAlignVertical: 'top',
      },
    }),
  },
  textInputError: {
    borderColor: '#ff6b6b',
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
  },
  characterCountError: {
    color: '#ff6b6b',
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
    ...Platform.select({
      android: {
        paddingBottom: 20, // Extra padding for Android navigation
      },
    }),
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // Ensure good touch target
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#51cf66',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50, // Ensure good touch target
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sendButtonTextDisabled: {
    color: '#ccc',
  },
}); 