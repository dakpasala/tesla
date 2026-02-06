import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  getShuttleReportsAdmin,
  ShuttleReport,
} from '../services/shuttleAlerts';
import ShuttleListItem from './ShuttleListItem';

// TODO fetch from API

const ALL_SHUTTLES = [
  'Tesla HQ Deer Creek Shuttle A',
  'Tesla HQ Deer Creek Shuttle B',
  'Tesla HQ Deer Creek Shuttle C',
  'Tesla HQ Deer Creek Shuttle D',
];

interface ShuttleReportsListProps {
  shuttleName?: string; // 'all' or specific name. Defaults to 'all'
}

export default function ShuttleReportsList({
  shuttleName = 'all',
}: ShuttleReportsListProps) {
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

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  if (reports.length === 0) {
    return <Text style={styles.emptyText}>No reports found.</Text>;
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
});
