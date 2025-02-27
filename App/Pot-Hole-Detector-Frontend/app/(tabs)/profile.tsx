// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const DEFAULT_PROFILE_PICTURE = 'https://imgs.search.brave.com/uLARhH16ug7xgUl3msl3yHs0DCWkofOAnLVeWQ-poy0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/a2luZHBuZy5jb20v/cGljYy9tLzI1Mi0y/NTI0Njk1X2R1bW15/LXByb2ZpbGUtaW1h/Z2UtanBnLWhkLXBu/Zy1kb3dubG9hZC5w/bmc';

const Profile = () => {
  const router = useRouter();

  // State variables for user data
  const [userData, setUserData] = useState({
    profilePicture: DEFAULT_PROFILE_PICTURE,
    name: '',
    level: 'Beginner',
    rating: 0,
    email: '',
    phone: 'N/A',
  });

  // Add state to track the previous route
  const [previousRoute, setPreviousRoute] = useState<string>('/');

  // Function to fetch user data from backend
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth');
        return;
      }

      const response = await axios.get(`https://pot-hole-detector.onrender.com/api/v1/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const user = response.data.user;
        setUserData({
          profilePicture: user.profilePicture || DEFAULT_PROFILE_PICTURE,
          name: user.name || '',
          level: calculateUserLevel(user.reports || 0), // Calculate level based on number of reports
          rating: user.rating || 0,
          email: user.email || '',
          phone: user.phone || 'N/A',
        });

        // Store user data in AsyncStorage
        await AsyncStorage.multiSet([
          ['userName', user.name],
          ['userEmail', user.email],
          ['userPhone', user.phone || ''],
          ['userProfilePicture', user.profilePicture || userData.profilePicture],
        ]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    }
  };

  // Calculate user level based on number of reports
  const calculateUserLevel = (reportsCount: number) => {
    if (reportsCount >= 50) return 'Expert';
    if (reportsCount >= 20) return 'Advanced';
    if (reportsCount >= 5) return 'Intermediate';
    return 'Beginner';
  };

  // Load user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, []);

  // Refresh user data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  // Get the previous route when component mounts
  useEffect(() => {
    const getPreviousRoute = async () => {
      try {
        const route = await AsyncStorage.getItem('previousRoute');
        if (route) {
          setPreviousRoute(route);
        }
      } catch (error) {
        console.error('Error getting previous route:', error);
      }
    };
    getPreviousRoute();
  }, []);

  // Handle close button press
  const handleClose = () => {
    // Navigate back to the previous route
    router.replace(previousRoute);
  };

  // Handle Logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Clear all stored data
              await AsyncStorage.multiRemove([
                'userToken',
                'userName',
                'userEmail',
                'userPhone',
                'userProfilePicture',
              ]);
              router.replace('/auth');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'An error occurred while logging out. Please try again.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header with Close Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityLabel="Close Profile"
        >
          <Ionicons name="close" size={35} color="#333333" style={{ marginRight: 10 }}/>
        </TouchableOpacity>
        <View style={styles.header}>
          <Image
            source={{ uri: userData.profilePicture }}
            style={styles.profileImage}
            onError={() => {
              setUserData(prev => ({
                ...prev,
                profilePicture: DEFAULT_PROFILE_PICTURE
              }));
            }}
          />
          <Text style={styles.name}>{userData.name}</Text>
        </View>
      </View>

      {/* User Information */}
      <View style={styles.infoContainer}>
        {/* Level */}
        <View style={styles.infoRow}>
          <Ionicons name="podium" size={24} color="#007AFF" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Level</Text>
            <Text style={styles.infoValue}>{userData.level}</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.infoRow}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(userData.rating) ? 'star' : 'star-outline'}
                  size={20}
                  color="#FFD700"
                />
              ))}
              <Text style={styles.ratingText}> {userData.rating} / 5</Text>
            </View>
          </View>
        </View>

        {/* Email */}
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={24} color="#34C759" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.infoRow}>
          <Ionicons name="call" size={24} color="#FF9500" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Phone</Text>
            <Text style={styles.infoValue}>{userData.phone}</Text>
          </View>
        </View>

        {/* Add more information fields as needed */}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          accessibilityLabel="Edit Profile Button"
          onPress={() => router.push('/editProfile')}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          accessibilityLabel="Logout Button"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    backgroundColor: '#EFEFEF', // Adjust based on theme
    flexGrow: 1,
  },
  headerContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 30,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333333',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoContainer: {
    marginBottom: 30,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginHorizontal: 15,
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    color: '#8e8e93',
  },
  infoValue: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 5,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
});
