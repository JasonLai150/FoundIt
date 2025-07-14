import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Dimensions, Modal, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Developer } from '../models/Developer';
import FlippableSwipeCard, { FlippableSwipeCardRef } from './FlippableSwipeCard';
import MessageBubble from './MessageBubble';

interface ProfileModalProps {
  visible: boolean;
  developer: Developer | null;
  incomingMessage?: string;
  onClose: () => void;
  onAccept: (message?: string) => Promise<void>;
  onIgnore: () => Promise<void>;
}

const { height: screenHeight } = Dimensions.get('window');

export default function ProfileModal({ 
  visible, 
  developer, 
  incomingMessage,
  onClose, 
  onAccept, 
  onIgnore 
}: ProfileModalProps) {
  const cardRef = useRef<FlippableSwipeCardRef>(null);

  const handleAccept = async () => {
    await onAccept();
  };

  const handleIgnore = async () => {
    await onIgnore();
    onClose();
  };

  const handleAcceptPress = () => {
    cardRef.current?.handleConnectPress();
  };

  const handleIgnorePress = () => {
    cardRef.current?.handlePassPress();
  };

  if (!developer) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Show incoming message if exists */}
        {incomingMessage && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message from {developer.name}:</Text>
            <MessageBubble message={incomingMessage} />
          </View>
        )}
        
        <View style={styles.cardContainer}>
          <FlippableSwipeCard
            ref={cardRef}
            developer={developer}
            onSwipeLeft={handleIgnore}
            onSwipeRight={handleAccept}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={handleIgnorePress} 
            style={[styles.actionButton, styles.ignoreButton]}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#ff6b6b" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleAcceptPress} 
            style={[styles.actionButton, styles.acceptButton]}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={20} color="#51cf66" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'flex-start', // Align message to the left for better layout
  },
  messageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
    width: '100%', // Ensure label spans full width
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    ...Platform.select({
      android: {
        paddingBottom: 24, // Extra padding for Android navigation
      },
    }),
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ignoreButton: {
    backgroundColor: '#ffe0e0',
  },
  acceptButton: {
    backgroundColor: '#e0f7e0',
  },
}); 