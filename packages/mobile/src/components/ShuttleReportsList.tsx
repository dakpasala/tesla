import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Report } from '../services/shuttleAlerts';
import ShuttleListItem from './ShuttleListItem';

interface ShuttleReportsListProps {
  reports: Report[];
  loading: boolean;
}

export default function ShuttleReportsList({
  reports,
  loading,
}: ShuttleReportsListProps) {
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