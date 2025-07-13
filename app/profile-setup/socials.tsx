import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { deleteAvatar, pickAndUploadAvatar } from '../utils/avatarUpload';

interface SocialsFormData {
  github: string;
  linkedin: string;
  website: string;
  avatarUrl: string;
  bio: string;
}

const SOCIALS_CACHE_KEY = 'socials_setup_cache';

export default function SocialsSetup() {
  const { updateUserProfile, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [cacheBuster, setCacheBuster] = useState(''); // For forcing image refresh after upload
  const [formData, setFormData] = useState({
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    website: user?.website || '',
    bio: user?.bio || '',
  });

  // Load cached data on component mount
  useEffect(() => {
    loadCachedData();
  }, []);

  // Save to cache whenever form data changes
  useEffect(() => {
    saveToCacheDebounced();
  }, [formData, avatarUrl]);

  const loadCachedData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(SOCIALS_CACHE_KEY);
      if (cachedData) {
        const parsedData: SocialsFormData = JSON.parse(cachedData);
        // Only load cache if there's no existing user data
        if (!user?.github) {
          setFormData({
            github: parsedData.github || '',
            linkedin: parsedData.linkedin || '',
            website: parsedData.website || '',
            bio: parsedData.bio || '',
          });
        }
        // Always load avatar URL if it exists in cache
        if (parsedData.avatarUrl && !avatarUrl) {
          setAvatarUrl(parsedData.avatarUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load cached socials data:', error);
    }
  };

  const saveToCache = async () => {
    try {
      const dataToCache: SocialsFormData = {
        github: formData.github,
        linkedin: formData.linkedin,
        website: formData.website,
        avatarUrl: avatarUrl,
        bio: formData.bio,
      };
      await AsyncStorage.setItem(SOCIALS_CACHE_KEY, JSON.stringify(dataToCache));
    } catch (error) {
      console.error('Failed to save socials data to cache:', error);
    }
  };

  // Debounced save to avoid too many cache writes
  const saveToCacheDebounced = (() => {
    let timeout: number;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveToCache, 500);
    };
  })();

  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(SOCIALS_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear socials cache:', error);
    }
  };

  const handleAvatarUpload = async () => {
    if (!user?.id) return;
    
    setIsUploadingAvatar(true);
    try {
      const result = await pickAndUploadAvatar(user.id);
      
      if (result.success && result.url) {
        setAvatarUrl(result.url);
        setCacheBuster(`?t=${Date.now()}`);
      } else {
        showAlert('Upload Failed', result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      showAlert('Upload Failed', 'An error occurred while uploading your avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;
    
    setIsUploadingAvatar(true);
    try {
      const deleted = await deleteAvatar(avatarUrl);
      if (deleted) {
        setAvatarUrl('');
        setCacheBuster('');
      } else {
        showAlert('Remove Failed', 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      showAlert('Remove Failed', 'An error occurred while removing your avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
        bio: formData.bio.trim() || undefined,
        avatar_url: avatarUrl || undefined,
        profile_complete: true, // Mark profile as complete
      });

      if (success) {
        // Clear cache only after successful submission
        await clearCache();
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
      showAlert('Error', 'Failed to complete profile setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      // Mark profile as complete even if socials are skipped
      const success = await updateUserProfile({ 
        profile_complete: true,
        avatar_url: avatarUrl || undefined,
      });
      if (success) {
        // Clear cache when skipping
        await clearCache();
        router.replace('/(tabs)/feed');
      }
    } catch (error) {
      console.error('Error skipping to complete:', error);
      showAlert('Error', 'Failed to complete profile setup');
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
          <Text style={styles.title}>Profile Photo & Social Links</Text>
          <Text style={styles.subtitle}>Add your photo and connect your online presence</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressDot, styles.progressActive]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Avatar Upload Section */}
          <View style={styles.avatarSection}>
            <Text style={styles.sectionTitle}>Profile Photo</Text>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarImageContainer}>
                {avatarUrl ? (
                  <Image 
                    source={{ 
                      uri: `${avatarUrl}${cacheBuster}`, // Use cache buster only when needed
                    }} 
                    style={styles.avatarImage}
                    cachePolicy="memory-disk" // Enable caching for better performance
                    onError={(error) => {
                      console.error('Avatar image load error:', error.error);
                    }}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={60} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={styles.avatarButtons}>
                <TouchableOpacity
                  style={[styles.avatarButton, isUploadingAvatar && styles.avatarButtonDisabled]}
                  onPress={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={20} color="#fff" />
                      <Text style={styles.avatarButtonText}>
                        {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {avatarUrl && (
                  <TouchableOpacity
                    style={[styles.avatarButton, styles.removeButton, isUploadingAvatar && styles.avatarButtonDisabled]}
                    onPress={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                  >
                    <Ionicons name="trash" size={20} color="#FF5864" />
                    <Text style={[styles.avatarButtonText, styles.removeButtonText]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.avatarHint}>
              Upload a clear photo of yourself to help others recognize you. Square photos work best.
            </Text>
          </View>

          <Text style={styles.description}>
            Adding your social links helps others connect with you and learn more about your work. All fields are optional.
          </Text>

          {/* Bio Section */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="person-outline" size={20} color="#333" style={styles.labelIcon} />
              <Text style={styles.label}>About Me</Text>
            </View>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Tell others about yourself, your interests, and what you're passionate about..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.hint}>
              Share a brief introduction about yourself ({formData.bio.length}/500 characters)
            </Text>
          </View>

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
          style={[styles.skipButton, (isLoading || isUploadingAvatar) && styles.buttonDisabled]}
          onPress={handleSkip}
          disabled={isLoading || isUploadingAvatar}
        >
          {isLoading ? (
            <ActivityIndicator color="#666" />
          ) : (
            <Text style={styles.skipText}>Skip</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, (isLoading || isUploadingAvatar) && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={isLoading || isUploadingAvatar}
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
  avatarSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5864',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  avatarButtonDisabled: {
    opacity: 0.6,
  },
  avatarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF5864',
  },
  removeButtonText: {
    color: '#FF5864',
  },
  avatarHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
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
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
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