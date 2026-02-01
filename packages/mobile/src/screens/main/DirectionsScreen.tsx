import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Modalize } from 'react-native-modalize';
import { useRideContext, TravelMode } from '../../context/RideContext';

// Import existing components
import NavBox from '../../components/NavBox';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DirectionsRouteProp = RouteProp<RootStackParamList, 'Directions'>;

export default function DirectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DirectionsRouteProp>();
  const modalRef = useRef<Modalize>(null);
  const { destination, travelMode, setTravelMode } = useRideContext();

  // Fallback if no destination in context (shouldn't happen in flow)
  const destinationLat = destination?.coordinate?.latitude ?? 37.4419;
  const destinationLng = destination?.coordinate?.longitude ?? -122.143;
  const destinationName = destination?.title ?? 'Tesla Deer Creek';

  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${destinationLat},${destinationLng}`,
      android: `google.navigation:q=${destinationLat},${destinationLng}`,
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Maps app not available');
        }
      });
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
    Linking.openURL(url);
  };

  const handleReport = () => {
    Alert.alert('Report an Issue', 'Select an issue type:', [
      {
        text: 'Shuttle Delayed',
        onPress: () => console.log('Shuttle Delayed'),
      },
      { text: 'Missed Pickup', onPress: () => console.log('Missed Pickup') },
      { text: 'Shuttle Full', onPress: () => console.log('Shuttle Full') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['car', 'shuttle', 'transit', 'bike'] as TravelMode[]).map(mode => (
        <TouchableOpacity
          key={mode}
          style={[styles.tab, travelMode === mode && styles.activeTab]}
          onPress={() => setTravelMode(mode)}
        >
          {/* Icons would go here, using text for now or simple placeholders */}
          <Text
            style={[
              styles.tabText,
              travelMode === mode && styles.activeTabText,
            ]}
          >
            {mode === 'car' && '🚗'}
            {mode === 'shuttle' && '🚌'}
            {mode === 'transit' && '🚆'}
            {mode === 'bike' && '🚲'}
          </Text>
          <Text
            style={[
              styles.tabLabel,
              travelMode === mode && styles.activeTabText,
            ]}
          >
            {mode === 'car' && '30m'}
            {mode === 'shuttle' && '50m'}
            {mode === 'transit' && '1h 5m'}
            {mode === 'bike' && '35m'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: destinationLat,
            longitude: destinationLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{ latitude: destinationLat, longitude: destinationLng }}
            title={destinationName}
          />
        </MapView>
      </View>

      {/* NavBox overlay at top */}
      <View style={styles.navBoxOverlay}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.navBoxWrapper}>
          <NavBox
            currentLocation="Current"
            destination={destinationName}
            currentLocationIcon={require('../../assets/icons/current.png')}
            destinationIcon={require('../../assets/icons/destination.png')}
            onCurrentLocationChange={() => {}}
            onDestinationChange={() => {}}
          />
        </View>
      </View>

      {/* Bottom Sheet - Route Planning */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        alwaysOpen={350}
        modalHeight={500}
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          contentContainerStyle: styles.sheetContent,
        }}
      >
        {renderTabs()}

        {/* Time Selector */}
        <View style={styles.timeSelector}>
          <Text style={styles.timeLabel}>Time Selector</Text>
          <TouchableOpacity style={styles.timeButton}>
            <Text style={styles.timeButtonText}>Now: 12:20 PM ▼</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Start Card */}
        <View style={styles.quickStartCard}>
          <View style={styles.quickHeader}>
            <Text style={styles.quickTitle}>✦ QUICK START</Text>
          </View>
          <View style={styles.quickBody}>
            <View>
              <Text style={styles.quickTime}>
                {travelMode === 'shuttle' ? '50m' : '30m'}{' '}
                <Text style={styles.quickEta}>9:30AM ETA</Text>
              </Text>
              <Text style={styles.quickDetails}>
                Stevens Creek/Albany · Leaves At 8:45AM
              </Text>
            </View>
            <TouchableOpacity
              style={styles.goButton}
              onPress={openInGoogleMaps}
            >
              <Text style={styles.goButtonText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Other Modes / Report Link */}
        <View style={styles.footerLinks}>
          <Text style={styles.footerTitle}>✦ OTHER MODES</Text>
          {/* Can add more details here later */}
        </View>

        <TouchableOpacity style={styles.reportLink} onPress={handleReport}>
          <Text style={styles.reportText}>
            See something off?{' '}
            <Text style={styles.reportLinkText}>Report it</Text>
          </Text>
        </TouchableOpacity>
      </Modalize>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  navBoxOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 20,
    color: '#111',
  },
  navBoxWrapper: {
    flex: 1,
  },
  modalStyle: {
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    backgroundColor: '#DEDEDE',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
  },
  sheetContent: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E8F0FE',
  },
  tabText: {
    fontSize: 20,
    marginBottom: 4,
    color: '#888',
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  timeSelector: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
  timeButton: {
    backgroundColor: '#F1F1F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  quickStartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 20,
    overflow: 'hidden',
  },
  quickHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111',
    letterSpacing: 0.5,
  },
  quickBody: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickTime: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
  },
  quickEta: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
  },
  quickDetails: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  goButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  footerLinks: {
    marginBottom: 20,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  reportLink: {
    marginBottom: 40,
    alignSelf: 'center',
  },
  reportText: {
    fontSize: 14,
    color: '#666',
  },
  reportLinkText: {
    color: '#4285F4',
    textDecorationLine: 'underline',
  },
});
