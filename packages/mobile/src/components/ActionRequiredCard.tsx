// packages/mobile/src/components/ActionRequiredCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Severity = 'high' | 'medium' | 'low';

interface ActionRequiredCardProps {
  shuttleName: string;
  reportCount: number;
  lastReported: string;
  lastType: string;
  severity: Severity;
  onPress?: () => void;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
};

const SEVERITY_BG: Record<Severity, string> = {
  high: '#FFEBEA',
  medium: '#FFF3E0',
  low: '#E8F5E9',
};

const SEVERITY_BG_DARK: Record<Severity, string> = {
  high: '#3A1A1A',
  medium: '#3A2A10',
  low: '#1A3A1A',
};

const SEVERITY_LABEL: Record<Severity, string> = {
  high: 'new',
  medium: 'in progress',
  low: 'low',
};

export default function ActionRequiredCard({
  shuttleName,
  reportCount,
  lastReported,
  lastType,
  severity,
  onPress,
}: ActionRequiredCardProps) {
  const { activeTheme, theme } = useTheme();
  const c = activeTheme.colors;
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <Text style={[styles.shuttleName, { color: c.text.primary }]} numberOfLines={1}>
          {shuttleName}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isDark ? SEVERITY_BG_DARK[severity] : SEVERITY_BG[severity] },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: SEVERITY_COLORS[severity] }]}
          >
            {SEVERITY_LABEL[severity]}
          </Text>
        </View>
      </View>

      {/* 14 medium */}
      <Text style={styles.reportCount}>{reportCount} New Reports</Text>

      {/* 12 regular */}
      <Text style={[styles.lastReported, { color: c.text.secondary }]}>
        Last reported: {lastReported} ({lastType})
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 100,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shuttleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // 14 medium
  reportCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    marginBottom: 2,
  },
  // 12 regular
  lastReported: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
});