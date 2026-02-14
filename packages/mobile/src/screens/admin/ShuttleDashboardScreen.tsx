// packages/mobile/src/screens/admin/ShuttleDashboardScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
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
import { Modalize } from 'react-native-modalize';
import {
  getAnnouncements,
  getAllReports,
} from '../../services/shuttleAlerts';
import { getLiveStatus } from '../../services/tripshot';
import ActionRequiredCard from '../../components/ActionRequiredCard';
import ShuttleListItem from '../../components/ShuttleListItem';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';
import LiveAlertCard from '../../components/LiveAlertCard';
import StatBox from '../../components/StatBox';
import CreateNewAnnouncement from '../../components/CreateNewAnnouncement';

// Extracted Lists
import ShuttleReportsList from '../../components/ShuttleReportsList';
import LiveAlertsList from '../../components/LiveAlertsList';
import ActiveShuttlesList from '../../components/ActiveShuttlesList';

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
  const announcementModalRef = useRef<Modalize>(null);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Active Shuttles State
  const [activeShuttles, setActiveShuttles] = useState<any[]>([]);
  const [shuttlesLoading, setShuttlesLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionRequired, setActionRequired] = useState<ActionRequiredShuttle[]>(
    []
  );

  // Filter State
  const [selectedTab, setSelectedTab] = useState<DashboardTab>(null);

  const fetchDashboardData = async () => {
    try {
      // Fetch live alerts (announcements)
      const alertsData = await getAnnouncements();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setAlertsLoading(false);
    }

    try {
      // Fetch active shuttles from Tripshot API
      // TODO: In production, you would get actual ride IDs from another endpoint
      // For now, using mock ride IDs to fetch shuttle data
      const mockRideIds = [
        '1ca7a65e-88f0-4505-a28e-fe7130c341a9:2026-02-08',
        '2db8b76f-99g1-5616-b39f-gf8241d452b0:2026-02-08',
        '3ec9c87g-00h2-6727-c40g-hg9352e563c1:2026-02-08',
        '4fd0d98h-11i3-7838-d51h-ih0463f674d2:2026-02-08',
      ];
      
      const liveStatus = await getLiveStatus(mockRideIds);
      
      // Transform the rides data into the format expected by the UI
      const shuttlesData = liveStatus.rides.map((ride, index) => {
        // Map color from API to component color options
        const getColorName = (hexColor: string): 'red' | 'blue' | 'green' | 'orange' => {
          // You can enhance this mapping based on your actual color codes
          const colorMap: Record<string, 'red' | 'blue' | 'green' | 'orange'> = {
            '#FF0000': 'red',
            '#0000FF': 'blue',
            '#00FF00': 'green',
            '#FFA500': 'orange',
            '#BF40BF': 'orange', // Purple maps to orange for now
          };
          return colorMap[hexColor] || (['red', 'blue', 'green', 'orange'] as const)[index % 4];
        };

        return {
          id: ride.rideId,
          name: ride.shortName || ride.routeName,
          route: ride.routeName,
          color: getColorName(ride.color),
        };
      });

      setActiveShuttles(shuttlesData);
    } catch (err) {
      console.error('Failed to fetch shuttles', err);
      // Optionally: fall back to empty array or show error state
      setActiveShuttles([]);
    } finally {
      setShuttlesLoading(false);
    }

    try {
      // Fetch all reports from the backend
      const allReports = await getAllReports();
      const results: ActionRequiredShuttle[] = [];

      const reportsByShuttle: Record<string, any[]> = {};

      // Group by shuttle
      for (const report of allReports) {
        if (!reportsByShuttle[report.shuttleName]) {
          reportsByShuttle[report.shuttleName] = [];
        }
        reportsByShuttle[report.shuttleName].push(report);
      }

      // Generate Action Required items
      for (const shuttleName in reportsByShuttle) {
        const r = reportsByShuttle[shuttleName];
        if (r.length > 0) {
          const sorted = [...r].sort(
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
            r.length >= 5 ? 'high' : r.length >= 2 ? 'medium' : 'low';

          results.push({
            shuttleName: shuttleName,
            reportCount: r.length,
            lastReported,
            lastType: newest?.comment?.split(' ')[0] ?? 'Report',
            severity,
          });
        }
      }

      // Update states
      setReports(allReports);
      setActionRequired(results);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setReportsLoading(false);
    }
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

        {alerts.slice(0, 3).map(alert => (
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

      {selectedTab === null ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.dashTitle}>{getTitle()}</Text>

          {/* Filter Buttons */}
          <View style={styles.statsRow}>
            <StatBox
              value={loading ? '...' : reports.length}
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
              value={shuttlesLoading ? '...' : activeShuttles.length}
              label="Shuttles Active"
              active={selectedTab === 'active'}
              onPress={() => handleTabPress('active')}
            />
          </View>

          <View style={styles.announcementWrapper}>
            <AnnouncementDropDown
              onSelectOption={option => {
                if (option === 'Single Shuttle Route' || option === 'All Shuttle Routes') {
                  announcementModalRef.current?.open();
                } else {
                  console.log('Selected:', option);
                }
              }}
            />
          </View>

          {renderContent()}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1, paddingBottom: 0 }]}>
          <Text style={styles.dashTitle}>{getTitle()}</Text>

          {/* Filter Buttons */}
          <View style={styles.statsRow}>
            <StatBox
              value={loading ? '...' : reports.length}
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
              value={shuttlesLoading ? '...' : activeShuttles.length}
              label="Shuttles Active"
              active={selectedTab === 'active'}
              onPress={() => handleTabPress('active')}
            />
          </View>

          <View style={styles.announcementWrapper}>
            <AnnouncementDropDown
              onSelectOption={option => {
                if (option === 'Single Shuttle Route' || option === 'All Shuttle Routes') {
                  announcementModalRef.current?.open();
                } else {
                  console.log('Selected:', option);
                }
              }}
            />
          </View>

          {/* The Detailed content (List) will fill the remaining space */}
          <View style={{ flex: 1 }}>{renderContent()}</View>
        </View>
      )}

      {/* Create Announcement Modal */}
      <CreateNewAnnouncement
        ref={announcementModalRef}
        onSuccess={() => {
          // Refresh dashboard data after creating announcement
          fetchDashboardData();
        }}
      />
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
    flex: 1,
  },
});