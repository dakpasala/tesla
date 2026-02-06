// packages/mobile/src/screens/admin/ShuttleDashboardScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getShuttleReportsCount,
  getShuttleReportsAdmin,
  getAnnouncements,
} from '../../services/shuttleAlerts';
import ActionRequiredCard from '../../components/ActionRequiredCard';
import ShuttleListItem from '../../components/ShuttleListItem';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';
import LiveAlertCard from '../../components/LiveAlertCard';
import StatBox from '../../components/StatBox';

// Extracted Lists
import ShuttleReportsList from '../../components/ShuttleReportsList';
import LiveAlertsList from '../../components/LiveAlertsList';
import ActiveShuttlesList from '../../components/ActiveShuttlesList';

// ── Hardcoded data for summary view ─────────────────────────────────────────

// TODO fetch from backend

const HARDCODED_ALERTS_SUMMARY = [
  {
    id: '1',
    shuttleName: 'Tesla HQ Deer Creek Shuttle A',
    delayMinutes: 5,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
];

const HARDCODED_SHUTTLES_SUMMARY = [
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
];

// ── Types ───────────────────────────────────────────────────────────────────

type ActionRequiredShuttle = {
  shuttleName: string;
  reportCount: number;
  lastReported: string;
  lastType: string;
  severity: 'high' | 'medium' | 'low';
};

type DashboardTab = 'reports' | 'alerts' | 'active' | null;

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function ShuttleDashboardScreen() {
  const navigation = useNavigation();

  const [reportsCount, setReportsCount] = useState<number>(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Active Shuttles State (Mock for now)
  const [activeShuttles, setActiveShuttles] = useState([
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
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionRequired, setActionRequired] = useState<ActionRequiredShuttle[]>(
    []
  );

  // Filter State
  const [selectedTab, setSelectedTab] = useState<DashboardTab>(null);

  const fetchDashboardData = async () => {
    try {
      const count = await getShuttleReportsCount();
      setReportsCount(count);
    } catch (_e) {
      // keep existing
    }

    try {
      // Fetch live alerts
      const alertsData = await getAnnouncements();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setAlertsLoading(false);
    }

    try {
      // Fetch ALL reports for the list view
      // In a real app, maybe we just fetch specific ones or paginate
      // For now, loop through our known shuttles like the old list did
      const ALL_SHUTTLES_NAMES = [
        'Tesla HQ Deer Creek Shuttle A',
        'Tesla HQ Deer Creek Shuttle B',
        'Tesla HQ Deer Creek Shuttle C',
        'Tesla HQ Deer Creek Shuttle D',
      ];

      const allReports = [];
      for (const name of ALL_SHUTTLES_NAMES) {
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
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setReportsLoading(false);
    }

    // Mock logic for "Action Required" section in summary
    // TODO fetch from API
    const results: ActionRequiredShuttle[] = [];
    // Using internal hardcoded list just for summary logic demo
    const MOCK_NAMES = [
      'Tesla HQ Deer Creek Shuttle A',
      'Tesla HQ Deer Creek Shuttle B',
    ];

    for (const name of MOCK_NAMES) {
      try {
        const reports = await getShuttleReportsAdmin(name);
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
            reports.length >= 5
              ? 'high'
              : reports.length >= 2
                ? 'medium'
                : 'low';

          results.push({
            shuttleName: name,
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
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleTabPress = (tab: DashboardTab) => {
    if (selectedTab === tab) {
      setSelectedTab(null); // toggle off
    } else {
      setSelectedTab(tab);
    }
  };

  const getTitle = () => {
    if (selectedTab === 'reports') return 'All Shuttle Reports';
    if (selectedTab === 'alerts') return 'All Live Alerts';
    if (selectedTab === 'active') return 'All Active Shuttles';
    return 'Shuttle Dashboard';
  };

  // Render Content

  const renderContent = () => {
    // 1. Detailed Views
    if (selectedTab === 'reports') {
      return (
        <View style={styles.detailedContainer}>
          <ShuttleReportsList reports={reports} loading={reportsLoading} />
        </View>
      );
    }
    if (selectedTab === 'alerts') {
      return (
        <View style={styles.detailedContainer}>
          <LiveAlertsList alerts={alerts} loading={alertsLoading} />
        </View>
      );
    }
    if (selectedTab === 'active') {
      return (
        <View style={styles.detailedContainer}>
          <ActiveShuttlesList shuttles={activeShuttles} />
        </View>
      );
    }

    // 2. Summary View (Default)
    return (
      <View>
        {/* Action Required */}
        {actionRequired.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHeader}>Action Required</Text>
              <TouchableOpacity onPress={() => setSelectedTab('reports')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {actionRequired.map(shuttle => (
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

        {/* Live Alerts Summary */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeader}>Live Alerts</Text>
          <TouchableOpacity onPress={() => setSelectedTab('alerts')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {HARDCODED_ALERTS_SUMMARY.map(alert => (
          <LiveAlertCard
            key={alert.id}
            shuttleName={alert.shuttleName}
            delayText={`${alert.delayMinutes} MIN DELAY`}
            timeText={`Sent ${new Date(alert.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
          />
        ))}

        {/* Shuttles Summary */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeader}>Shuttles</Text>
          <TouchableOpacity onPress={() => setSelectedTab('active')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {activeShuttles.slice(0, 3).map((shuttle, idx) => (
          <ShuttleListItem
            key={shuttle.id}
            title={shuttle.name}
            subtitle={shuttle.route}
            statusColor={shuttle.color}
            showSeparator={idx < 2}
            onPress={() =>
              (navigation as any).navigate('ShuttleReports', {
                shuttleName: shuttle.name,
              })
            }
          />
        ))}

        <View style={{ height: 40 }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'< '}Home</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Title changes based on view */}
        <Text style={styles.dashTitle}>{getTitle()}</Text>

        {/* Filter Buttons (Key Metrics) */}
        <View style={styles.statsRow}>
          <StatBox
            value={loading ? '...' : reportsCount}
            label="New Reports"
            active={selectedTab === 'reports'}
            onPress={() => handleTabPress('reports')}
          />
          <StatBox
            value={alertsLoading ? '...' : alerts.length}
            label="Live Alerts"
            active={selectedTab === 'alerts'}
            onPress={() => handleTabPress('alerts')}
          />
          <StatBox
            value={activeShuttles.length}
            label="Shuttles Active"
            active={selectedTab === 'active'}
            onPress={() => handleTabPress('active')}
          />
        </View>

        {/* Announcement Dropdown - Always visible */}
        <View style={styles.announcementWrapper}>
          <AnnouncementDropDown
            onSelectOption={option => {
              console.log('Selected:', option);
            }}
          />
        </View>

        {/* Dynamic Content */}
        {renderContent()}
      </ScrollView>
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
  dashTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  announcementWrapper: {
    marginBottom: 24,
    zIndex: 100,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
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
  detailedContainer: {
    minHeight: 200,
  },
});
