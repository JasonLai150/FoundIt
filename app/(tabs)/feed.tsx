import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import DeveloperCard from '../components/DeveloperCard';
import { useFeedViewModel } from '../viewmodels/FeedViewModel';

export default function FeedScreen() {
  const { developer, loading, error, swipeLeft, swipeRight, noMoreDevelopers } = useFeedViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF5864" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : noMoreDevelopers ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No more developers to show</Text>
            <Text style={styles.emptySubText}>Check back later for more matches</Text>
          </View>
        ) : developer ? (
          <DeveloperCard 
            developer={developer} 
            onSwipeLeft={swipeLeft} 
            onSwipeRight={swipeRight} 
          />
        ) : null}
      </View>
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
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4d',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 