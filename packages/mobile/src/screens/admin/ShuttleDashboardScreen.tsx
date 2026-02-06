// packages/mobile/src/screens/admin/ShuttleDashboardScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getShuttleReportsCount,
  getShuttleReportsAdmin,
} from '../../services/shuttleAlerts';
import ActionRequiredCard from '../../components/ActionRequiredCard';
import ShuttleListItem from '../../components/ShuttleListItem';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';
import LiveAlertCard from '../../components/LiveAlertCard';

// ── Hardcoded data ──────────────────────────────────────────────────────────

const HARDCODED_ALERTS = [
  {
    id: '1',
    shuttleName: 'Tesla HQ Deer Creek Shuttle A',
    type: 'delay',
    reason: 'Shuttle B Delayed By 15 Min',
    delayMinutes: 5,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    label: 'ALERT POSTED 3 MIN AGO',
  },
];

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

// ── Types ───────────────────────────────────────────────────────────────────

type ActionRequiredShuttle = {
  shuttleName: string;
  reportCount: number;
  lastReported: string;
  lastType: string;
  severity: 'high' | 'medium' | 'low';
};

// ── Sub-components ──────────────────────────────────────────────────────────

function StatBox({
  value,
  label,
  onPress,
}: {
  value: string | number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statBox} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Alerts Modal (hardcoded) ────────────────────────────────────────────────

function AlertsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalBack}>{'< '}Shuttle Dashboard</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.modalTitle}>Live Alerts</Text>

        {HARDCODED_ALERTS.map((a) => (
          <LiveAlertCard
            key={a.id}
            shuttleName={a.shuttleName}
            delayText={`${a.delayMinutes} MIN DELAY`}
            timeText={`Sent ${new Date(a.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
          />
        ))}
      </SafeAreaView>
    </Modal>
  );
}

// ── Shuttles Modal (hardcoded) ──────────────────────────────────────────────

function ShuttlesModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalBack}>{'< '}Shuttle Dashboard</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.modalTitle}>Shuttle Status</Text>

        {HARDCODED_SHUTTLES.map((s, idx) => (
          <ShuttleListItem
            key={s.id}
            title={s.name}
            subtitle={s.route}
            statusColor={s.color}
            showSeparator={idx < HARDCODED_SHUTTLES.length - 1}
          />
        ))}
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function ShuttleDashboardScreen() {
  const navigation = useNavigation();

  const [reportsCount, setReportsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionRequired, setActionRequired] = useState<ActionRequiredShuttle[]>([]);

  const [showAlerts, setShowAlerts] = useState(false);
  const [showShuttles, setShowShuttles] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const count = await getShuttleReportsCount();
      setReportsCount(count);
    } catch (_e) {
      // keep existing
    }

    const results: ActionRequiredShuttle[] = [];
    for (const shuttle of HARDCODED_SHUTTLES) {
      try {
        const reports = await getShuttleReportsAdmin(shuttle.name);
        if (reports.length > 0) {
          const sorted = [...reports].sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime()
          );
          const newest = sorted[0];
          const minsAgo = newest?.createdAt
            ? Math.round(
                (Date.now() - new Date(newest.createdAt).getTime()) / 60000
              )
            : 0;
          const lastReported = minsAgo < 1 ? 'just now' : `${minsAgo} min ago`;
          const severity: 'high' | 'medium' | 'low' =
            reports.length >= 5 ? 'high' : reports.length >= 2 ? 'medium' : 'low';

          results.push({
            shuttleName: shuttle.name,
            reportCount: reports.length,
            lastReported,
            lastType: newest?.comment?.split(' ')[0] ?? 'Report',
            severity,
          });
        }
      } catch (_e) {
        // skip
      }
    }
    setActionRequired(results);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchDashboardData();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'< '}Home</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 20 semi-bold */}
        <Text style={styles.dashTitle}>Shuttle Dashboard</Text>

        {/* Stat Boxes */}
        <View style={styles.statsRow}>
          <StatBox
            value={loading ? '...' : reportsCount}
            label="New Reports"
            onPress={() => (navigation as any).navigate('ShuttleReports', { shuttleName: 'all' })}
          />
          <StatBox value={4} label="Live Alerts" onPress={() => setShowAlerts(true)} />
          <StatBox value={9} label="Shuttles Active" onPress={() => setShowShuttles(true)} />
        </View>

        {/* Announcement Dropdown */}
        <View style={styles.announcementWrapper}>
          <AnnouncementDropDown
            onSelectOption={(option) => {
              // TODO: handle announcement option selection
              console.log('Selected:', option);
            }}
          />
        </View>

        {/* Action Required — 16 medium */}
        {actionRequired.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHeader}>Action Required</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {actionRequired.map((shuttle) => (
              <ActionRequiredCard
                key={shuttle.shuttleName}
                shuttleName={shuttle.shuttleName}
                reportCount={shuttle.reportCount}
                lastReported={shuttle.lastReported}
                lastType={shuttle.lastType}
                severity={shuttle.severity}
                onPress={() =>
                  (navigation as any).navigate('ShuttleReports', {
                    shuttleName: shuttle.shuttleName,
                  })
                }
              />
            ))}
          </>
        )}

        {/* Live Alerts — 16 medium */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeader}>Live Alerts</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {HARDCODED_ALERTS.map((alert) => (
          <LiveAlertCard
            key={alert.id}
            shuttleName={alert.shuttleName}
            delayText={`${alert.delayMinutes} MIN DELAY`}
            timeText={`Sent ${new Date(alert.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
          />
        ))}

        {/* Shuttles — 16 medium */}
        <Text style={[styles.sectionHeader, { marginTop: 24, marginBottom: 8 }]}>
          Shuttles
        </Text>

        {HARDCODED_SHUTTLES.map((shuttle, idx) => (
          <ShuttleListItem
            key={shuttle.id}
            title={shuttle.name}
            subtitle={shuttle.route}
            statusColor={shuttle.color}
            showSeparator={idx < HARDCODED_SHUTTLES.length - 1}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <AlertsModal visible={showAlerts} onClose={() => setShowAlerts(false)} />
      <ShuttlesModal visible={showShuttles} onClose={() => setShowShuttles(false)} />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  // 20 semi-bold
  dashTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },

  // Stat Boxes
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#A0A0A5',
    marginTop: 4,
    fontWeight: '500',
  },

  // Announcement
  announcementWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 100,
  },

  // Section headers — 16 medium
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',    paddingHorizontal: 20,
  },
  modalHeader: { paddingVertical: 10 },
  modalBack: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
});