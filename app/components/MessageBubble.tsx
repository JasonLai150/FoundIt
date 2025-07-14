import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface MessageBubbleProps {
  message: string;
  isPreview?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function MessageBubble({ message, isPreview = false }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isPreview && styles.previewContainer]}>
      <View style={[styles.bubble, isPreview && styles.previewBubble]}>
        <Text style={[styles.messageText, isPreview && styles.previewText]}>
          {message}
        </Text>
      </View>
      {isPreview && <View style={styles.tail} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Use full width of the message section (50% of card)
    position: 'relative',
  },
  bubble: {
    backgroundColor: '#51cf66',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewBubble: {
    backgroundColor: '#51cf66',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 16,
    minWidth: '80%', // Use 80% of the available space (40% of total card width)
    maxWidth: '95%', // Nearly full width of the 50% section
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  previewText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  tail: {
    position: 'absolute',
    right: -1,
    top: '50%', // Center the tail vertically
    marginTop: -4, // Half the tail height for perfect centering
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 8,
    borderLeftColor: '#51cf66',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
}); 