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
  View,
} from 'react-native';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { showAlert } from '../utils/alert';

export default function SocialsSetup() {
  const { updateUserProfile, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    website: user?.website || '',
  });

  const validateURL = (url: string, platform: string): boolean => {
    if (!url.trim()) return true; // Optional field

    try {
      const urlObj = new URL(url);
      
      // Basic URL validation
      if (!urlObj.protocol.startsWith('http')) {
        showAlert('Invalid URL', `Please enter a valid ${platform} URL starting with http:// or https://`);
        return false;
      }

      // Platform-specific validation
      switch (platform) {
        case 'GitHub':
          if (!url.includes('github.com')) {
            showAlert('Invalid GitHub URL', 'Please enter a valid GitHub profile URL (e.g., https://github.com/username)');
            return false;
          }
          break;
        case 'LinkedIn':
          if (!url.includes('linkedin.com')) {
            showAlert('Invalid LinkedIn URL', 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)');
            return false;
          }
          break;
      }

      return true;
    } catch (error) {
      showAlert('Invalid URL', `Please enter a valid ${platform} URL starting with http:// or https://`);
      return false;
    }
  };

  const validateForm = () => {
    return (
      validateURL(formData.github, 'GitHub') &&
      validateURL(formData.linkedin, 'LinkedIn') &&
      validateURL(formData.website, 'Website')
    );
  };

  const handleComplete = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const success = await updateUserProfile({
        github: formData.github.trim() || undefined,
        linkedin: formData.linkedin.trim() || undefined,
        website: formData.website.trim() || undefined,
        profile_complete: true, // Mark profile as complete
      });

      if (success) {
        // Navigate directly like other steps, then show success message
        router.replace('/(tabs)/feed');
        
        // Show success message after navigation
        setTimeout(() => {
          showAlert(
            '🎉 Profile Complete!',
            'Your profile has been set up successfully. Welcome to FoundIt!',
            [{ text: 'Awesome!', style: 'default' }]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error completing profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      // Mark profile as complete even if socials are skipped
      const success = await updateUserProfile({ profile_complete: true });
      if (success) {
        router.replace('/(tabs)/feed');
      }
    } catch (error) {
      console.error('Error skipping to complete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const addProtocol = (url: string) => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Social Links</Text>
          <Text style={styles.subtitle}>Connect your online presence</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressDot, styles.progressActive]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.description}>
            Adding your social links helps others connect with you and learn more about your work. All fields are optional.
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="logo-github" size={20} color="#333" style={styles.labelIcon} />
              <Text style={styles.label}>GitHub Profile</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.github}
              onChangeText={(text) => setFormData({ ...formData, github: text })}
              onBlur={() => setFormData({ ...formData, github: addProtocol(formData.github) })}
              placeholder="https://github.com/yourusername"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Share your code repositories and contributions</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="logo-linkedin" size={20} color="#0077B5" style={styles.labelIcon} />
              <Text style={styles.label}>LinkedIn Profile</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.linkedin}
              onChangeText={(text) => setFormData({ ...formData, linkedin: text })}
              onBlur={() => setFormData({ ...formData, linkedin: addProtocol(formData.linkedin) })}
              placeholder="https://linkedin.com/in/yourusername"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Professional networking and career history</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="globe-outline" size={20} color="#333" style={styles.labelIcon} />
              <Text style={styles.label}>Personal Website</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              onBlur={() => setFormData({ ...formData, website: addProtocol(formData.website) })}
              placeholder="https://yourwebsite.com"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Portfolio, blog, or personal site</Text>
          </View>

          <View style={styles.tipContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.tipText}>
              Tip: Having an active GitHub profile and LinkedIn presence can significantly increase your chances of being discovered by recruiters and potential collaborators.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.skipButton, isLoading && styles.buttonDisabled]}
          onPress={handleSkip}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#666" />
          ) : (
            <Text style={styles.skipText}>Skip</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, isLoading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.completeText}>Complete Setup</Text>
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
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
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
  progressCompleted: {
    backgroundColor: '#4CAF50',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 32,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
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
  completeButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 