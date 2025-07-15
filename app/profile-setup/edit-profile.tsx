import { Ionicons } from '@expo/vector-icons';
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
import { useCache } from '../contexts/CacheContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Education, WorkExperience } from '../models/Developer';
import { showAlert } from '../utils/alert';
import { deleteAvatar, pickAndUploadAvatar } from '../utils/avatarUpload';

const GOAL_OPTIONS = [
  { value: 'searching', title: 'Job Searching', description: 'Looking for new career opportunities' },
  { value: 'recruiting', title: 'Recruiting', description: 'Finding talented developers for my team' },
  { value: 'investing', title: 'Investing', description: 'Looking for startups and investment opportunities' },
  { value: 'other', title: 'Other', description: 'Networking and exploring opportunities' }
];

export default function EditProfile() {
  const { user, updateUserProfile, createUserExperience, updateUserExperience } = useAuth();
  const { cache, updateProfileCache, isCacheValid } = useCache();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [cacheBuster, setCacheBuster] = useState('');
  const [existingExperienceId, setExistingExperienceId] = useState<string | null>(null);

  // Use cached Developer profile directly
  const userAsDeveloper = cache.userProfile;

  // Form data states - populated from Developer model
  const [avatarUrl, setAvatarUrl] = useState('');
  const [personalData, setPersonalData] = useState({
    first_name: '',
    last_name: '',
    birth_day: '',
    birth_month: '',
    birth_year: '',
    city: '',
    state: '',
    role: '',
    goal: 'searching' as 'recruiting' | 'searching' | 'investing' | 'other',
  });

  const [professionalData, setProfessionalData] = useState({
    graduation_date: '',
    skills: [] as string[],
    education: [] as Education[],
    work_experience: [] as WorkExperience[],
  });

  const [socialData, setSocialData] = useState({
    github: '',
    linkedin: '',
    website: '',
  });

  const [bioData, setBioData] = useState({
    bio: '',
  });

  const [newSkill, setNewSkill] = useState('');

  // Re-sync all user data when userAsDeveloper changes
  useEffect(() => {
    if (userAsDeveloper) {
      // Update personal data from user object
      setPersonalData({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        birth_day: user?.dob ? user.dob.split('-')[2] : '',
        birth_month: user?.dob ? user.dob.split('-')[1] : '',
        birth_year: user?.dob ? user.dob.split('-')[0] : '',
        city: userAsDeveloper.location ? userAsDeveloper.location.split(',')[0]?.trim() : '',
        state: userAsDeveloper.location ? userAsDeveloper.location.split(',')[1]?.trim() : '',
        role: userAsDeveloper.role || '',
        goal: userAsDeveloper.looking ? 'searching' : 'other' as 'recruiting' | 'searching' | 'investing' | 'other',
      });

      // Update professional data from Developer model
      setProfessionalData({
        graduation_date: userAsDeveloper.graduation_date || '',
        skills: userAsDeveloper.skills.map(skill => skill.name),
        education: userAsDeveloper.educationEntries || [],
        work_experience: userAsDeveloper.workExperiences || [],
      });

      // Set existing experience ID if available
      if (userAsDeveloper.experience_id) {
        setExistingExperienceId(userAsDeveloper.experience_id);
      }

      // Update social data
      setSocialData({
        github: userAsDeveloper.github || '',
        linkedin: userAsDeveloper.linkedin || '',
        website: userAsDeveloper.website || '',
      });

      // Update bio data
      setBioData({
        bio: userAsDeveloper.bio || '',
      });

      // Update avatar URL
      setAvatarUrl(userAsDeveloper.avatarUrl || '');
    }
  }, [userAsDeveloper, user]);

  const handleBack = () => {
    // Check if we can go back in the navigation stack
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback: navigate to profile page if no navigation history
      router.replace('/(tabs)/profile');
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
        await updateUserProfile({ avatar_url: result.url });
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
        await updateUserProfile({ avatar_url: undefined });
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

  const handleSavePersonal = async () => {
    setIsLoading(true);
    try {
      const dob = `${personalData.birth_year}-${personalData.birth_month.padStart(2, '0')}-${personalData.birth_day.padStart(2, '0')}`;
      const location = `${personalData.city.trim()}, ${personalData.state.trim()}`;

      const updateData = {
        first_name: personalData.first_name.trim(),
        last_name: personalData.last_name.trim(),
        dob: dob,
        location: location,
        role: personalData.role.trim() || undefined,
        goal: personalData.goal,
      };

      const success = await updateUserProfile(updateData);

      if (success) {
        setEditingSection(null);
        // Update cache with new user data - need to extract experience data for cache function
        const experienceData = {
          id: userAsDeveloper?.experience_id,
          education: userAsDeveloper?.educationEntries || [],
          work_experience: userAsDeveloper?.workExperiences || [],
          skills: userAsDeveloper?.skills.map(skill => skill.name) || [],
          graduation_date: userAsDeveloper?.graduation_date,
        };
        updateProfileCache({ ...user, ...updateData }, experienceData);
      } else {
        showAlert('Error', 'Failed to update personal information. Please try again.');
      }
    } catch (error) {
      console.error('Edit profile error:', error);
      showAlert('Error', 'An error occurred while updating personal information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfessional = async () => {
    setIsLoading(true);
    try {
      const validWorkExperiences = professionalData.work_experience.filter((exp: WorkExperience) => 
        exp.company?.trim() && exp.position?.trim()
      );

      if (existingExperienceId) {
        // Update existing experience
        const success = await updateUserExperience(existingExperienceId, {
          profile_id: user!.id,
          education: professionalData.education.length > 0 ? professionalData.education : undefined,
          graduation_date: professionalData.graduation_date.trim() || undefined,
          skills: professionalData.skills.length > 0 ? professionalData.skills : undefined,
          work_experience: validWorkExperiences.length > 0 ? validWorkExperiences : undefined,
        });
        if (success) {
          setEditingSection(null);
          // Update cache with updated experience data
          const experienceData = {
            id: existingExperienceId,
            education: professionalData.education.length > 0 ? professionalData.education : undefined,
            graduation_date: professionalData.graduation_date.trim() || undefined,
            skills: professionalData.skills.length > 0 ? professionalData.skills : undefined,
            work_experience: validWorkExperiences.length > 0 ? validWorkExperiences : undefined,
          };
          updateProfileCache(user, experienceData);
        }
      } else {
        // Create new experience
        const success = await createUserExperience({
          profile_id: user!.id,
          education: professionalData.education.length > 0 ? professionalData.education : undefined,
          graduation_date: professionalData.graduation_date.trim() || undefined,
          skills: professionalData.skills.length > 0 ? professionalData.skills : undefined,
          work_experience: validWorkExperiences.length > 0 ? validWorkExperiences : undefined,
        });
        if (success) {
          setEditingSection(null);
          // Update cache with new experience data
          const experienceData = {
            education: professionalData.education.length > 0 ? professionalData.education : undefined,
            graduation_date: professionalData.graduation_date.trim() || undefined,
            skills: professionalData.skills.length > 0 ? professionalData.skills : undefined,
            work_experience: validWorkExperiences.length > 0 ? validWorkExperiences : undefined,
          };
          updateProfileCache(user, experienceData);
        }
      }
    } catch (error) {
      console.error('Error updating professional info:', error);
      showAlert('Error', 'Failed to update professional information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSocial = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        github: socialData.github.trim() || undefined,
        linkedin: socialData.linkedin.trim() || undefined,
        website: socialData.website.trim() || undefined,
      };

      const success = await updateUserProfile(updateData);

      if (success) {
        setEditingSection(null);
        // Update cache with new user data
        const experienceData = {
          id: userAsDeveloper?.experience_id,
          education: userAsDeveloper?.educationEntries || [],
          work_experience: userAsDeveloper?.workExperiences || [],
          skills: userAsDeveloper?.skills.map(skill => skill.name) || [],
          graduation_date: userAsDeveloper?.graduation_date,
        };
        updateProfileCache({ ...user, ...updateData }, experienceData);
      }
    } catch (error) {
      console.error('Error updating social links:', error);
      showAlert('Error', 'Failed to update social links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBio = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        bio: bioData.bio.trim() || undefined,
      };

      const success = await updateUserProfile(updateData);

      if (success) {
        setEditingSection(null);
        // Update cache with new user data
        const experienceData = {
          id: userAsDeveloper?.experience_id,
          education: userAsDeveloper?.educationEntries || [],
          work_experience: userAsDeveloper?.workExperiences || [],
          skills: userAsDeveloper?.skills.map(skill => skill.name) || [],
          graduation_date: userAsDeveloper?.graduation_date,
        };
        updateProfileCache({ ...user, ...updateData }, experienceData);
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      showAlert('Error', 'Failed to update about me');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !professionalData.skills.includes(newSkill.trim())) {
      setProfessionalData({
        ...professionalData,
        skills: [...professionalData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfessionalData({
      ...professionalData,
      skills: professionalData.skills.filter((skill: string) => skill !== skillToRemove)
    });
  };

  const addEducation = () => {
    setProfessionalData({
      ...professionalData,
      education: [...professionalData.education, { school_name: '', degree: '', major: '' }]
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...professionalData.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfessionalData({ ...professionalData, education: updated });
  };

  const removeEducation = (index: number) => {
    setProfessionalData({
      ...professionalData,
      education: professionalData.education.filter((_: Education, i: number) => i !== index)
    });
  };

  const addWorkExperience = () => {
    setProfessionalData({
      ...professionalData,
      work_experience: [...professionalData.work_experience, {
        company: '',
        position: '',
        description: '',
        startDate: '',
        endDate: '',
        current: false,
      }]
    });
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    const updated = [...professionalData.work_experience];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'current' && value === true) {
      updated[index].endDate = '';
    }
    
    setProfessionalData({ ...professionalData, work_experience: updated });
  };

  const removeWorkExperience = (index: number) => {
    setProfessionalData({
      ...professionalData,
      work_experience: professionalData.work_experience.filter((_: WorkExperience, i: number) => i !== index)
    });
  };

  const addProtocol = (url: string) => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };

  const renderPersonalSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <TouchableOpacity
          onPress={() => setEditingSection(editingSection === 'personal' ? null : 'personal')}
          style={styles.editButton}
        >
          <Ionicons name={editingSection === 'personal' ? 'close' : 'create-outline'} size={20} color="#FF5864" />
          <Text style={styles.editButtonText}>
            {editingSection === 'personal' ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingSection === 'personal' ? (
        <View style={styles.editForm}>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={personalData.first_name}
                onChangeText={(text) => setPersonalData({ ...personalData, first_name: text })}
                placeholder="First name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={personalData.last_name}
                onChangeText={(text) => setPersonalData({ ...personalData, last_name: text })}
                placeholder="Last name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                value={personalData.birth_day}
                onChangeText={(text) => setPersonalData({ ...personalData, birth_day: text })}
                placeholder="DD"
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                style={styles.dateInput}
                value={personalData.birth_month}
                onChangeText={(text) => setPersonalData({ ...personalData, birth_month: text })}
                placeholder="MM"
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                style={styles.dateInput}
                value={personalData.birth_year}
                onChangeText={(text) => setPersonalData({ ...personalData, birth_year: text })}
                placeholder="YYYY"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={personalData.city}
                onChangeText={(text) => setPersonalData({ ...personalData, city: text })}
                placeholder="City"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={personalData.state}
                onChangeText={(text) => setPersonalData({ ...personalData, state: text })}
                placeholder="State"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <TextInput
              style={styles.input}
              value={personalData.role}
              onChangeText={(text) => setPersonalData({ ...personalData, role: text })}
              placeholder="Software Engineer / Startup Founder"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.goalContainer}>
              {GOAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.goalOption,
                    personalData.goal === option.value && styles.goalOptionSelected
                  ]}
                  onPress={() => setPersonalData({ ...personalData, goal: option.value as any })}
                >
                  <View style={styles.goalContent}>
                    <Text style={[
                      styles.goalTitle,
                      personalData.goal === option.value && styles.goalTitleSelected
                    ]}>
                      {option.title}
                    </Text>
                  </View>
                  <View style={[
                    styles.goalRadio,
                    personalData.goal === option.value && styles.goalRadioSelected
                  ]}>
                    {personalData.goal === option.value && <View style={styles.goalRadioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSavePersonal}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.displayForm}>
          <View style={styles.displayItem}>
            <Text style={styles.displayLabel}>Name</Text>
            <Text style={styles.displayValue}>
              {[personalData.first_name, personalData.last_name].filter(Boolean).join(' ') || 'Not specified'}
            </Text>
          </View>
          <View style={styles.displayItem}>
            <Text style={styles.displayLabel}>Date of Birth</Text>
            <Text style={styles.displayValue}>
              {personalData.birth_day && personalData.birth_month && personalData.birth_year
                ? `${personalData.birth_day}/${personalData.birth_month}/${personalData.birth_year}`
                : 'Not specified'}
            </Text>
          </View>
          <View style={styles.displayItem}>
            <Text style={styles.displayLabel}>Location</Text>
            <Text style={styles.displayValue}>
              {[personalData.city, personalData.state].filter(Boolean).join(', ') || 'Not specified'}
            </Text>
          </View>
          <View style={styles.displayItem}>
            <Text style={styles.displayLabel}>Role</Text>
            <Text style={styles.displayValue}>
              {personalData.role || 'Not specified'}
            </Text>
          </View>
          <View style={styles.displayItem}>
            <Text style={styles.displayLabel}>Goal</Text>
            <Text style={styles.displayValue}>
              {GOAL_OPTIONS.find(option => option.value === personalData.goal)?.title || 'Not specified'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderProfessionalSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Professional Details</Text>
        <TouchableOpacity
          onPress={() => setEditingSection(editingSection === 'professional' ? null : 'professional')}
          style={styles.editButton}
        >
          <Ionicons name={editingSection === 'professional' ? 'close' : 'create-outline'} size={20} color="#FF5864" />
          <Text style={styles.editButtonText}>
            {editingSection === 'professional' ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingSection === 'professional' ? (
        <View style={styles.editForm}>
          {/* Education Section */}
          <View style={styles.subSection}>
            <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>Education</Text>
              <TouchableOpacity onPress={addEducation} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#FF5864" />
                <Text style={styles.addButtonText}>Add Education</Text>
              </TouchableOpacity>
            </View>

            {professionalData.education.map((edu, index) => (
              <View key={index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>Education {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeEducation(index)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={20} color="#FF5864" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={edu.school_name}
                  onChangeText={(text) => updateEducation(index, 'school_name', text)}
                  placeholder="School name"
                />
                <TextInput
                  style={styles.input}
                  value={edu.degree}
                  onChangeText={(text) => updateEducation(index, 'degree', text)}
                  placeholder="Degree"
                />
                <TextInput
                  style={styles.input}
                  value={edu.major}
                  onChangeText={(text) => updateEducation(index, 'major', text)}
                  placeholder="Major"
                />
              </View>
            ))}

            {professionalData.education.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Graduation Date</Text>
                <TextInput
                  style={styles.input}
                  value={professionalData.graduation_date}
                  onChangeText={(text) => setProfessionalData({ ...professionalData, graduation_date: text })}
                  placeholder="YYYY-MM-DD or 'Currently attending'"
                />
              </View>
            )}
          </View>

          {/* Work Experience Section */}
          <View style={styles.subSection}>
            <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>Work Experience</Text>
              <TouchableOpacity onPress={addWorkExperience} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#FF5864" />
                <Text style={styles.addButtonText}>Add Experience</Text>
              </TouchableOpacity>
            </View>

            {professionalData.work_experience.map((exp, index) => (
              <View key={index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>Experience {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeWorkExperience(index)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={20} color="#FF5864" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={exp.company}
                  onChangeText={(text) => updateWorkExperience(index, 'company', text)}
                  placeholder="Company name"
                />
                <TextInput
                  style={styles.input}
                  value={exp.position}
                  onChangeText={(text) => updateWorkExperience(index, 'position', text)}
                  placeholder="Position"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={exp.description}
                  onChangeText={(text) => updateWorkExperience(index, 'description', text)}
                  placeholder="Description"
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.dateRow}>
                  <TextInput
                    style={styles.dateInput}
                    value={exp.startDate}
                    onChangeText={(text) => updateWorkExperience(index, 'startDate', text)}
                    placeholder="Start (YYYY-MM)"
                  />
                  <TextInput
                    style={[styles.dateInput, exp.current && styles.disabledInput]}
                    value={exp.current ? 'Present' : exp.endDate}
                    onChangeText={(text) => updateWorkExperience(index, 'endDate', text)}
                    placeholder="End (YYYY-MM)"
                    editable={!exp.current}
                  />
                </View>
                <TouchableOpacity
                  style={styles.currentJobContainer}
                  onPress={() => updateWorkExperience(index, 'current', !exp.current)}
                >
                  <View style={[styles.checkbox, exp.current && styles.checkboxChecked]}>
                    {exp.current && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.currentJobText}>I currently work here</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Skills Section */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {professionalData.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)} style={styles.skillRemove}>
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.skillInputContainer}>
              <TextInput
                style={styles.skillInput}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Add a skill"
                onSubmitEditing={addSkill}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={addSkill} style={styles.addSkillButton}>
                <Ionicons name="add" size={20} color="#FF5864" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSaveProfessional}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.displayForm}>
          {/* Education Display */}
          {professionalData.education.length > 0 && (
            <View style={styles.displaySubSection}>
              <Text style={styles.displaySubSectionTitle}>Education</Text>
              {professionalData.education.map((edu, index) => (
                <View key={index} style={styles.displayCard}>
                  <Text style={styles.displayCardTitle}>
                    {[edu.degree, edu.major].filter(Boolean).join(' in ')}
                  </Text>
                  <Text style={styles.displayCardSubtitle}>{edu.school_name}</Text>
                  {professionalData.graduation_date && (
                    <Text style={styles.displayCardDetail}>
                      Graduation: {professionalData.graduation_date}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Work Experience Display */}
          {professionalData.work_experience.length > 0 && (
            <View style={styles.displaySubSection}>
              <Text style={styles.displaySubSectionTitle}>Work Experience</Text>
              {professionalData.work_experience.map((exp, index) => (
                <View key={index} style={styles.displayCard}>
                  <Text style={styles.displayCardTitle}>{exp.position}</Text>
                  <Text style={styles.displayCardSubtitle}>{exp.company}</Text>
                  {(exp.startDate || exp.endDate || exp.current) && (
                    <Text style={styles.displayCardDetail}>
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </Text>
                  )}
                  {exp.description && (
                    <Text style={styles.displayCardDescription}>{exp.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Skills Display */}
          {professionalData.skills.length > 0 && (
            <View style={styles.displaySubSection}>
              <Text style={styles.displaySubSectionTitle}>Skills</Text>
              <View style={styles.displaySkillsContainer}>
                {professionalData.skills.map((skill, index) => (
                  <View key={index} style={styles.displaySkillTag}>
                    <Text style={styles.displaySkillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Show message if no professional details */}
          {professionalData.education.length === 0 && 
           professionalData.work_experience.length === 0 && 
           professionalData.skills.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No professional details added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap Edit to add your education, work experience, and skills</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderSocialSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Social Links</Text>
        <TouchableOpacity
          onPress={() => setEditingSection(editingSection === 'social' ? null : 'social')}
          style={styles.editButton}
        >
          <Ionicons name={editingSection === 'social' ? 'close' : 'create-outline'} size={20} color="#FF5864" />
          <Text style={styles.editButtonText}>
            {editingSection === 'social' ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingSection === 'social' ? (
        <View style={styles.editForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="logo-github" size={16} color="#333" />
              <Text> GitHub</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={socialData.github}
              onChangeText={(text) => setSocialData({ ...socialData, github: text })}
              onBlur={() => setSocialData({ ...socialData, github: addProtocol(socialData.github) })}
              placeholder="https://github.com/yourusername"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="logo-linkedin" size={16} color="#0077B5" />
              <Text> LinkedIn</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={socialData.linkedin}
              onChangeText={(text) => setSocialData({ ...socialData, linkedin: text })}
              onBlur={() => setSocialData({ ...socialData, linkedin: addProtocol(socialData.linkedin) })}
              placeholder="https://linkedin.com/in/yourusername"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="globe-outline" size={16} color="#333" />
              <Text> Website</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={socialData.website}
              onChangeText={(text) => setSocialData({ ...socialData, website: text })}
              onBlur={() => setSocialData({ ...socialData, website: addProtocol(socialData.website) })}
              placeholder="https://yourwebsite.com"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSaveSocial}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.displayForm}>
          {socialData.github && (
            <View style={styles.displayItem}>
              <Text style={styles.displayLabel}>GitHub</Text>
              <Text style={styles.displayValue}>{socialData.github}</Text>
            </View>
          )}
          {socialData.linkedin && (
            <View style={styles.displayItem}>
              <Text style={styles.displayLabel}>LinkedIn</Text>
              <Text style={styles.displayValue}>{socialData.linkedin}</Text>
            </View>
          )}
          {socialData.website && (
            <View style={styles.displayItem}>
              <Text style={styles.displayLabel}>Website</Text>
              <Text style={styles.displayValue}>{socialData.website}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderBioSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <TouchableOpacity
          onPress={() => setEditingSection(editingSection === 'bio' ? null : 'bio')}
          style={styles.editButton}
        >
          <Ionicons name={editingSection === 'bio' ? 'close' : 'create-outline'} size={20} color="#FF5864" />
          <Text style={styles.editButtonText}>
            {editingSection === 'bio' ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingSection === 'bio' ? (
        <View style={styles.editForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tell others about yourself</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bioData.bio}
              onChangeText={(text) => setBioData({ ...bioData, bio: text })}
              placeholder="Share your story, interests, and what you're passionate about..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {bioData.bio.length}/500 characters
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSaveBio}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.displayForm}>
          <View style={styles.displayItem}>
            <Text style={styles.displayLabel}>Bio</Text>
            <Text style={styles.displayValue}>
              {bioData.bio || 'No bio added yet'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarImageContainer}>
              {avatarUrl ? (
                <Image 
                  source={{ uri: `${avatarUrl}${cacheBuster}` }} 
                  style={styles.avatarImage}
                  cachePolicy="memory-disk"
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
                  style={[styles.avatarButton, styles.removeAvatarButton, isUploadingAvatar && styles.avatarButtonDisabled]}
                  onPress={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                >
                  <Ionicons name="trash" size={20} color="#FF5864" />
                  <Text style={[styles.avatarButtonText, styles.removeButtonText]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {renderBioSection()}
        {renderPersonalSection()}
        {renderProfessionalSection()}
        {renderSocialSection()}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  editButtonText: {
    color: '#FF5864',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  displayForm: {
    // Display mode styles
  },
  displayItem: {
    marginBottom: 16,
  },
  displayLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  displayValue: {
    fontSize: 16,
    color: '#333',
  },
  editForm: {
    // Edit mode styles
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
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
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  goalContainer: {
    // Goal options container
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  },
  goalTitleSelected: {
    color: '#FF5864',
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
  goalRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#FF5864',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  subSection: {
    marginBottom: 24,
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    color: '#FF5864',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  experienceCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#e8e8e8',
    color: '#999',
  },
  currentJobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#FF5864',
    borderColor: '#FF5864',
  },
  currentJobText: {
    fontSize: 14,
    color: '#333',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5864',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  skillRemove: {
    padding: 2,
  },
  skillInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 12,
  },
  addSkillButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF5864',
    backgroundColor: '#fff',
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
  removeAvatarButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF5864',
  },
  removeButtonText: {
    color: '#FF5864',
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  displaySubSection: {
    marginBottom: 24,
  },
  displaySubSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  displayCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  displayCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  displayCardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  displayCardDetail: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  displayCardDescription: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  displaySkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  displaySkillTag: {
    backgroundColor: '#FF5864',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  displaySkillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#FF5864',
    fontSize: 16,
  },
}); 