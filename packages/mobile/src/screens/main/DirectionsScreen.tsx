import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DirectionsRouteProp = RouteProp<RootStackParamList, 'Directions'>;

interface DirectionStep {
  id: string;
  instruction: string;
  distance: string;
  icon: string;
}

const MOCK_STEPS: DirectionStep[] = [
  {
    id: '1',
    instruction: 'Head north on Main St',
    distance: '0.2 mi',
    icon: '↑',
  },
  {
    id: '2',
    instruction: 'Turn right onto Oak Ave',
    distance: '0.5 mi',
    icon: '→',
  },
  {
    id: '3',
    instruction: 'Merge onto US-101 N',
    distance: '8.2 mi',
    icon: '↗',
  },
  {
    id: '4',
    instruction: 'Take exit 398 toward Palo Alto',
    distance: '0.3 mi',
    icon: '↱',
  },
  {
    id: '5',
    instruction: 'Turn left onto Deer Creek Rd',
    distance: '0.8 mi',
    icon: '←',
  },
  { id: '6', instruction: 'Arrive at Tesla HQ', distance: '', icon: '📍' },
];

export default function DirectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DirectionsRouteProp>();
  const [isNavigating, setIsNavigating] = useState(false);

  const startNavigation = () => {
    setIsNavigating(true);
    // In a real app, this would start turn-by-turn navigation
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map area */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Route Map</Text>
        </View>

        {/* Back button overlay */}
        <TouchableOpacity
          style={styles.backButtonOverlay}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Directions panel */}
      <View style={styles.directionsPanel}>
        <View style={styles.routeSummary}>
          <View>
            <Text style={styles.summaryDuration}>25 min</Text>
            <Text style={styles.summaryDetails}>12.5 mi • Via US-101 N</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.startButton,
              isNavigating && styles.startButtonActive,
            ]}
            onPress={startNavigation}
          >
            <Text style={styles.startButtonText}>
              {isNavigating ? 'Navigating...' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.stepsList}>
          {MOCK_STEPS.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>{step.icon}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                {step.distance && (
                  <Text style={styles.stepDistance}>{step.distance}</Text>
                )}
              </View>
              {index < MOCK_STEPS.length - 1 && (
                <View style={styles.stepConnector} />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 18,
    color: '#999',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    color: '#111',
  },
  directionsPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  routeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryDuration: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  summaryDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonActive: {
    backgroundColor: '#34A853',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepsList: {
    padding: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconText: {
    fontSize: 16,
  },
  stepInfo: {
    flex: 1,
    paddingTop: 8,
  },
  stepInstruction: {
    fontSize: 16,
    color: '#111',
  },
  stepDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stepConnector: {
    position: 'absolute',
    left: 17,
    top: 36,
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
  },
});
