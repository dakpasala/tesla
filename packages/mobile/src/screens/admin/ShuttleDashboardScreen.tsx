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
import {
  getCommutePlan,
  getLiveStatus,
  extractRideIds,
  hasShuttleOptions,
  getOccupancyPercentage,
  isRideDelayed,
  getDelayText,
} from '../../services/tripshot';
import ActionRequiredCard from '../../components/ActionRequiredCard';
import ShuttleListItem from '../../components/ShuttleListItem';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';
import LiveAlertCard from '../../components/LiveAlertCard';
import StatBox from '../../components/StatBox';
import CreateNewAnnouncement from '../../components/CreateNewAnnouncement';
import { useTheme } from '../../context/ThemeContext';
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

type ActiveShuttle = {
  id: string;
  name: string;
  route: string;
  color: 'red' | 'blue' | 'green' | 'orange' | 'grey';
  occupancy?: number;
  riderCount?: number;
  capacity?: number;
  delayText?: string;
  isDelayed?: boolean;
  vehicleName?: string;
};

type DashboardTab = 'reports' | 'alerts' | 'active' | null;

// ── Known campus coords to discover active rideIds ───────────────────────────
// Two known route pairs cover all current Tesla shuttle routes
const CAMPUS_QUERIES = [
  {
    startLat: 37.4142218, startLng: -122.1492233,
    endLat: 37.3945701,   endLng: -122.1501086,
    startName: '1501 Page Mill', endName: '3500 Deer Creek',
  },
  {
    startLat: 37.4142218, startLng: -122.1492233,
    endLat: 37.394358,    endLng: -122.076307,
    startName: '1501 Page Mill', endName: 'Mountain View Caltrain',
  },

  // COMMENT THIS IN IF YOU WANT THE SF SHUTTLE TO SHOW FOR TESTING PURPOSES SINCE XCODE LOCATION IS IN SF
  // {
  //   // SF Express route
  //   startLat: 37.776400, startLng: -122.394800,
  //   endLat: 37.3945701,  endLng: -122.1501086,
  //   startName: 'SF Caltrain Station', endName: '3500 Deer Creek',
  // },
];

