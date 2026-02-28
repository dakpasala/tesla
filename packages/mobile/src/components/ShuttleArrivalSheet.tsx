// packages/mobile/src/components/ShuttleArrivalSheet.tsx

// Full-screen bottom sheet showing real-time shuttle arrival info, route progress, and occupancy.
// Supports multiple departure options via tab pills and includes an inline issue reporting flow.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Image,
  ScrollView,
} from 'react-native';
import {
  LiveStatusResponse,
  CommutePlanResponse,
  getOccupancyPercentage,
  hasShuttleOptions,
  formatTime,
  getMinutesUntil,
} from '../services/tripshot';
import { ReportSheet } from './ReportSheet';
import { useTheme } from '../context/ThemeContext';

const newShuttleIcon = require('../assets/icons/new/newShuttle.png');

interface ShuttleArrivalSheetProps {
  onBack: () => void;
  onReportIssue: (issue: string, details: string) => void;
  commutePlan?: CommutePlanResponse | null;
  liveStatus?: LiveStatusResponse | null;
  onRefreshStatus?: () => void;
  loading?: boolean;
}

type SheetPage = 'arrival' | 'report' | 'confirmation';

const HORIZONTAL_START_RIGHT = -20;
const HORIZONTAL_LENGTH = 85;
const VERTICAL_START_TOP = 22;
const VERTICAL_LENGTH = 80;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

// ── Route Progress Mini-Map ───────────────────────────────────────────────────

