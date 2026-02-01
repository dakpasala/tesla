import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MainHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [origin, setOrigin] = useState('Current Location');
  const [destination, setDestination] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Map View</Text>
        </View>
      </View>

      {/* Search/Navigation Card */}
      <View style={styles.searchCard}>
        <Text style={styles.cardTitle}>Home</Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputDot} />
            <TouchableOpacity style={styles.inputField}>
              <Text style={styles.inputText}>
                {origin || 'Current Location'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputDivider} />

          <View style={styles.inputRow}>
            <View style={[styles.inputDot, styles.destinationDot]} />
            <TouchableOpacity
              style={styles.inputField}
              onPress={() => navigation.navigate('Routes')}
            >
              <Text
                style={[
                  styles.inputText,
                  !destination && styles.placeholderText,
                ]}
              >
                {destination || 'Destination'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Favorites')}
          >
            <Text style={styles.quickActionIcon}>⭐</Text>
            <Text style={styles.quickActionText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Parking')}
          >
            <Text style={styles.quickActionIcon}>🅿️</Text>
            <Text style={styles.quickActionText}>Parking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Routes')}
          >
            <Text style={styles.quickActionIcon}>🗺️</Text>
            <Text style={styles.quickActionText}>Routes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 18,
    color: '#999',
  },
  searchCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111',
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4285F4',
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#EA4335',
  },
  inputField: {
    flex: 1,
  },
  inputText: {
    fontSize: 16,
    color: '#111',
  },
  placeholderText: {
    color: '#999',
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginLeft: 22,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
  },
});
