import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  style?: any;
}

export default function AdminStatsCard({
  title,
  value,
  trend,
  trendValue,
  style,
}: AdminStatsCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {trendValue && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendText,
              trend === 'up' && styles.trendUp,
              trend === 'down' && styles.trendDown,
            ]}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minWidth: 100,
  },
  title: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  trendContainer: {
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  trendUp: {
    color: '#34A853',
  },
  trendDown: {
    color: '#EA4335',
  },
});