function RouteProgressMap({
  stopStatus,
  nextStops,
  c,
}: {
  stopStatus: any[];
  nextStops: string[];
  c: any;
}) {
  const LINE = '#D1D1D6';
  const BLUE = '#007AFF';

  const getStopState = (stop: any) => {
    if ('Awaiting' in stop) return 'Awaiting';
    if ('Arrived' in stop) return 'Arrived';
    if ('Departed' in stop) return 'Departed';
    if ('Skipped' in stop) return 'Skipped';
    return 'Unknown';
  };

  const reachedStops = stopStatus.map(stop => {
    const state = getStopState(stop);
    return state === 'Arrived' || state === 'Departed' || state === 'Skipped';
  });

  const isUiStopReached = (uiIndex: number) => {
    if (uiIndex === 0) return true;
    return reachedStops[uiIndex] ?? false;
  };

  const totalSegments = Math.max(stopStatus.length - 1, 1);
  const currentStopIndex = stopStatus.findIndex(
    s => getStopState(s) === 'Awaiting'
  );
  const previousIndex = currentStopIndex > 0 ? currentStopIndex - 1 : 0;

  let SEGMENT_PROGRESS = 0;
  if (
    currentStopIndex >= 0 &&
    stopStatus[currentStopIndex] &&
    'Awaiting' in stopStatus[currentStopIndex]
  ) {
    const awaiting = stopStatus[currentStopIndex].Awaiting;
    const now = Date.now();
    const departure = new Date(awaiting.scheduledDepartureTime).getTime();
    const arrival = new Date(awaiting.expectedArrivalTime).getTime();
    if (arrival > departure) {
      SEGMENT_PROGRESS = clamp01((now - departure) / (arrival - departure));
    }
  }

  const ROUTE_PROGRESS = (previousIndex + SEGMENT_PROGRESS) / totalSegments;
  const APPROACH_RATIO = 0.2;

  const horizontalProgress = ROUTE_PROGRESS < APPROACH_RATIO
    ? clamp01(ROUTE_PROGRESS / APPROACH_RATIO) : 1;
  const verticalProgress = ROUTE_PROGRESS > APPROACH_RATIO
    ? clamp01((ROUTE_PROGRESS - APPROACH_RATIO) / (1 - APPROACH_RATIO)) : 0;
  const reachedCorner = ROUTE_PROGRESS >= APPROACH_RATIO;

  const carRight = HORIZONTAL_START_RIGHT + HORIZONTAL_LENGTH * horizontalProgress;
  const carTop = VERTICAL_START_TOP - 22 + VERTICAL_LENGTH * verticalProgress;

  return (
    <View style={styles.right}>
      <View style={styles.routeCol}>
        <View style={[styles.horizontalLine, { backgroundColor: LINE }]} />
        <View style={[styles.curve, { borderColor: LINE }]} />
        <View style={[styles.verticalLine, { backgroundColor: LINE }]} />

        <View style={[styles.progressHorizontal, { width: HORIZONTAL_LENGTH * horizontalProgress, backgroundColor: BLUE }]} />
        <View style={[styles.progressVertical, { height: VERTICAL_LENGTH * verticalProgress, backgroundColor: BLUE }]} />
        {reachedCorner && <View style={[styles.progressCurve, { borderColor: BLUE }]} />}

        <View
          style={[
            styles.car,
            { backgroundColor: c.card, right: carRight, top: carTop },
          ]}
        >
          <Image
            source={newShuttleIcon}
            style={[styles.carImage, { tintColor: c.text.primary }]}
            resizeMode="contain"
          />
        </View>

        {([styles.dotTop, styles.dotMiddle, styles.dotBottom] as const).map((dotStyle, i) => (
          <View
            key={i}
            style={[styles.dot, dotStyle, { backgroundColor: isUiStopReached(i) ? BLUE : LINE }]}
          />
        ))}
      </View>

      <View style={styles.labelsCol}>
        {[0, 1, 2].map(i => (
          <Text
            key={i}
            style={[
              styles.stopLabel,
              { color: c.text.primary },
              isUiStopReached(i) && styles.stopLabelActive,
            ]}
          >
            {nextStops[i] || ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ShuttleArrivalSheet({
  onBack,
  onReportIssue,
  commutePlan,
  liveStatus,
  onRefreshStatus,
  loading = false,
}: ShuttleArrivalSheetProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [appState, setAppState] = useState(AppState.currentState);
  const [page, setPage] = useState<SheetPage>('arrival');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!onRefreshStatus) return;
    onRefreshStatus();
    const interval = setInterval(onRefreshStatus, 10000);
    return () => clearInterval(interval);
  }, [onRefreshStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        onRefreshStatus?.();
      }
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, [appState, onRefreshStatus]);

  // ── Report page ────────────────────────────────────────────────────────────

  if (page === 'report') {
    return (
      <ReportSheet
        onBack={() => setPage('arrival')}
        onSubmit={(issue, details) => {
          setPage('arrival');
          onReportIssue(issue, details);
        }}
      />
    );
  }

  if (page === 'confirmation') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: c.text.primary }}>
          Thanks for reporting
        </Text>
        <Text
          style={{ fontSize: 13, color: c.text.secondary, marginBottom: 16 }}
        >
          We'll look into it as soon as possible.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
          onPress={() => setPage('arrival')}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backIcon, { color: c.text.primary }]}>‹</Text>
          <Text style={[styles.backText, { color: c.text.primary }]}>
            All Routes
          </Text>
        </TouchableOpacity>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: c.text.secondary, fontSize: 14 }}>
            Loading shuttle info...
          </Text>
        </View>
      </View>
    );
  }

  // ── No shuttles ────────────────────────────────────────────────────────────

  if (!hasShuttleOptions(commutePlan)) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backIcon, { color: c.text.primary }]}>‹</Text>
          <Text style={[styles.backText, { color: c.text.primary }]}>
            All Routes
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, marginBottom: 12 }}>🚌</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text.primary, marginBottom: 6 }}>
            No Shuttles Available
          </Text>
          <Text style={{ fontSize: 13, color: c.text.secondary, textAlign: 'center', paddingHorizontal: 24 }}>
            No shuttle routes from your location right now. Check back later.
          </Text>
        </View>
      </View>
    );
  }

  // ── Build shuttle cards from commutePlan options ───────────────────────────

  const rides = liveStatus?.rides ?? [];
  const options = commutePlan!.options;
  const stops = commutePlan!.stops ?? [];
  const routes = commutePlan!.routes;

  const shuttleCards = options.map((option, idx) => {
    const onRouteStep = option.steps.find(s => 'OnRouteScheduledStep' in s);
    const rideId =
      onRouteStep && 'OnRouteScheduledStep' in onRouteStep
        ? onRouteStep.OnRouteScheduledStep.rideId
        : null;
    const routeId =
      onRouteStep && 'OnRouteScheduledStep' in onRouteStep
        ? onRouteStep.OnRouteScheduledStep.routeId
        : null;

    const liveRide = rides.find(r => r.rideId === rideId) ?? rides[0] ?? null;
    const route = routes.find(r => r.routeId === routeId) ?? routes[0];

    const etaMinutes = Math.max(0, getMinutesUntil(option.travelStart));
    const etaTime = formatTime(option.travelEnd);
    const lateSec = liveRide?.lateBySec ?? 0;
    const isDelayed = lateSec > 60;
    const statusText = isDelayed
      ? `Late by ${Math.ceil(lateSec / 60)} Min`
      : 'On Time';
    const statusColor = isDelayed ? '#FF3B30' : '#34C759';

    const stopStatus = liveRide?.stopStatus ?? [];

    // Resolve stop names from the stops array
    const nextStopNames = stopStatus.slice(0, 3).map(s => {
      const stopId =
        s.Awaiting?.stopId ??
        s.Arrived?.stopId ??
        s.Departed?.stopId ??
        s.Skipped?.stopId ??
        '';
      return stops.find(st => st.stopId === stopId)?.name ?? '';
    });
    while (nextStopNames.length < 3) nextStopNames.push('');

    return {
      idx,
      routeName: route?.shortName || route?.name || 'Shuttle',
      etaMinutes,
      etaTime,
      statusText,
      statusColor,
      riderCount: liveRide?.riderCount ?? null,
      capacity: liveRide?.vehicleCapacity ?? null,
      stopStatus,
      nextStopNames,
    };
  });

  const selected = shuttleCards[selectedIndex] ?? shuttleCards[0];

  // ── Arrival view ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={[styles.backIcon, { color: c.text.primary }]}>‹</Text>
        <Text style={[styles.backText, { color: c.text.primary }]}>
          All Routes
        </Text>
      </TouchableOpacity>

      {/* Departure time selector tabs — only shown when multiple options */}
      {shuttleCards.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsRow}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          {shuttleCards.map((card, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.tabPill,
                { backgroundColor: c.backgroundAlt, borderColor: c.border },
                selectedIndex === i && styles.tabPillActive,
              ]}
              onPress={() => setSelectedIndex(i)}
            >
              <Text style={[
                styles.tabPillText,
                { color: c.text.secondary },
                selectedIndex === i && styles.tabPillTextActive,
              ]}>
                {card.etaMinutes <= 1 ? 'Now' : `${card.etaMinutes}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Main row */}
      <View style={styles.mainRow}>
        <View style={styles.left}>
          <Text style={[styles.arrivalTitle, { color: c.text.primary }]}>
            {selected.etaMinutes <= 1 ? 'Boarding Now' : `Arriving In ${selected.etaMinutes} Min`}
          </Text>

          <Text style={[styles.subLine, { color: c.text.secondary }]}>
            {selected.etaTime ? `${selected.etaTime} ETA · ` : ''}
            <Text style={{ fontWeight: '600', color: selected.statusColor }}>
              {selected.statusText}
            </Text>
          </Text>

          {selected.riderCount !== null && (
            <View style={styles.occupancyRow}>
              <Text>👥</Text>
              <Text style={[styles.occupancyText, { color: c.text.secondary }]}>
                {selected.riderCount}/{selected.capacity} riders
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.reportContainer}
            onPress={() => setPage('report')}
          >
            <Text style={[styles.reportText, { color: c.text.secondary }]}>
              See something off?{' '}
              <Text style={styles.reportLink}>Report it</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {selected.stopStatus.length > 0 && (
          <RouteProgressMap
            stopStatus={selected.stopStatus}
            nextStops={selected.nextStopNames}
            c={c}
          />
        )}
      </View>
    </View>
  );
}

const BLUE = '#007AFF';

const styles = StyleSheet.create({
  container: {
    height: 244,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backIcon: { fontSize: 18, marginRight: 6 },
  backText: { fontSize: 12 },
  tabsRow: {
    flexGrow: 0,
    marginBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabPillTextActive: {
    color: '#fff',
  },
  mainRow: { flexDirection: 'row' },
  left: { flex: 1, paddingRight: 8 },
  arrivalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  subLine: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  occupancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  occupancyText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  reportText: {
    marginTop: 10,
    fontSize: 13,
    color: '#8E8E93',
  },
  reportLink: {
    color: BLUE,
    fontWeight: '500',
  },
  reportContainer: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  right: {
    flexDirection: 'row',
    width: 150,
    justifyContent: 'flex-end',
  },
  routeCol: {
    width: 36,
    height: 150,
    position: 'relative',
    marginRight: -70,
  },
  horizontalLine: {
    position: 'absolute',
    top: 8,
    right: HORIZONTAL_START_RIGHT,
    width: HORIZONTAL_LENGTH,
    height: 2,
  },
  curve: {
    position: 'absolute',
    top: 8,
    right: 64,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  verticalLine: {
    position: 'absolute',
    top: VERTICAL_START_TOP,
    right: 76,
    width: 2,
    height: VERTICAL_LENGTH,
  },
  progressHorizontal: {
    position: 'absolute',
    top: 8,
    right: HORIZONTAL_START_RIGHT,
    height: 2,
  },
  progressCurve: {
    position: 'absolute',
    top: 8,
    right: 64,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  progressVertical: {
    position: 'absolute',
    top: VERTICAL_START_TOP,
    right: 76,
    width: 2,
  },
  car: {
    position: 'absolute',
    borderRadius: 12,
    padding: 0,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotTop: { top: 12, right: 73 },
  dotMiddle: { top: 52, right: 73 },
  dotBottom: { top: 92, right: 73 },
  labelsCol: { paddingLeft: 12, paddingTop: 20 },
  stopLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 18,
  },
  stopLabelActive: {
    color: BLUE,
    fontWeight: '600',
  },
  carImage: {
    width: 25,
    height: 25,
  },
});
