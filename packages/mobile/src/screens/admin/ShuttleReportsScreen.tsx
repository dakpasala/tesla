// packages/mobile/src/screens/admin/ShuttleReportsScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Modalize } from 'react-native-modalize';
import {
  getShuttleReportsAdmin,
  getAllReports,
  Report,
} from '../../services/shuttleAlerts';
import ShuttleListItem from '../../components/ShuttleListItem';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';
import CreateNewAnnouncement from '../../components/CreateNewAnnouncement';

export default function ShuttleReportsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { shuttleName } = route.params as { shuttleName: string };
  const announcementModalRef = useRef<Modalize>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      if (shuttleName === 'all') {
        // Fetch all reports from all shuttles
        const allReports = await getAllReports();
        setReports(allReports);
      } else {
        // Fetch reports for specific shuttle
        const r = await getShuttleReportsAdmin(shuttleName);
        // Sort by newest first
        r.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        setReports(r);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setReports([]);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchReports();
      setLoading(false);
    })();
  }, [shuttleName]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const displayName =
    shuttleName === 'all'
      ? 'All Shuttle Reports'
      : shuttleName.replace('Tesla HQ ', '');

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'< '}Shuttle Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{displayName}</Text>

        {/* Announcement Dropdown */}
        <View style={styles.announcementWrapper}>
          <AnnouncementDropDown
            onSelectOption={option => {
              if (option === 'Single Shuttle Route' || option === 'All Shuttle Routes') {
                announcementModalRef.current?.open();
              } else {
                console.log('Selected:', option);
              }
            }}
          />
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>ALL USER REPORTS</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : reports.length === 0 ? (
          <Text style={styles.emptyText}>No reports found.</Text>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item, idx) => item.id ?? String(idx)}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item, index }) => (
              <ShuttleListItem
                title={item.shuttleName}
                subtitle={item.comment}
                statusColor="grey"
                rightText={formatTime(item.createdAt)}
                showSeparator={index < reports.length - 1}
              />
            )}
          />
        )}
      </View>

      {/* Create Announcement Modal */}
      <CreateNewAnnouncement
        ref={announcementModalRef}
        onSuccess={() => {
          // Refresh reports after creating announcement
          fetchReports();
        }}
      />
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
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  announcementWrapper: {
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
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
});