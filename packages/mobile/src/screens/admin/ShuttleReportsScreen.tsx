// packages/mobile/src/screens/admin/ShuttleReportsScreen.tsx

import React, { useEffect, useState } from 'react';
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
import {
  getShuttleReportsAdmin,
  ShuttleReport,
} from '../../services/shuttleAlerts';
import ShuttleListItem from '../../components/ShuttleListItem';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';

const ALL_SHUTTLES = [
  'Tesla HQ Deer Creek Shuttle A',
  'Tesla HQ Deer Creek Shuttle B',
  'Tesla HQ Deer Creek Shuttle C',
  'Tesla HQ Deer Creek Shuttle D',
];

export default function ShuttleReportsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { shuttleName } = route.params as { shuttleName: string };

  const [reports, setReports] = useState<ShuttleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      if (shuttleName === 'all') {
        const allReports: ShuttleReport[] = [];
        for (const name of ALL_SHUTTLES) {
          try {
            const r = await getShuttleReportsAdmin(name);
            allReports.push(...r);
          } catch (_e) {}
        }
        allReports.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        setReports(allReports);
      } else {
        const r = await getShuttleReportsAdmin(shuttleName);
        r.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        setReports(r);
      }
    } catch (_e) {
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

  // 20 semi-bold title
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'< '}Shuttle Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 20 semi-bold */}
        <Text style={styles.title}>{displayName}</Text>

        {/* Announcement Dropdown */}
        <View style={styles.announcementWrapper}>
          <AnnouncementDropDown
            onSelectOption={(option) => {
              // TODO: handle announcement option
              console.log('Selected:', option);
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
                title="Shuttle Delay"
                subtitle={item.comment}
                statusColor="grey"
                rightText={formatTime(item.createdAt)}
                showSeparator={index < reports.length - 1}
              />
            )}
          />
        )}
      </View>
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
    flex: 1,
    paddingHorizontal: 20,
  },
  // 20 semi-bold
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
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
});