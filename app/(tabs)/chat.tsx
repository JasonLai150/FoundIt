import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Define a type for chat messages
type ChatMessage = {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
};

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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
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