function colorFromHex(hex: string, fallback: number): ActiveShuttle['color'] {
  const map: Record<string, ActiveShuttle['color']> = {
    '#FF0000': 'red', '#FF3B30': 'red',
    '#0000FF': 'blue', '#007AFF': 'blue', '#0761E0': 'blue',
    '#00FF00': 'green', '#34C759': 'green',
    '#FFA500': 'orange', '#FF9500': 'orange',
    '#BF40BF': 'grey',
  };
  return map[hex] ?? (['red', 'blue', 'green', 'orange'] as const)[fallback % 4];
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function ShuttleDashboardScreen() {
  const navigation = useNavigation();
  const announcementModalRef = useRef<Modalize>(null);
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const [activeShuttles, setActiveShuttles] = useState<ActiveShuttle[]>([]);
  const [shuttlesLoading, setShuttlesLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionRequired, setActionRequired] = useState<ActionRequiredShuttle[]>([]);

  const [selectedTab, setSelectedTab] = useState<DashboardTab>(null);
  const [announcementType, setAnnouncementType] = useState<'single' | 'all'>('single');

  const fetchDashboardData = async () => {
    // ── Alerts ───────────────────────────────────────────────────────────
    try {
      const alertsData = await getAnnouncements();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setAlertsLoading(false);
    }

    // ── Active Shuttles: commutePlan → extract rideIds → liveStatus ──────
    try {
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      // Fan out to all campus queries in parallel, collect unique rideIds
      const allRideIds: string[] = [];
      await Promise.allSettled(
        CAMPUS_QUERIES.map(async (q) => {
          const plan = await getCommutePlan({
            day: today, time,
            startLat: q.startLat, startLng: q.startLng, startName: q.startName,
            endLat: q.endLat,     endLng: q.endLng,     endName: q.endName,
            travelMode: 'Walking',
          });
          if (hasShuttleOptions(plan)) {
            extractRideIds(plan).forEach(id => {
              if (!allRideIds.includes(id)) allRideIds.push(id);
            });
          }
        })
      );

      if (allRideIds.length === 0) {
        setActiveShuttles([]);
        setShuttlesLoading(false);
        return;
      }

      const liveStatus = await getLiveStatus(allRideIds);

      // Dedupe by routeId — 2 departure options per route come back,
      // we only want one card per route in the dashboard
      const seenRouteIds = new Set<string>();
      const shuttlesData: ActiveShuttle[] = [];
      liveStatus.rides.forEach((ride, index) => {
        if (seenRouteIds.has(ride.routeId)) return;
        seenRouteIds.add(ride.routeId);
        shuttlesData.push({
          id: ride.rideId,
          name: ride.shortName || ride.routeName,
          route: ride.routeName,
          color: colorFromHex(ride.color, index),
          occupancy: getOccupancyPercentage(ride),
          riderCount: ride.riderCount,
          capacity: ride.vehicleCapacity,
          delayText: getDelayText(ride),
          isDelayed: isRideDelayed(ride),
          vehicleName: ride.vehicleShortName || ride.vehicleName,
        });
      });

      setActiveShuttles(shuttlesData);
    } catch (err) {
      console.error('Failed to fetch shuttles', err);
      setActiveShuttles([]);
    } finally {
      setShuttlesLoading(false);
    }

    // ── Reports & Action Required ────────────────────────────────────────
    try {
      const allReports = await getAllReports();
      const reportsByShuttle: Record<string, any[]> = {};

      for (const report of allReports) {
        if (!reportsByShuttle[report.shuttleName]) {
          reportsByShuttle[report.shuttleName] = [];
        }
        reportsByShuttle[report.shuttleName].push(report);
      }

      const results: ActionRequiredShuttle[] = [];
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
            ? Math.round((Date.now() - new Date(newest.createdAt).getTime()) / 60000)
            : 0;
          results.push({
            shuttleName,
            reportCount: r.length,
            lastReported: minsAgo < 1 ? 'just now' : `${minsAgo} min ago`,
            lastType: newest?.comment?.split(' ')[0] ?? 'Report',
            severity: r.length >= 5 ? 'high' : r.length >= 2 ? 'medium' : 'low',
          });
        }
      }

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
    return () => { cancelled = true; };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleTabPress = (tab: DashboardTab) => {
    setSelectedTab(prev => (prev === tab ? null : tab));
  };

  const getTitle = () => {
    if (selectedTab === 'reports') return 'All Shuttle Reports';
    if (selectedTab === 'alerts')  return 'All Live Alerts';
    if (selectedTab === 'active')  return 'All Active Shuttles';
    return 'Shuttle Dashboard';
  };

  // ── Shared top controls (title + stats + announcement) ──────────────────
  const renderTopControls = () => (
    <>
      <Text style={[styles.dashTitle, { color: c.text.primary }]}>{getTitle()}</Text>
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
            if (option === 'Single Shuttle Route') {
              setAnnouncementType('single');
              announcementModalRef.current?.open();
            } else if (option === 'All Shuttle Routes') {
              setAnnouncementType('all');
              announcementModalRef.current?.open();
            } else {
              console.log('Selected:', option);
            }
          }}
        />
      </View>
    </>
  );

  // ── Content ──────────────────────────────────────────────────────────────
  const renderContent = () => {
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

    return (
      <View>
        {actionRequired.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionHeader, { color: c.text.primary }]}>Action Required</Text>
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

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionHeader, { color: c.text.primary }]}>Live Alerts</Text>
          <TouchableOpacity onPress={() => setSelectedTab('alerts')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {alerts.slice(0, 3).map(alert => (
          <LiveAlertCard
            key={alert.id}
            shuttleName={alert.shuttleName}
            delayText={`${alert.delayMinutes} MIN DELAY`}
            timeText={`Sent ${new Date(alert.createdAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}`}
          />
        ))}

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionHeader, { color: c.text.primary }]}>Shuttles</Text>
          <TouchableOpacity onPress={() => setSelectedTab('active')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {activeShuttles.slice(0, 3).map((shuttle, idx) => (
          <ShuttleListItem
            key={shuttle.id}
            title={shuttle.name}
            subtitle={
              shuttle.isDelayed
                ? `${shuttle.delayText} · ${shuttle.riderCount}/${shuttle.capacity} riders`
                : `On Time · ${shuttle.riderCount ?? '—'}/${shuttle.capacity ?? '—'} riders`
            }
            statusColor={shuttle.isDelayed ? 'red' : 'green'}
            rightText={shuttle.vehicleName}
            showSeparator={idx < Math.min(activeShuttles.length, 3) - 1}
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
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'< '}Home</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      {selectedTab === null ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {renderTopControls()}
          {renderContent()}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1, paddingBottom: 0 }]}>
          {renderTopControls()}
          <View style={{ flex: 1 }}>{renderContent()}</View>
        </View>
      )}

      <CreateNewAnnouncement
        ref={announcementModalRef}
        announcementType={announcementType}
        onSuccess={() => fetchDashboardData()}
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