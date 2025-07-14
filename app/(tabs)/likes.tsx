import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LikeRequestCard from '../components/LikeRequestCard';
import MessageInputModal from '../components/MessageInputModal';
import ProfileModal from '../components/ProfileModal';
import { Developer } from '../models/Developer';
import { LikeRequest } from '../services/MatchService';
import { useLikeRequestsViewModel } from '../viewmodels/LikeRequestsViewModel';

const { height: screenHeight } = Dimensions.get('window');

export default function LikesScreen() {
  const { 
    likeRequests, 
    loading, 
    refreshing,
    error, 
    acceptLikeRequest, 
    ignoreLikeRequest, 
    convertToDeveloper,
    refreshRequests 
  } = useLikeRequestsViewModel();

  const [selectedRequest, setSelectedRequest] = useState<LikeRequest | null>(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Message modal state for reciprocal messaging
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [recipientName, setRecipientName] = useState('');

  const handleCardPress = (likeRequest: LikeRequest) => {
    const developer = convertToDeveloper(likeRequest);
    if (developer) {
      setSelectedRequest(likeRequest);
      setSelectedDeveloper(developer);
      setModalVisible(true);
    }
  };

  const handleModalAccept = async (message?: string) => {
    if (selectedRequest) {
      if (selectedRequest.message && !message) {
        // They have a message but we want to send one back - show message modal
        setRecipientName(selectedRequest.profile?.first_name || 'User');
        
        // Close the profile modal first to avoid conflicts
        setModalVisible(false);
        
        // Small delay to ensure modal closes before opening new one
        setTimeout(() => {
          setShowMessageModal(true);
        }, 150);
        return;
      }
      
      const success = await acceptLikeRequest(selectedRequest.user_id, message);
      if (success) {
        handleCloseModal();
      }
    }
  };

  const handleSendReciprocalMessage = async (message: string) => {
    if (selectedRequest) {
      setShowMessageModal(false);
      const success = await acceptLikeRequest(selectedRequest.user_id, message);
      if (success) {
        // Clear all modal state after successful send
        setSelectedRequest(null);
        setSelectedDeveloper(null);
      }
    }
  };

  const handleSendWithoutMessage = async () => {
    if (selectedRequest) {
      setShowMessageModal(false);
      const success = await acceptLikeRequest(selectedRequest.user_id);
      if (success) {
        // Clear all modal state after successful send
        setSelectedRequest(null);
        setSelectedDeveloper(null);
      }
    }
  };

  const handleCancelMessage = () => {
    setShowMessageModal(false);
    // Restore the profile modal
    setModalVisible(true);
  };

  const handleModalIgnore = async () => {
    if (selectedRequest) {
      await ignoreLikeRequest(selectedRequest.user_id);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    setSelectedDeveloper(null);
  };

  const renderLikeRequestItem = ({ item }: { item: LikeRequest }) => (
    <LikeRequestCard
      likeRequest={item}
      onAccept={acceptLikeRequest}
      onIgnore={ignoreLikeRequest}
      onPress={() => handleCardPress(item)}
    />
  );

  // Only show loading spinner for initial load when no data exists
  if (loading && likeRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Like Requests</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5864" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && likeRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Like Requests</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Like Requests</Text>
        <Text style={styles.headerSubtitle}>
          {likeRequests.length} {likeRequests.length === 1 ? 'person likes' : 'people like'} you
        </Text>
      </View>
      
      {likeRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No like requests yet</Text>
          <Text style={styles.emptySubText}>
            When someone likes you, they'll appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={likeRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderLikeRequestItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshRequests}
              colors={['#FF5864']}
              tintColor="#FF5864"
            />
          }
        />
      )}

      <ProfileModal
        visible={modalVisible}
        developer={selectedDeveloper}
        incomingMessage={selectedRequest?.message}
        onClose={handleCloseModal}
        onAccept={handleModalAccept}
        onIgnore={handleModalIgnore}
      />

      {/* Reciprocal Message Modal - at same level to avoid nesting */}
      <MessageInputModal
        visible={showMessageModal}
        recipientName={recipientName}
        onSend={handleSendReciprocalMessage}
        onSendWithoutMessage={handleSendWithoutMessage}
        onCancel={handleCancelMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: screenHeight < 700 ? 4 : 8,
    paddingBottom: screenHeight < 700 ? 8 : 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: screenHeight < 700 ? 22 : 24,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4d',
    textAlign: 'center',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
}); 