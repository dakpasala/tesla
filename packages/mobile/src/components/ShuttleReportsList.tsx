import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { ShuttleReport } from '../services/shuttleAlerts';
import ShuttleListItem from './ShuttleListItem';

// TODO fetch from API

const ALL_SHUTTLES = [
  'Tesla HQ Deer Creek Shuttle A',
  'Tesla HQ Deer Creek Shuttle B',
  'Tesla HQ Deer Creek Shuttle C',
  'Tesla HQ Deer Creek Shuttle D',
];

interface ShuttleReportsListProps {
  reports: ShuttleReport[];
  loading: boolean;
}

export default function ShuttleReportsList({
  reports,
  loading,
}: ShuttleReportsListProps) {
  // Internal refresh state if we want pull-to-refresh to trigger parent refresh
  // For now simple implementation without internal refresh logic or we could pass onRefresh from parent

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
