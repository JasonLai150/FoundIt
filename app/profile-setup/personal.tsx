import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface PersonalFormData {
  first_name: string;
  last_name: string;
  birth_day: string;
  birth_month: string;
  birth_year: string;
  city: string;
  state: string;
  role: string;
  goal: 'recruiting' | 'searching' | 'investing' | 'other';
  // Goal-specific fields
  companyName?: string;
  companyDescription?: string;
  desiredSkills?: string[];
  fundingRound?: string;
  fundingAmount?: string;
  fundingInvestors?: string[];
  firmName?: string;
  firmDescription?: string;
  investmentAreas?: string[];
  investmentMin?: string;
  investmentMax?: string;
}

const PERSONAL_CACHE_KEY = 'personal_setup_cache';

export default function PersonalInfoSetup() {
  const { updateUserProfile, user } = useAuth();
  const { cache, updateProfileCache } = useCache();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PersonalFormData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    // Split DOB into separate fields
    birth_day: user?.dob ? user.dob.split('-')[2] : '',
    birth_month: user?.dob ? user.dob.split('-')[1] : '',
    birth_year: user?.dob ? user.dob.split('-')[0] : '',
    // Split location into separate fields
    city: user?.location ? user.location.split(',')[0]?.trim() : '',
    state: user?.location ? user.location.split(',')[1]?.trim() : '',
    role: user?.role || '',
    goal: user?.goal || 'searching' as 'recruiting' | 'searching' | 'investing' | 'other',
    // Goal-specific fields - safely handle undefined/null values
    companyName: user?.company_name || '',
    companyDescription: user?.company_description || '',
    desiredSkills: Array.isArray(user?.desired_skills) ? user.desired_skills : [],
    fundingRound: user?.funding?.round || '',
    fundingAmount: user?.funding?.amount || '',
    fundingInvestors: Array.isArray(user?.funding?.investors) ? user.funding.investors : [],
    firmName: user?.firm_name || '',
    firmDescription: user?.firm_description || '',
    investmentAreas: Array.isArray(user?.investment_areas) ? user.investment_areas : [],
    investmentMin: user?.investment_amount?.min?.toString() || '',
    investmentMax: user?.investment_amount?.max?.toString() || '',
  });

  // Add useEffect to update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        birth_day: user.dob ? user.dob.split('-')[2] : '',
        birth_month: user.dob ? user.dob.split('-')[1] : '',
        birth_year: user.dob ? user.dob.split('-')[0] : '',
        city: user.location ? user.location.split(',')[0]?.trim() : '',
        state: user.location ? user.location.split(',')[1]?.trim() : '',
        role: user.role || '',
        goal: user.goal || 'searching' as 'recruiting' | 'searching' | 'investing' | 'other',
        // Goal-specific fields - safely handle undefined/null values
        companyName: user.company_name || '',
        companyDescription: user.company_description || '',
        desiredSkills: Array.isArray(user.desired_skills) ? user.desired_skills : [],
        fundingRound: user.funding?.round || '',
        fundingAmount: user.funding?.amount || '',
        fundingInvestors: Array.isArray(user.funding?.investors) ? user.funding.investors : [],
        firmName: user.firm_name || '',
        firmDescription: user.firm_description || '',
        investmentAreas: Array.isArray(user.investment_areas) ? user.investment_areas : [],
        investmentMin: user.investment_amount?.min?.toString() || '',
        investmentMax: user.investment_amount?.max?.toString() || '',
      });
    }
  }, [user]);

  // Tag input state variables
  const [newDesiredSkill, setNewDesiredSkill] = useState('');
  const [newFundingInvestor, setNewFundingInvestor] = useState('');
  const [newInvestmentArea, setNewInvestmentArea] = useState('');

  // Load cached data on component mount
  useEffect(() => {
    loadCachedData();
  }, []);

  // Save to cache whenever form data changes
  useEffect(() => {
    saveToCacheDebounced();
  }, [formData]);

  const loadCachedData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(PERSONAL_CACHE_KEY);
      if (cachedData) {
        const parsedData: PersonalFormData = JSON.parse(cachedData);
        // Only load cache if there's no existing user data
        if (!user?.first_name) {
          setFormData(parsedData);
        }
      }
    } catch (error) {
      console.error('Failed to load cached personal data:', error);
    }
  };

  const saveToCache = async () => {
    try {
      await AsyncStorage.setItem(PERSONAL_CACHE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to save personal data to cache:', error);
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
      await AsyncStorage.removeItem(PERSONAL_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear personal cache:', error);
    }
  };

  // Helper functions for tag management
  const addDesiredSkill = () => {
    if (newDesiredSkill.trim() && !formData.desiredSkills?.includes(newDesiredSkill.trim())) {
      setFormData({
        ...formData,
        desiredSkills: [...(formData.desiredSkills || []), newDesiredSkill.trim()]
      });
      setNewDesiredSkill('');
    }
  };

  const removeDesiredSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      desiredSkills: formData.desiredSkills?.filter(skill => skill !== skillToRemove) || []
    });
  };

  const addFundingInvestor = () => {
    if (newFundingInvestor.trim() && !formData.fundingInvestors?.includes(newFundingInvestor.trim())) {
      setFormData({
        ...formData,
        fundingInvestors: [...(formData.fundingInvestors || []), newFundingInvestor.trim()]
      });
      setNewFundingInvestor('');
    }
  };

  const removeFundingInvestor = (investorToRemove: string) => {
    setFormData({
      ...formData,
      fundingInvestors: formData.fundingInvestors?.filter(investor => investor !== investorToRemove) || []
    });
  };

  const addInvestmentArea = () => {
    if (newInvestmentArea.trim() && !formData.investmentAreas?.includes(newInvestmentArea.trim())) {
      setFormData({
        ...formData,
        investmentAreas: [...(formData.investmentAreas || []), newInvestmentArea.trim()]
      });
      setNewInvestmentArea('');
    }
  };

  const removeInvestmentArea = (areaToRemove: string) => {
    setFormData({
      ...formData,
      investmentAreas: formData.investmentAreas?.filter(area => area !== areaToRemove) || []
    });
  };

  // Utility function for currency formatting
  const formatCurrency = (amount: string): string => {
    if (!amount) return amount;
    
    const numericAmount = amount.replace(/[^0-9]/g, '');
    if (!numericAmount) return amount;
    
    const num = parseInt(numericAmount);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    } else {
      return `$${num.toLocaleString()}`;
    }
  };

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

    // Goal-specific validation
    if (formData.goal === 'recruiting') {
      if (!formData.companyName?.trim()) {
        showAlert('Missing Information', 'Company/Startup name is required for recruiting');
        return false;
      }
    }

    if (formData.goal === 'investing') {
      if (!formData.firmName?.trim()) {
        showAlert('Missing Information', 'Investment firm name is required for investing');
        return false;
      }
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

      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dob: dob,
        location: location,
        role: formData.role.trim() || undefined,
        goal: formData.goal,
        // Goal-specific JSONB fields
        company_name: formData.companyName?.trim() || undefined,
        company_description: formData.companyDescription?.trim() || undefined,
        desired_skills: formData.desiredSkills && formData.desiredSkills.length > 0 ? formData.desiredSkills : undefined,
        funding: (formData.fundingRound || formData.fundingAmount || (formData.fundingInvestors && formData.fundingInvestors.length > 0)) ? {
          round: formData.fundingRound || undefined,
          amount: formData.fundingAmount || undefined,
          investors: (formData.fundingInvestors && formData.fundingInvestors.length > 0) ? formData.fundingInvestors : undefined,
        } : undefined,
        firm_name: formData.firmName?.trim() || undefined,
        firm_description: formData.firmDescription?.trim() || undefined,
        investment_areas: formData.investmentAreas && formData.investmentAreas.length > 0 ? formData.investmentAreas : undefined,
        investment_amount: (formData.investmentMin || formData.investmentMax) ? {
          min: formData.investmentMin ? parseInt(formData.investmentMin) : undefined,
          max: formData.investmentMax ? parseInt(formData.investmentMax) : undefined,
        } : undefined,
      };

      const success = await updateUserProfile(updateData);

      if (success) {
        // Update cache with new user data and existing experience data
        const currentExperienceData = cache.userProfile ? {
          id: cache.userProfile.experience_id,
          education: cache.userProfile.educationEntries || [],
          work_experience: cache.userProfile.workExperiences || [],
          skills: cache.userProfile.skills.map(skill => skill.name) || [],
          graduation_date: cache.userProfile.graduation_date,
        } : null;
        
        updateProfileCache({ ...user, ...updateData }, currentExperienceData);
        
        // Clear local cache only after successful submission
        await clearCache();
        router.push('/profile-setup/professional' as any);
      } else {
        showAlert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      showAlert('Error', 'An error occurred while updating your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    // Clear cache when skipping
    await clearCache();
    router.push('/(tabs)/feed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>Let&apos;s get to know you better</Text>
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
            <Text style={styles.label}>Role</Text>
            <Text style={styles.hint}>Describe your role</Text>
            <TextInput
              style={styles.input}
              value={formData.role}
              onChangeText={(text) => setFormData({ ...formData, role: text })}
              placeholder="Backend Engineer / Startup Founder"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal *</Text>
            <Text style={styles.hint}>What brings you to FoundIt?</Text>
            <View style={styles.goalContainer}>
            {GOAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.goalOption,
                  formData.goal === option.value && styles.goalOptionSelected
                ]}
                  onPress={() => setFormData({ ...formData, goal: option.value as PersonalFormData['goal'] })}
              >
                  <View style={styles.goalOptionContent}>
                  <Text style={[
                      styles.goalOptionTitle,
                      formData.goal === option.value && styles.goalOptionTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[
                      styles.goalOptionDescription,
                      formData.goal === option.value && styles.goalOptionDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </View>
                <View style={[
                    styles.goalOptionRadio,
                    formData.goal === option.value && styles.goalOptionRadioSelected
                ]}>
                    {formData.goal === option.value && <View style={styles.goalOptionRadioInner} />}
                </View>
              </TouchableOpacity>
            ))}
            </View>
          </View>

          {/* Goal-specific fields - Recruiting */}
          {formData.goal === 'recruiting' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company/Startup Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.companyName || ''}
                  onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                  placeholder="Acme Corp / My Startup"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.companyDescription || ''}
                  onChangeText={(text) => setFormData({ ...formData, companyDescription: text })}
                  placeholder="Brief description of your company..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Desired Skills</Text>
                <Text style={styles.hint}>Skills you're looking for in candidates</Text>
                <View style={styles.skillsContainer}>
                  {(formData.desiredSkills || []).map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill}</Text>
                      <TouchableOpacity onPress={() => removeDesiredSkill(skill)}>
                        <Text style={styles.skillRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={styles.addSkillContainer}>
                  <TextInput
                    style={styles.skillInput}
                    value={newDesiredSkill}
                    onChangeText={setNewDesiredSkill}
                    placeholder="Add a desired skill"
                    placeholderTextColor="#666"
                    onSubmitEditing={addDesiredSkill}
                  />
                  <TouchableOpacity style={styles.addSkillButton} onPress={addDesiredSkill}>
                    <Text style={styles.addSkillButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Funding Round</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fundingRound || ''}
                  onChangeText={(text) => setFormData({ ...formData, fundingRound: text })}
                  placeholder="Seed / Series A / Series B / etc."
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Funding Amount</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fundingAmount || ''}
                  onChangeText={(text) => setFormData({ ...formData, fundingAmount: text })}
                  placeholder="$500K / $1M / $5M"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notable Investors</Text>
                <Text style={styles.hint}>Key investors or VCs backing your company</Text>
                <View style={styles.skillsContainer}>
                  {(formData.fundingInvestors || []).map((investor, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{investor}</Text>
                      <TouchableOpacity onPress={() => removeFundingInvestor(investor)}>
                        <Text style={styles.skillRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={styles.addSkillContainer}>
                  <TextInput
                    style={styles.skillInput}
                    value={newFundingInvestor}
                    onChangeText={setNewFundingInvestor}
                    placeholder="Add an investor"
                    placeholderTextColor="#666"
                    onSubmitEditing={addFundingInvestor}
                  />
                  <TouchableOpacity style={styles.addSkillButton} onPress={addFundingInvestor}>
                    <Text style={styles.addSkillButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Goal-specific fields - Investing */}
          {formData.goal === 'investing' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Investment Firm Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firmName || ''}
                  onChangeText={(text) => setFormData({ ...formData, firmName: text })}
                  placeholder="Venture Capital Partners"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Firm Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.firmDescription || ''}
                  onChangeText={(text) => setFormData({ ...formData, firmDescription: text })}
                  placeholder="Brief description of your investment firm..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Investment Areas</Text>
                <Text style={styles.hint}>Sectors or industries you invest in</Text>
                <View style={styles.skillsContainer}>
                  {(formData.investmentAreas || []).map((area, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{area}</Text>
                      <TouchableOpacity onPress={() => removeInvestmentArea(area)}>
                        <Text style={styles.skillRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={styles.addSkillContainer}>
                  <TextInput
                    style={styles.skillInput}
                    value={newInvestmentArea}
                    onChangeText={setNewInvestmentArea}
                    placeholder="Add an investment area"
                    placeholderTextColor="#666"
                    onSubmitEditing={addInvestmentArea}
                  />
                  <TouchableOpacity style={styles.addSkillButton} onPress={addInvestmentArea}>
                    <Text style={styles.addSkillButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Investment Range</Text>
                <Text style={styles.hint}>Typical investment amount range</Text>
                <View style={styles.investmentRangeContainer}>
                  <TextInput
                    style={styles.investmentInput}
                    value={formData.investmentMin || ''}
                    onChangeText={(text) => setFormData({ ...formData, investmentMin: text.replace(/[^0-9]/g, '') })}
                    placeholder="Min (e.g., 100000)"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                  <Text style={styles.investmentSeparator}>to</Text>
                  <TextInput
                    style={styles.investmentInput}
                    value={formData.investmentMax || ''}
                    onChangeText={(text) => setFormData({ ...formData, investmentMax: text.replace(/[^0-9]/g, '') })}
                    placeholder="Max (e.g., 5000000)"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                {(formData.investmentMin || formData.investmentMax) && (
                  <Text style={styles.hint}>
                    Range: {formData.investmentMin ? formatCurrency(formData.investmentMin) : '$0'} - {formData.investmentMax ? formatCurrency(formData.investmentMax) : '∞'}
                  </Text>
                )}
              </View>
            </>
          )}
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
  hint: {
    fontSize: 14,
    color: '#666',
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
  goalContainer: {
    // Add styles for the container if needed, e.g., gap
  },
  goalOptionContent: {
    flex: 1,
  },
  goalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalOptionTitleSelected: {
    color: '#FF5864',
  },
  goalOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  goalOptionDescriptionSelected: {
    color: '#333',
  },
  goalOptionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalOptionRadioSelected: {
    backgroundColor: '#FF5864',
    borderColor: '#FF5864',
  },
  goalOptionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skillText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  skillRemoveText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  addSkillContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  addSkillButton: {
    backgroundColor: '#FF5864',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  addSkillButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  investmentRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  investmentInput: {
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
  investmentSeparator: {
    fontSize: 16,
    color: '#666',
  },
}); 