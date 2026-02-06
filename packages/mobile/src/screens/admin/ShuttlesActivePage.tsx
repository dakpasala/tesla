// packages/mobile/src/screens/admin/ShuttlesActivePage.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ShuttleListItem from '../../components/ShuttleListItem';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';

const HARDCODED_SHUTTLES = [
  {
    id: '1',
    name: 'Tesla HQ Deer Creek Shuttle A',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'red' as const,
  },
  {
    id: '2',
    name: 'Tesla HQ Deer Creek Shuttle B',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'blue' as const,
  },
  {
    id: '3',
    name: 'Tesla HQ Deer Creek Shuttle C',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'green' as const,
  },
  {
    id: '4',
    name: 'Tesla HQ Deer Creek Shuttle D',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'orange' as const,
  },
];

export default function ShuttlesActivePage() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'< '}Shuttle Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Shuttles Active</Text>

        <View style={styles.announcementWrapper}>
          <AnnouncementDropDown
            onSelectOption={(option) => {
              console.log('Selected:', option);
            }}
          />
        </View>

        <Text style={styles.sectionLabel}>SHUTTLE STATUS</Text>

        {HARDCODED_SHUTTLES.map((shuttle, idx) => (
          <ShuttleListItem
            key={shuttle.id}
            title={shuttle.name}
            subtitle={shuttle.route}
            statusColor={shuttle.color}
            showSeparator={idx < HARDCODED_SHUTTLES.length - 1}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { padding: 4 },
  backText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  announcementWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 100,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
});