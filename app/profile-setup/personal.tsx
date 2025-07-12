import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { showAlert } from '../utils/alert';

const GOAL_OPTIONS = [
  {
    value: 'searching',
    title: 'Job Searching',
    description: 'Looking for new career opportunities'
  },
  {
    value: 'recruiting',
    title: 'Recruiting',
    description: 'Finding talented developers for my team'
  },
  {
    value: 'investing',
    title: 'Investing',
    description: 'Looking for startups and investment opportunities'
  },
  {
    value: 'other',
    title: 'Other',
    description: 'Networking and exploring opportunities'
  }
];

export default function PersonalInfoSetup() {
  const { updateUserProfile, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    // Split DOB into separate fields
    birth_day: user?.dob ? user.dob.split('-')[2] : '',
    birth_month: user?.dob ? user.dob.split('-')[1] : '',
    birth_year: user?.dob ? user.dob.split('-')[0] : '',
    // Split location into separate fields
    city: user?.location ? user.location.split(',')[0]?.trim() : '',
    state: user?.location ? user.location.split(',')[1]?.trim() : '',
    goal: user?.goal || 'searching' as 'recruiting' | 'searching' | 'investing' | 'other',
  });

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      showAlert('Missing Information', 'Please enter your first name');
      return false;
    }
    if (!formData.last_name.trim()) {
      showAlert('Missing Information', 'Please enter your last name');
      return false;
    }
    if (!formData.birth_day || !formData.birth_month || !formData.birth_year) {
      showAlert('Missing Information', 'Please enter your complete date of birth');
      return false;
    }
    if (!formData.city.trim()) {
      showAlert('Missing Information', 'Please enter your city');
      return false;
    }
    if (!formData.state.trim()) {
      showAlert('Missing Information', 'Please enter your state/region');
      return false;
    }
    if (!formData.goal) {
      showAlert('Missing Information', 'Please select your goal');
      return false;
    }

    // Validate date components
    const day = parseInt(formData.birth_day);
    const month = parseInt(formData.birth_month);
    const year = parseInt(formData.birth_year);

    if (day < 1 || day > 31) {
      showAlert('Invalid Date', 'Please enter a valid day (1-31)');
      return false;
    }
    if (month < 1 || month > 12) {
      showAlert('Invalid Date', 'Please enter a valid month (1-12)');
      return false;
    }
    if (year < 1900 || year > new Date().getFullYear()) {
      showAlert('Invalid Date', 'Please enter a valid year');
      return false;
    }

    // Validate age (must be at least 13 years old)
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 13 || (age === 13 && monthDiff < 0) || (age === 13 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      showAlert('Age Requirement', 'You must be at least 13 years old to use this app');
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Combine date components into YYYY-MM-DD format
      const dob = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
      // Combine location components
      const location = `${formData.city.trim()}, ${formData.state.trim()}`;

      const success = await updateUserProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dob: dob,
        location: location,
        goal: formData.goal,
      });

      if (success) {
        router.push('/profile-setup/professional' as any);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(tabs)/feed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>Let's get to know you better</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              placeholder="Enter your first name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              placeholder="Enter your last name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth *</Text>
            <View style={styles.dateInputGroup}>
              <TextInput
                style={styles.dateInput}
                value={formData.birth_day}
                onChangeText={(text) => setFormData({ ...formData, birth_day: text })}
                placeholder="DD"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                style={styles.dateInput}
                value={formData.birth_month}
                onChangeText={(text) => setFormData({ ...formData, birth_month: text })}
                placeholder="MM"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                style={styles.dateInput}
                value={formData.birth_year}
                onChangeText={(text) => setFormData({ ...formData, birth_year: text })}
                placeholder="YYYY"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <View style={styles.locationInputGroup}>
              <TextInput
                style={styles.locationInput}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
                placeholderTextColor="#666"
                autoCapitalize="words"
              />
              <TextInput
                style={styles.locationInput}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="State/Region"
                placeholderTextColor="#666"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>What's your goal? *</Text>
            {GOAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.goalOption,
                  formData.goal === option.value && styles.goalOptionSelected
                ]}
                onPress={() => setFormData({ ...formData, goal: option.value as any })}
              >
                <View style={styles.goalContent}>
                  <Text style={[
                    styles.goalTitle,
                    formData.goal === option.value && styles.goalTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[
                    styles.goalDescription,
                    formData.goal === option.value && styles.goalDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </View>
                <View style={[
                  styles.goalRadio,
                  formData.goal === option.value && styles.goalRadioSelected
                ]}>
                  {formData.goal === option.value && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipText}>Skip Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextText}>Next</Text>
          )}
        </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  progressActive: {
    backgroundColor: '#FF5864',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  dateInputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    color: '#333',
    textAlign: 'center',
  },
  locationInputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  goalOption: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  goalOptionSelected: {
    borderColor: '#FF5864',
    backgroundColor: '#fff',
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalTitleSelected: {
    color: '#FF5864',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
  },
  goalDescriptionSelected: {
    color: '#333',
  },
  goalRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalRadioSelected: {
    backgroundColor: '#FF5864',
    borderColor: '#FF5864',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  skipButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#FF5864',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 