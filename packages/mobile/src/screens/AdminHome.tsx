import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Modalize } from 'react-native-modalize';
import Geolocation from 'react-native-geolocation-service';
import CreateNewAnnouncement from '../components/CreateNewAnnouncement';
import { useNavigation } from '@react-navigation/native';

import NavBox from '../components/NavBox';

import { useTheme } from '../../theme/useTheme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AdminHome() {
  const modalRef = useRef<Modalize>(null);

  const navigation = useNavigation<NavigationProp>();

  //using these for NavBox.tsx
  const [currentLocation, setCurrentLocation] = React.useState('');
  const [destination, setDestination] = React.useState('');

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);

  // Placeholder - will be replaced with name from database
  const [userName] = useState('Name');

  const [adminLocation] = useState('Tesla HQ Deer Creek');

  const [announcementDropdownOpen, setAnnouncementDropdownOpen] =
    useState(false);
  const [selectedAnnouncementType, setSelectedAnnouncementType] =
    useState('Select type');

  const { colors } = useTheme();

  const ANNOUNCEMENT_TYPES = ['General', 'Event', 'Alert', 'Update'];

  useEffect(() => {
    Geolocation.getCurrentPosition(
      pos => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      err => setLocationError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.titleText}>Welcome Back</Text>
        <Text style={styles.nameText}>{userName}</Text>
      </View>
      <Text style={styles.locationText}>{adminLocation}</Text>

      <View style={styles.adminButtonContainer}>
        {/* <Pressable
          style={({ pressed }) => [
            styles.adminButton,
            pressed && styles.adminButtonPressed,
          ]}
          onPress={() => modalRef.current?.open()}
        >
          <Text style={styles.createAnnouncementPlusIcon}>+</Text>
          <Text style={styles.adminButtonText}>Create new announcement</Text>
          <Svg
            width={15}
            height={15}
            viewBox="0 0 20 20"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            // strokeLinecap="round"
            // strokeLinejoin="round"
            style={styles.chevronIcon}
          >
            <Path d="M6 9l6 6 6-6" />
          </Svg>
        </Pressable> */}

        {/*SHUTTLE CARD*/}
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [pressed && styles.cardPressed]}
            // onPress={() => navigation.navigate('ShuttleDashboard')}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardIcon}>🚌</Text>
                <Text style={styles.cardTitle}>Shuttle Dashboard</Text>
              </View>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>8</Text>
              </View>
            </View>

            <Text style={styles.cardSubtitle}>8 NEW REPORTS</Text>
          </Pressable>
        </View>

        {/*PARKING MANAGEMENT CARD*/}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>🅿️</Text>
              <Text style={styles.cardTitle}>Parking Management</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>8</Text>
            </View>
          </View>

          <Text style={styles.cardSubtitle}>8 NEW REPORTS</Text>
        </View>

        {/*SETTINGS CARD*/}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>⚙️</Text>
              <Text style={styles.cardTitle}>Parking Management</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>8</Text>
            </View>
          </View>

          <Text style={styles.cardSubtitle}>8 NEW REPORTS</Text>
        </View>
      </View>
      <CreateNewAnnouncement ref={modalRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: { fontSize: 20, marginBottom: 20 },
  modalScreen: {
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    padding: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  modalTitle: {
    marginTop: 30,
    marginLeft: 30,
    marginBottom: 0,
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter',
  },
  modalDropdownWrap: {
    marginRight: 20,
  },
  modalDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalDropdownText: {
    fontSize: 14,
    color: '#000000',
  },
  modalDropdownCaret: {
    marginLeft: 8,
  },
  modalDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    minWidth: 140,
    zIndex: 10,
  },
  modalDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalDropdownItemText: {
    fontSize: 14,
    color: '#000000',
  },

  inputContainer: {
    width: 321,
    height: 90,
    alignSelf: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  input: {
    height: 45,
    padding: 10,
    marginLeft: 30,
    textAlignVertical: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 10,
  },
  welcomeContainer: {
    marginLeft: 51,
    height: 81,
  },
  titleText: {
    marginTop: 57.9854,
    color: '#000000',
    fontSize: 16,
  },
  nameText: {
    marginTop: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 20,
    textTransform: 'capitalize',
    color: '#000000',
  },
  locationText: {
    position: 'absolute',
    top: 120,
    left: 51,
    width: 200,
    fontSize: 12,
    lineHeight: 12,
    color: '#000',
  },
  adminButtonContainer: {
    position: 'absolute',
    top: 153,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  adminButton: {
    width: 328,
    minHeight: 31,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#0761E0',
  },
  adminButtonPressed: {
    opacity: 0.7,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
  },
  // createAnnouncementPlusIcon: {
  //   color: '#FFFFFF',
  //   fontSize: 12,
  //   fontWeight: '400',
  //   marginRight: 8,
  //   marginLeft: 10,
  // },
  // chevronIcon: {
  //   marginLeft: 120,
  //   alignSelf: 'center',
  // },

  card: {
    width: 328,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 20,
    backgroundColor: '#FFFFFF',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    fontFamily: 'Inter',
  },

  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },

  badge: {
    backgroundColor: '#2F5FE3',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardPressed: {
    opacity: 0.5,
  },
});
