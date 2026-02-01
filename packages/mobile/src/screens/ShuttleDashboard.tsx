import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ShuttleDashboard() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shuttle Dashboard</Text>
        <Text style={styles.subtitle}>Overview & Reports</Text>
      </View>

      {/* Stats / Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Shuttles</Text>
          <Text style={styles.statValue}>5</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>New Reports</Text>
          <Text style={styles.statValue}>8</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>

        <View style={styles.listItem}>
          <Text style={styles.listTitle}>Delay on Route A</Text>
          <Text style={styles.listSubtitle}>10 minutes ago</Text>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listTitle}>Maintenance Needed</Text>
          <Text style={styles.listSubtitle}>30 minutes ago</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },

  statCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
  },

  statLabel: {
    fontSize: 12,
    color: '#666',
  },

  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },

  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },

  listTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },

  listSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
