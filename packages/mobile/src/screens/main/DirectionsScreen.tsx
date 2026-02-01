import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Modalize } from 'react-native-modalize';

// Import existing components
import NavBox from '../../components/NavBox';
import OptionsCard, { OptionItem } from '../../components/OptionsCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DirectionsRouteProp = RouteProp<RootStackParamList, 'Directions'>;

// Mock shuttle options using OptionItem type
const SHUTTLE_OPTIONS: OptionItem[] = [
  {
    id: '1',
    icon: require('../../assets/icons/new/newShuttle.png'),
    title: 'Tesla Shuttle A',
    subtitle: 'On Time',
    selected: true,
  },
];

// Other transport options
const OTHER_OPTIONS: OptionItem[] = [
  {
    id: '2',
    icon: require('../../assets/icons/new/newCar.png'),
    title: '2 min',
    subtitle: 'Available',
  },
  {
    id: '3',
    icon: require('../../assets/icons/new/newBike.png'),
    title: '5 min',
    subtitle: 'Available',
  },
];

export default function DirectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DirectionsRouteProp>();
  const modalRef = useRef<Modalize>(null);

  // Location state
  const [currentLocation, setCurrentLocation] = useState('Current');
  const [destination, setDestination] = useState('Tesla HQ Deer Creek');

  const [selectedOption, setSelectedOption] = useState<string>('1');

  const handleOptionSelect = (item: OptionItem) => {
    setSelectedOption(item.id);
  };

  const handleStartNavigation = () => {
    // Start navigation - could navigate to an active navigation screen
    console.log('Starting navigation...');
  };

  return (
    <View style={styles.container}>
      {/* Map Background (placeholder) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Route map with directions will go here */}
        </View>

        {/* Back button overlay */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* NavBox for origin/destination */}
      <View style={styles.navBoxContainer}>
        <NavBox
          currentLocation={currentLocation}
          destination={destination}
          currentLocationIcon={require('../../assets/icons/current.png')}
          destinationIcon={require('../../assets/icons/destination.png')}
          onCurrentLocationChange={setCurrentLocation}
          onDestinationChange={setDestination}
        />
      </View>

      {/* Bottom Sheet with Route Details */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        alwaysOpen={400}
        modalHeight={600}
        panGestureEnabled={true}
        withHandle={true}
      >
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Route Header */}
          <View style={styles.routeHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.allRoutesLink}>{'< All Routes'}</Text>
            </TouchableOpacity>
            <View style={styles.etaContainer}>
              <Text style={styles.etaTime}>50 Min</Text>
              <Text style={styles.etaSubtext}>9:30AM ETA</Text>
            </View>
          </View>

          {/* Shuttle Info */}
          <View style={styles.shuttleInfo}>
            <Text style={styles.shuttleName}>Tesla Shuttle A</Text>
            <Text style={styles.shuttleStatus}>On Time · 10 min away</Text>
          </View>

          {/* Route Details */}
          <View style={styles.routeDetails}>
            <Text style={styles.sectionLabel}>ROUTE DETAILS</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailDot} />
              <Text style={styles.detailText}>Your Location</Text>
              <Text style={styles.detailTime}>8:40 AM</Text>
            </View>

            <View style={styles.detailConnector}>
              <Text style={styles.walkText}>🚶 10 min walk</Text>
            </View>

            {/* Other Options */}
            <View style={styles.otherOptions}>
              <Text style={styles.otherOptionsLabel}>Other Options:</Text>
              <View style={styles.optionPills}>
                {OTHER_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.id} style={styles.optionPill}>
                    <Text style={styles.optionPillText}>{opt.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailDot, styles.stopDot]} />
              <View style={styles.stopInfo}>
                <Text style={styles.detailText}>
                  Stevens Creek/Albany Bus Stop
                </Text>
                <Text style={styles.stopSubtext}>Tesla Shuttle A</Text>
                <View style={styles.stopTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>🚌 65% Full</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>📶 Free Wifi</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.detailTime}>8:50 AM</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailDot, styles.destDot]} />
              <Text style={styles.detailText}>Deer Creek</Text>
              <Text style={styles.detailTime}>9:30 AM</Text>
            </View>
          </View>

          {/* Report Link */}
          <TouchableOpacity style={styles.reportLink}>
            <Text style={styles.reportText}>
              See something off?{' '}
              <Text style={styles.reportLinkText}>Report it</Text>
            </Text>
          </TouchableOpacity>

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartNavigation}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
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
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 24,
    color: '#111',
  },
  navBoxContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
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
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  allRoutesLink: {
    fontSize: 14,
    color: '#666',
  },
  etaContainer: {
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
  routeDetails: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  detailDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    marginRight: 12,
    marginTop: 4,
  },
  stopDot: {
    backgroundColor: '#666',
  },
  destDot: {
    backgroundColor: '#EA4335',
  },
  detailText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  detailTime: {
    fontSize: 14,
    color: '#666',
  },
  detailConnector: {
    marginLeft: 5,
    paddingLeft: 18,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
    paddingVertical: 8,
  },
  walkText: {
    fontSize: 14,
    color: '#666',
  },
  otherOptions: {
    marginLeft: 24,
    marginBottom: 12,
  },
  otherOptionsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  optionPills: {
    flexDirection: 'row',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  optionPillText: {
    fontSize: 12,
    color: '#666',
  },
  stopInfo: {
    flex: 1,
  },
  stopSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  stopTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
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
  startButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
