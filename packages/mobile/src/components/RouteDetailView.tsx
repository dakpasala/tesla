// packages/mobile/src/components/RouteDetailView.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import Svg, { Circle, Line } from 'react-native-svg';
import { TravelMode } from '../context/RideContext';
import { ModeTimes } from './RouteHeader';
import {
  CommutePlanResponse,
  LiveStatusResponse,
  formatTime,
  formatTripStep,
  getMinutesUntil,
  isRideDelayed,
  formatTripStepWithContext
} from '../services/tripshot';

interface RouteDetailViewProps {
  travelMode: TravelMode;
  destinationName: string;
  onOpenInGoogleMaps: () => void;
  onSetTravelMode: (mode: TravelMode) => void;
  modeTimes: ModeTimes;
  onReportIssue: () => void;
  tripshotData?: CommutePlanResponse | null;
  liveStatus?: LiveStatusResponse | null;
}

export function RouteDetailView({
  travelMode,
  destinationName,
  onOpenInGoogleMaps,
  onSetTravelMode,
  modeTimes,
  onReportIssue,
  tripshotData,
  liveStatus,
}: RouteDetailViewProps) {
  // Parse TripShot data if available
  const firstOption = tripshotData?.options?.[0];
  const steps = firstOption?.steps || [];
  const routeInfo = tripshotData?.routes?.[0];

  // Get live status for the first ride
  const firstRide = liveStatus?.rides?.[0];
  const nextStop = firstRide?.stopStatus?.[0];

  // Calculate status text
  const getStatusText = () => {
    if (!firstRide) return 'On Time · 10 min away';

    const delayed = isRideDelayed(firstRide);
    const delayMinutes = Math.round(firstRide.lateBySec / 60);

    let statusText = delayed ? `${delayMinutes} Min Delay` : 'On Time';

    if (nextStop?.Awaiting?.expectedArrivalTime) {
      const minutesAway = getMinutesUntil(
        nextStop.Awaiting.expectedArrivalTime
      );
      statusText += ` · ${minutesAway} min away`;
    }

    return statusText;
  };

  // Calculate total duration
  const totalDuration = firstOption
    ? Math.round(
        (new Date(firstOption.travelEnd).getTime() -
          new Date(firstOption.travelStart).getTime()) /
          60000
      )
    : 50;

  const etaTime = firstOption ? formatTime(firstOption.travelEnd) : '9:30 AM';

  return (
    <>
      <GHTouchableOpacity
        style={styles.routeCard}
        activeOpacity={0.9}
        onPress={onOpenInGoogleMaps}
      >
        <View style={styles.routeHeader}>
          <View>
            <Text style={styles.routeTitle}>
              {travelMode === 'shuttle'
                ? routeInfo?.shortName || 'Tesla Shuttle A'
                : travelMode === 'transit'
                  ? 'Public Transit'
                  : 'Bike Route'}
            </Text>
            <Text
              style={[
                styles.routeSub,
                firstRide && isRideDelayed(firstRide) && styles.routeSubDelayed,
              ]}
            >
              {travelMode === 'shuttle' ? getStatusText() : 'On Time · 10 min away'}
            </Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>{totalDuration} Min</Text>
            <Text style={styles.etaSub}>{etaTime} ETA</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.routeDetails}>
          {/* Render steps from TripShot data */}
          {steps.length > 0 ? (
            steps.map((step, index) => {
              const formatted = formatTripStepWithContext(step, tripshotData || null); 
              const isFirst = index === 0;
              const isLast = index === steps.length - 1;

              return (
                <View key={index} style={styles.stepRow}>
                  <Svg width={12} height={isLast ? 12 : 40}>
                    {isFirst && <Circle cx={6} cy={6} r={3} fill="#007AFF" />}
                    {!isFirst && !isLast && (
                      <>
                        <Line
                          x1={6}
                          y1={0}
                          x2={6}
                          y2={40}
                          stroke="#E5E5E5"
                          strokeWidth={2}
                        />
                        <Circle cx={6} cy={20} r={2} fill="#8E8E93" />
                      </>
                    )}
                    {isLast && <Circle cx={6} cy={6} r={3} fill="#000" />}
                    {!isLast && (
                      <Line
                        x1={6}
                        y1={6}
                        x2={6}
                        y2={40}
                        stroke="#E5E5E5"
                        strokeWidth={2}
                      />
                    )}
                  </Svg>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>
                      {isFirst
                        ? formatted.from
                        : formatted.type === 'walk'
                          ? `${formatted.duration} min walk to ${formatted.to}`
                          : isLast
                            ? formatted.to
                            : `Shuttle to ${formatted.to}`}
                    </Text>
                  </View>
                  <Text style={styles.stepTime}>
                    {formatted.departureTime
                      ? formatTime(formatted.departureTime)
                      : ''}
                  </Text>
                </View>
              );
            })
          ) : (
            // Fallback to hardcoded data when no TripShot data
            <>
              <View style={styles.stepRow}>
                <Svg width={12} height={40}>
                  <Circle cx={6} cy={6} r={3} fill="#007AFF" />
                  <Line
                    x1={6}
                    y1={6}
                    x2={6}
                    y2={40}
                    stroke="#E5E5E5"
                    strokeWidth={2}
                  />
                </Svg>
                <Text style={styles.stepText}>Your Location</Text>
                <Text style={styles.stepTime}>8:40 AM</Text>
              </View>
              <View style={styles.stepRow}>
                <Svg width={12} height={40}>
                  <Line
                    x1={6}
                    y1={0}
                    x2={6}
                    y2={40}
                    stroke="#E5E5E5"
                    strokeWidth={2}
                  />
                  <Circle cx={6} cy={20} r={2} fill="#8E8E93" />
                </Svg>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    {travelMode === 'shuttle'
                      ? '10 min walk to shuttle stop'
                      : travelMode === 'bike'
                        ? '25 min bike ride'
                        : '15 min bus ride'}
                  </Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <Svg width={12} height={12}>
                  <Circle cx={6} cy={6} r={3} fill="#000" />
                </Svg>
                <Text style={styles.stepText}>{destinationName}</Text>
                <Text style={styles.stepTime}>9:30 AM</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.actionRow}>
          <GHTouchableOpacity
            style={styles.startButton}
            onPress={onOpenInGoogleMaps}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </GHTouchableOpacity>
        </View>
      </GHTouchableOpacity>

      <View style={styles.footerLinks}>
        <Text style={styles.footerTitle}>OTHER OPTIONS</Text>
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => onSetTravelMode('shuttle')}
        >
          <Text style={styles.altText}>Tesla Shuttle B</Text>
          <Text style={styles.altTime}>55 min</Text>
        </GHTouchableOpacity>
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => onSetTravelMode('transit')}
        >
          <Text style={styles.altText}>Public Transit</Text>
          <Text style={styles.altTime}>1h 10m</Text>
        </GHTouchableOpacity>
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => onSetTravelMode('car')}
        >
          <Text style={styles.altText}>Drive (view parking)</Text>
          <Text style={styles.altTime}>{modeTimes.car || '30m'}</Text>
        </GHTouchableOpacity>
      </View>

      <GHTouchableOpacity style={styles.reportLink} onPress={onReportIssue}>
        <Text style={styles.reportText}>
          See something off?{' '}
          <Text style={styles.reportLinkText}>Report it</Text>
        </Text>
      </GHTouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  routeTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  routeSub: { fontSize: 13, color: '#34C759', marginTop: 2 },
  routeSubDelayed: { color: '#FF9500' }, // Orange for delays
  etaBadge: { alignItems: 'flex-end' },
  etaText: { fontSize: 20, fontWeight: '700', color: '#000' },
  etaSub: { fontSize: 12, color: '#8E8E93' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 16 },
  routeDetails: { padding: 16, paddingVertical: 12 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  stepContent: { flex: 1, marginLeft: 8, paddingBottom: 4 },
  stepTime: { fontSize: 12, color: '#8E8E93', marginLeft: 8 },
  actionRow: { padding: 16, paddingTop: 0 },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  footerLinks: { marginBottom: 24 },
  footerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  altText: { fontSize: 15, color: '#000' },
  altTime: { fontSize: 15, color: '#8E8E93' },
  reportLink: { alignSelf: 'center', paddingBottom: 20 },
  reportText: { fontSize: 13, color: '#8E8E93' },
  reportLinkText: { color: '#007AFF', fontWeight: '500' },
});