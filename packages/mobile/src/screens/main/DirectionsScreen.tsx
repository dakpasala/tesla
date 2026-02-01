import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Modalize } from 'react-native-modalize';

// Import existing components
import NavBox from '../../components/NavBox';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DirectionsRouteProp = RouteProp<RootStackParamList, 'Directions'>;

export default function DirectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DirectionsRouteProp>();
  const modalRef = useRef<Modalize>(null);

  // Mock destination coordinates (would come from route data)
  const destinationLat = 37.4419;
  const destinationLng = -122.143;
  const destinationName = 'Tesla Deer Creek';

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

  return (
    <View style={styles.container}>
      {/* Map Background (placeholder) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Route map will go here */}
        </View>
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

      {/* Bottom Sheet - En Route Info */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        alwaysOpen={350}
        modalHeight={500}
      >
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Route Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backLink}>{'< All Routes'}</Text>
            </TouchableOpacity>
            <View style={styles.etaInfo}>
              <Text style={styles.etaTime}>50 Min</Text>
              <Text style={styles.etaSubtext}>9:30AM ETA</Text>
            </View>
          </View>

          {/* Shuttle Info */}
          <View style={styles.shuttleInfo}>
            <Text style={styles.shuttleName}>Tesla Shuttle A</Text>
            <Text style={styles.shuttleStatus}>On Time · 10 min away</Text>
          </View>

          {/* Arrival Card */}
          <View style={styles.arrivalCard}>
            <View style={styles.arrivalHeader}>
              <Text style={styles.arrivalLabel}>Arriving In 6 Min</Text>
              <Text style={styles.arrivalStop}>
                Stevens Creek & Albany Bus Stop
              </Text>
              <Text style={styles.onTime}>On Time</Text>
            </View>
            <View style={styles.capacityRow}>
              <Text style={styles.capacityText}>🚌 75% Full</Text>
            </View>
          </View>

          {/* Report Link */}
          <TouchableOpacity style={styles.reportLink} onPress={handleReport}>
            <Text style={styles.reportText}>
              See something off?{' '}
              <Text style={styles.reportLinkText}>Report it</Text>
            </Text>
          </TouchableOpacity>

          {/* Map Redirect Buttons */}
          <View style={styles.mapButtons}>
            <TouchableOpacity style={styles.mapButton} onPress={openInMaps}>
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={openInGoogleMaps}
            >
              <Text style={styles.mapButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.navigate('MainHome')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8e8e8',
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
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  backLink: {
    fontSize: 14,
    color: '#666',
  },
  etaInfo: {
    alignItems: 'flex-end',
  },
  etaTime: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  etaSubtext: {
    fontSize: 14,
    color: '#4285F4',
  },
  shuttleInfo: {
    marginBottom: 20,
  },
  shuttleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  shuttleStatus: {
    fontSize: 14,
    color: '#4285F4',
    marginTop: 2,
  },
  arrivalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  arrivalHeader: {
    marginBottom: 8,
  },
  arrivalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  arrivalStop: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  onTime: {
    fontSize: 13,
    color: '#4285F4',
    marginTop: 2,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 13,
    color: '#666',
  },
  reportLink: {
    marginBottom: 20,
  },
  reportText: {
    fontSize: 14,
    color: '#666',
  },
  reportLinkText: {
    color: '#4285F4',
    textDecorationLine: 'underline',
  },
  mapButtons: {
    gap: 12,
  },
  mapButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4285F4',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#EA4335',
  },
});
