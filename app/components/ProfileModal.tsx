import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Dimensions, Modal, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Developer } from '../models/Developer';
import FlippableSwipeCard, { FlippableSwipeCardRef } from './FlippableSwipeCard';

interface ProfileModalProps {
  visible: boolean;
  developer: Developer | null;
  onClose: () => void;
  onAccept: () => Promise<void>;
  onIgnore: () => Promise<void>;
}

const { height: screenHeight } = Dimensions.get('window');

export default function ProfileModal({ 
  visible, 
  developer, 
  onClose, 
  onAccept, 
  onIgnore 
}: ProfileModalProps) {
  const cardRef = useRef<FlippableSwipeCardRef>(null);

  const handleAccept = async () => {
    await onAccept();
    onClose();
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
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
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
          >
            <Ionicons name="close" size={20} color="#ff6b6b" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleAcceptPress} 
            style={[styles.actionButton, styles.acceptButton]}
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
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
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