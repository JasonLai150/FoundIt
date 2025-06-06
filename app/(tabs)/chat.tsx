import React from 'react';
import { Dimensions, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Define a type for chat messages
type ChatMessage = {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
};

const { height: screenHeight } = Dimensions.get('window');

export default function ChatScreen() {
  const emptyChat = true; // This will be replaced with actual state in the future

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {emptyChat ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your conversations with matched developers will appear here</Text>
        </View>
      ) : (
        <FlatList<ChatMessage>
          style={styles.chatList}
          data={[]}
          keyExtractor={(item) => item.id}
          renderItem={() => null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: screenHeight < 700 ? 4 : 8,
    paddingBottom: screenHeight < 700 ? 8 : 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: screenHeight < 700 ? 22 : 24,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
  },
  chatList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 