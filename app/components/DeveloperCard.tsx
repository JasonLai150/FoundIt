import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Developer, Skill } from '../models/Developer';

interface DeveloperCardProps {
  developer: Developer;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const { width } = Dimensions.get('window');

const SkillBadge = ({ skill }: { skill: Skill }) => (
  <View style={styles.skillBadge}>
    <Text style={styles.skillText}>{skill.name}</Text>
    <Text style={styles.skillLevel}>{skill.level}</Text>
  </View>
);

export default function DeveloperCard({ developer, onSwipeLeft, onSwipeRight }: DeveloperCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color="#ccc" />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{developer.name}</Text>
          <Text style={styles.role}>{developer.role}</Text>
          
          {developer.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{developer.location}</Text>
            </View>
          )}
          
          <Text style={styles.experienceText}>
            {developer.experience ? `${developer.experience} years of experience` : 'Experience not specified'}
          </Text>
          
          <Text style={styles.bioTitle}>About</Text>
          <Text style={styles.bio}>{developer.bio}</Text>
          
          <Text style={styles.skillsTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {developer.skills.map((skill) => (
              <SkillBadge key={skill.id} skill={skill} />
            ))}
          </View>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={onSwipeLeft}>
          <Ionicons name="close-circle" size={30} color="#ff4d4d" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={onSwipeRight}>
          <Ionicons name="checkmark-circle" size={30} color="#4dd964" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    alignSelf: 'center',
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  experienceText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  skillLevel: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  declineButton: {
    backgroundColor: '#fff0f0',
  },
  acceptButton: {
    backgroundColor: '#f0fff0',
  },
}); 