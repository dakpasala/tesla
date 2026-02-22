// packages/mobile/src/screens/admin/AdminStatsCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  return (
    <View style={[styles.card, { backgroundColor: c.card }, style]}>
      <Text style={[styles.title, { color: c.text.secondary }]}>{title}</Text>
      <Text style={[styles.value, { color: c.text.primary }]}>{value}</Text>
      {trendValue && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendText,
              { color: c.text.secondary },
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