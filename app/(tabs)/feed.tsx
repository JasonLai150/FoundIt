import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import FlippableSwipeCard from '../components/FlippableSwipeCard';
import { useFeedViewModel } from '../viewmodels/FeedViewModel';

const { height: screenHeight } = Dimensions.get('window');

export default function FeedScreen() {
  const { developer, loading, error, swipeLeft, swipeRight, noMoreDevelopers } = useFeedViewModel();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    experienceMin: '',
    experienceMax: '',
    location: '',
    skills: '',
    lookingForWork: false,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
    console.log('Searching for:', query);
  };

  const applyFilters = () => {
    setShowFilters(false);
    // TODO: Implement filter functionality
    console.log('Applying filters:', filters);
  };

  const resetFilters = () => {
    setFilters({
      experienceMin: '',
      experienceMax: '',
      location: '',
      skills: '',
      lookingForWork: false,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        
        {/* Search Bar Section - Airbnb Style */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search developers, skills, companies..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
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
          <FlippableSwipeCard 
            developer={developer} 
            onSwipeLeft={swipeLeft} 
            onSwipeRight={swipeRight} 
          />
        ) : null}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.modalResetButton}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Experience Level</Text>
              <View style={styles.experienceRow}>
                <TextInput
                  style={styles.experienceInput}
                  placeholder="Min years"
                  value={filters.experienceMin}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, experienceMin: text }))}
                  keyboardType="numeric"
                />
                <Text style={styles.experienceSeparator}>to</Text>
                <TextInput
                  style={styles.experienceInput}
                  placeholder="Max years"
                  value={filters.experienceMax}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, experienceMax: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Location</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="City, State or Remote"
                value={filters.location}
                onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Skills</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="e.g. React, Python, AWS"
                value={filters.skills}
                onChangeText={(text) => setFilters(prev => ({ ...prev, skills: text }))}
              />
            </View>

            <TouchableOpacity 
              style={[styles.filterToggle, filters.lookingForWork && styles.filterToggleActive]}
              onPress={() => setFilters(prev => ({ ...prev, lookingForWork: !prev.lookingForWork }))}
            >
              <Text style={[styles.filterToggleText, filters.lookingForWork && styles.filterToggleTextActive]}>
                Only show developers looking for opportunities
              </Text>
              {filters.lookingForWork && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: screenHeight < 700 ? 60 : 70,
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
  },
  modalResetButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  experienceInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  experienceSeparator: {
    marginHorizontal: 8,
  },
  filterInput: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  filterToggle: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggleActive: {
    borderColor: '#007AFF',
  },
  filterToggleText: {
    fontSize: 16,
    color: '#333',
  },
  filterToggleTextActive: {
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    alignItems: 'center',
  },
  applyButton: {
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 