// packages/mobile/src/components/ShuttleArrivalSheet.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Image,
} from 'react-native';
import {
  LiveStatusResponse,
  getOccupancyPercentage,
} from '../services/tripshot';
import { ReportSheet } from './ReportSheet';

const newShuttleIcon = require('../assets/icons/new/newShuttle.png');

interface ShuttleArrivalSheetProps {
  stopName: string;
  etaMinutes: number;
  etaTime?: string;
  status: 'On Time' | 'Delayed';
  occupancy?: number;
  nextStops?: string[];
  onBack: () => void;
  // onReportIssue: () => void;
  onReportIssue: (issue: string, details: string) => void;
  liveStatus?: LiveStatusResponse | null;
  onRefreshStatus?: () => void;
}

type SheetPage = 'arrival' | 'report' | 'confirmation';

// const LINE = '#D1D1D6';
// const BLUE = '#007AFF';

const HORIZONTAL_START_RIGHT = -20;
const HORIZONTAL_LENGTH = 85;
const VERTICAL_START_TOP = 22;
const VERTICAL_LENGTH = 80;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function ShuttleArrivalSheet({
  stopName,
  etaMinutes,
  etaTime,
  occupancy = 75,
  nextStops = ['Stevens Creek', 'Sunnyvale', 'Mountain View'],
  onBack,
  onReportIssue,
  liveStatus,
  onRefreshStatus,
}: ShuttleArrivalSheetProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [page, setPage] = useState<SheetPage>('arrival');

  /**
   * ======================================================
   * MOCK DATA (UNCHANGED)
   * ======================================================
   */

  const MOCK_MODE = true;

  const mockLiveStatus: LiveStatusResponse = {
    rides: [
      {
        rideId: 'mock',
        routeId: 'mock',
        routeName: 'Mock Route',
        shortName: 'Tesla HQ Deer Creek Shuttle A',
        vehicleName: 'Mock Vehicle',
        vehicleShortName: 'M1',
        color: '#BF40BF',
        state: {},
        lateBySec: 200,
        riderCount: 5,
        vehicleCapacity: 20,
        lastEtaUpdate: new Date().toISOString(),
        lastMonitorUpdate: new Date().toISOString(),
        stopStatus: [
          {
            Awaiting: {
              stopId: '1',
              expectedArrivalTime: new Date(
                Date.now() + 2 * 60000
              ).toISOString(),
              scheduledDepartureTime: new Date(
                Date.now() - 2 * 60000
              ).toISOString(),
              riderStatus: 'OnTime',
            },
          },
          {
            Awaiting: {
              stopId: '2',
              expectedArrivalTime: new Date(
                Date.now() + 10 * 60000
              ).toISOString(),
              scheduledDepartureTime: new Date(
                Date.now() + 10 * 60000
              ).toISOString(),
              riderStatus: 'OnTime',
            },
          },
        ],
      },
    ],
    timestamp: new Date().toISOString(),
  };

  const effectiveLiveStatus = MOCK_MODE ? mockLiveStatus : liveStatus;

  const firstRide = effectiveLiveStatus?.rides?.[0];

  const lateSec = firstRide?.lateBySec ?? 0;
  let statusText = 'On Time';
  let statusColor = '#34C759';

  if (lateSec > 0) {
    const lateMin = Math.ceil(lateSec / 60);
    statusText = `Late by ${lateMin} Min`;
    statusColor = '#FF3B30';
  }

  const actualOccupancy = firstRide
    ? getOccupancyPercentage(firstRide)
    : occupancy;

  /**
   * ================================
   * ROUTE PROGRESS (UNCHANGED)
   * ================================
   */

  const stopStatus = firstRide?.stopStatus ?? [];

  const getStopState = (stop: any) => {
    if ('Awaiting' in stop) return 'Awaiting';
    if ('Arrived' in stop) return 'Arrived';
    if ('Departed' in stop) return 'Departed';
    if ('Skipped' in stop) return 'Skipped';
    return 'Unknown';
  };

  const reachedStops = stopStatus.map((stop, index) => {
    const state = getStopState(stop);
    return {
      index,
      reached:
        state === 'Arrived' || state === 'Departed' || state === 'Skipped',
    };
  });

  const isUiStopReached = (uiIndex: number) => {
    if (uiIndex === 0) return true;
    return reachedStops[uiIndex]?.reached ?? false;
  };

  const totalStops = stopStatus.length;
  const totalSegments = Math.max(totalStops - 1, 1);

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

  const horizontalProgress =
    ROUTE_PROGRESS < APPROACH_RATIO
      ? clamp01(ROUTE_PROGRESS / APPROACH_RATIO)
      : 1;

  const verticalProgress =
    ROUTE_PROGRESS > APPROACH_RATIO
      ? clamp01((ROUTE_PROGRESS - APPROACH_RATIO) / (1 - APPROACH_RATIO))
      : 0;

  const reachedCorner = ROUTE_PROGRESS >= APPROACH_RATIO;

  const carRight =
    HORIZONTAL_START_RIGHT + HORIZONTAL_LENGTH * horizontalProgress;

  const carTop = VERTICAL_START_TOP - 22 + VERTICAL_LENGTH * verticalProgress;

  const progressHorizontalWidth = HORIZONTAL_LENGTH * horizontalProgress;

  const progressVerticalHeight = VERTICAL_LENGTH * verticalProgress;

  /**
   * ================================
   * EFFECTS
   * ================================
   */

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

  /**
   * ================================
   * PAGE SWITCH
   * ================================
   */

  if (page === 'report') {
    return (
      <ReportSheet
        onBack={() => setPage('arrival')}
        // onSubmit={(issue, details) => {
        //   console.log(issue, details);
        //   onReportIssue();
        //   setPage('arrival');
        // }}
        onSubmit={(issue, details) => {
          setPage('arrival');
          console.log(issue, details);
          onReportIssue(issue, details);
        }}
      />
    );
  }

  if (page === 'confirmation') {
    return (
      <View
        style={{
          backgroundColor: '#FCFCFC',
          padding: 20,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
          Thanks for reporting
        </Text>
        <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 16 }}>
          We’ll look into it as soon as possible.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={() => setPage('arrival')}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * ================================
   * ARRIVAL VIEW (UNCHANGED UI)
   * ================================
   */

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.backText}>All Routes</Text>
      </TouchableOpacity>

      <View style={styles.mainRow}>
        <View style={styles.left}>
          <Text style={styles.arrivalTitle}>Arriving In {etaMinutes} Min</Text>

          <Text style={styles.subLine}>
            {etaTime ? `${etaTime} ETA · ` : ''}
            <Text
              style={{
                fontWeight: '600',
                color: statusColor,
              }}
            >
              {statusText}
            </Text>
          </Text>

          <View style={styles.occupancyRow}>
            <Text>👥</Text>
            <Text style={styles.occupancyText}>{actualOccupancy}% Full</Text>
          </View>

          <TouchableOpacity
            style={styles.reportContainer}
            onPress={() => setPage('report')}
          >
            <Text style={styles.reportText}>
              See something off?{' '}
              <Text style={styles.reportLink}>Report it</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.right}>
          <View style={styles.routeCol}>
            <View style={styles.horizontalLine} />
            <View style={styles.curve} />
            <View style={styles.verticalLine} />

            <View
              style={[
                styles.progressHorizontal,
                {
                  width: progressHorizontalWidth,
                },
              ]}
            />
            <View
              style={[
                styles.progressVertical,
                {
                  height: progressVerticalHeight,
                },
              ]}
            />

            {reachedCorner && <View style={styles.progressCurve} />}

            <View
              style={[
                styles.car,
                {
                  right: carRight,
                  top: carTop,
                },
              ]}
            >
              <Image
                source={newShuttleIcon}
                style={styles.carImage}
                resizeMode="contain"
              />
            </View>

            <View
              style={[
                styles.dot,
                styles.dotTop,
                {
                  backgroundColor: isUiStopReached(0) ? BLUE : LINE,
                },
              ]}
            />
            <View
              style={[
                styles.dot,
                styles.dotMiddle,
                {
                  backgroundColor: isUiStopReached(1) ? BLUE : LINE,
                },
              ]}
            />
            <View
              style={[
                styles.dot,
                styles.dotBottom,
                {
                  backgroundColor: isUiStopReached(2) ? BLUE : LINE,
                },
              ]}
            />
          </View>

          <View style={styles.labelsCol}>
            <Text
              style={[
                styles.stopLabel,
                isUiStopReached(0) && styles.stopLabelActive,
              ]}
            >
              {nextStops[0]}
            </Text>
            <Text
              style={[
                styles.stopLabel,
                isUiStopReached(1) && styles.stopLabelActive,
              ]}
            >
              {nextStops[1]}
            </Text>
            <Text
              style={[
                styles.stopLabel,
                isUiStopReached(2) && styles.stopLabelActive,
              ]}
            >
              {nextStops[2]}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const LINE = '#D1D1D6';
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
    marginBottom: 12,
  },
  backIcon: { fontSize: 18, marginRight: 6 },
  backText: { fontSize: 12 },
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
  statusOnTime: {
    color: '#34C759',
    fontWeight: '600',
  },
  occupancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  occupancyIcon: { marginRight: 6 },
  occupancyText: {
    fontSize: 13,
    color: '#8E8E93',
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
    backgroundColor: LINE,
  },
  curve: {
    position: 'absolute',
    top: 8,
    right: 64,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: LINE,
    borderTopLeftRadius: 8,
  },
  verticalLine: {
    position: 'absolute',
    top: VERTICAL_START_TOP,
    right: 76,
    width: 2,
    height: VERTICAL_LENGTH,
    backgroundColor: LINE,
  },
  progressHorizontal: {
    position: 'absolute',
    top: 8,
    right: HORIZONTAL_START_RIGHT,
    height: 2,
    backgroundColor: BLUE,
  },
  progressCurve: {
    position: 'absolute',
    top: 8,
    right: 64,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: BLUE,
    borderTopLeftRadius: 8,
  },
  progressVertical: {
    position: 'absolute',
    top: VERTICAL_START_TOP,
    right: 76,
    width: 2,
    backgroundColor: BLUE,
  },
  car: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
  },
  carIcon: { fontSize: 14 },
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
  reportContainer: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  carImage: {
    width: 25,
    height: 25,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  reportOptions: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DADADA',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
});
