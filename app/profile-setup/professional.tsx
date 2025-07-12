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

interface WorkExperience {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export default function ProfessionalSetup() {
  const { createUserExperience, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schools: [] as string[], // Changed from single school to array of schools
    graduation_date: '',
    skills: [] as string[],
  });
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSchool, setNewSchool] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addSchool = () => {
    if (newSchool.trim() && !formData.schools.includes(newSchool.trim())) {
      setFormData({
        ...formData,
        schools: [...formData.schools, newSchool.trim()]
      });
      setNewSchool('');
    }
  };

  const removeSchool = (schoolToRemove: string) => {
    setFormData({
      ...formData,
      schools: formData.schools.filter(school => school !== schoolToRemove)
    });
  };

  const addWorkExperience = () => {
    setWorkExperiences([...workExperiences, {
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      current: false,
    }]);
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    const updated = [...workExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperiences(updated);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Filter out empty work experiences
      const validWorkExperiences = workExperiences.filter(exp => 
        exp.company.trim() && exp.position.trim()
      );

      const success = await createUserExperience({
        profile_id: user!.id,
        school: formData.schools.length > 0 ? formData.schools : undefined,
        graduation_date: formData.graduation_date.trim() || undefined,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        work_experience: validWorkExperiences.length > 0 ? validWorkExperiences : undefined,
      });

      if (success) {
        router.push('/profile-setup/socials' as any);
      }
    } catch (error) {
      console.error('Error saving professional details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/profile-setup/socials' as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Professional Details</Text>
          <Text style={styles.subtitle}>Tell us about your background</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressDot, styles.progressActive]} />
            <View style={styles.progressDot} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schools</Text>
            <View style={styles.skillsContainer}>
              {formData.schools.map((school, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{school}</Text>
                  <TouchableOpacity
                    onPress={() => removeSchool(school)}
                    style={styles.skillRemove}
                  >
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.skillInputContainer}>
              <TextInput
                style={styles.skillInput}
                value={newSchool}
                onChangeText={setNewSchool}
                placeholder="Add a school (e.g., MIT, Stanford)"
                onSubmitEditing={addSchool}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={addSchool} style={styles.addSkillButton}>
                <Ionicons name="add" size={20} color="#FF5864" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Graduation Date</Text>
            <TextInput
              style={styles.input}
              value={formData.graduation_date}
              onChangeText={(text) => setFormData({ ...formData, graduation_date: text })}
              placeholder="YYYY-MM-DD or 'Currently attending'"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skills</Text>
            <View style={styles.skillsContainer}>
              {formData.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => removeSkill(skill)}
                    style={styles.skillRemove}
                  >
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
                placeholder="Add a skill (e.g., React, Python, Design)"
                onSubmitEditing={addSkill}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={addSkill} style={styles.addSkillButton}>
                <Ionicons name="add" size={20} color="#FF5864" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Work Experience</Text>
              <TouchableOpacity onPress={addWorkExperience} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#FF5864" />
                <Text style={styles.addButtonText}>Add Experience</Text>
              </TouchableOpacity>
            </View>

            {workExperiences.map((experience, index) => (
              <View key={index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>Experience {index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeWorkExperience(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF5864" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  value={experience.company}
                  onChangeText={(text) => updateWorkExperience(index, 'company', text)}
                  placeholder="Company name"
                  autoCapitalize="words"
                />

                <TextInput
                  style={styles.input}
                  value={experience.position}
                  onChangeText={(text) => updateWorkExperience(index, 'position', text)}
                  placeholder="Position/Role"
                  autoCapitalize="words"
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={experience.description}
                  onChangeText={(text) => updateWorkExperience(index, 'description', text)}
                  placeholder="Description of your role and achievements"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.dateRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={experience.startDate}
                    onChangeText={(text) => updateWorkExperience(index, 'startDate', text)}
                    placeholder="Start (YYYY-MM)"
                  />
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={experience.endDate}
                    onChangeText={(text) => updateWorkExperience(index, 'endDate', text)}
                    placeholder="End (YYYY-MM)"
                    editable={!experience.current}
                  />
                </View>

                <TouchableOpacity
                  style={styles.currentJobContainer}
                  onPress={() => updateWorkExperience(index, 'current', !experience.current)}
                >
                  <View style={[styles.checkbox, experience.current && styles.checkboxChecked]}>
                    {experience.current && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.currentJobText}>I currently work here</Text>
                </TouchableOpacity>
              </View>
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
          <Text style={styles.skipText}>Skip</Text>
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
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: '#f9f9f9',
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
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
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