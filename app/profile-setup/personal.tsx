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
    dob: user?.dob || '',
    location: user?.location || '',
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
    if (!formData.dob.trim()) {
      showAlert('Missing Information', 'Please enter your date of birth');
      return false;
    }
    if (!formData.location.trim()) {
      showAlert('Missing Information', 'Please enter your location');
      return false;
    }
    if (!formData.goal) {
      showAlert('Missing Information', 'Please select your goal');
      return false;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dob)) {
      showAlert('Invalid Date', 'Please enter date in YYYY-MM-DD format (e.g., 1995-06-15)');
      return false;
    }

    // Validate age (must be at least 13 years old)
    const birthDate = new Date(formData.dob);
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
      const success = await updateUserProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dob: formData.dob.trim(),
        location: formData.location.trim(),
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
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth *</Text>
            <TextInput
              style={styles.input}
              value={formData.dob}
              onChangeText={(text) => setFormData({ ...formData, dob: text })}
              placeholder="YYYY-MM-DD (e.g., 1995-06-15)"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="City, State/Country"
              autoCapitalize="words"
            />
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
    backgroundColor: '#f9f9f9',
  },
  goalOption: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
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