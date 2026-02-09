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
  formatTripStepWithContext,
  getMinutesUntil,
  isRideDelayed,
  getOccupancyPercentage,
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

  // Simple bike view - just show time
  if (travelMode === 'bike') {
    return (
      <>
        <GHTouchableOpacity
          style={styles.routeCard}
          activeOpacity={0.9}
          onPress={onOpenInGoogleMaps}
        >
          <View style={styles.routeHeader}>
            <View>
              <Text style={styles.routeTitle}>Bike Route</Text>
              <Text style={styles.routeSub}>Fastest option</Text>
            </View>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{modeTimes.bike || '30 min'}</Text>
              <Text style={styles.etaSub}>ETA</Text>
            </View>
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
            <Text style={styles.altText}>Tesla Shuttle</Text>
            <Text style={styles.altTime}>{modeTimes.shuttle || '50 min'}</Text>
          </GHTouchableOpacity>
          <GHTouchableOpacity
            style={styles.altRow}
            onPress={() => onSetTravelMode('transit')}
          >
            <Text style={styles.altText}>Public Transit</Text>
            <Text style={styles.altTime}>{modeTimes.transit || '1h 10m'}</Text>
          </GHTouchableOpacity>
          <GHTouchableOpacity
            style={styles.altRow}
            onPress={() => onSetTravelMode('car')}
          >
            <Text style={styles.altText}>Drive (view parking)</Text>
            <Text style={styles.altTime}>{modeTimes.car || '30m'}</Text>
          </GHTouchableOpacity>
        </View>
      </>
    );
  }

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
                : 'Public Transit'}
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
          <Text style={styles.sectionTitle}>ROUTE DETAILS</Text>

          {/* Render steps from TripShot data */}
          {steps.length > 0 ? (
            steps.map((step, index) => {
              const formatted = formatTripStepWithContext(step, tripshotData || null);
              const isFirst = index === 0;
              const isLast = index === steps.length - 1;
              const isShuttleStep = formatted.type === 'shuttle';
              const isWalkStep = formatted.type === 'walk';

              return (
                <React.Fragment key={index}>
                  {/* Starting location */}
                  {isFirst && (
                    <View style={styles.stepRow}>
                      <View style={styles.stepIcon}>
                        <Svg width={12} height={40}>
                          <Circle cx={6} cy={6} r={4} fill="#007AFF" />
                          <Line x1={6} y1={6} x2={6} y2={40} stroke="#BEDBFF" strokeWidth={2} />
                        </Svg>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepLocation}>{formatted.from}</Text>
                      </View>
                      <Text style={styles.stepTime}>
                        {formatted.departureTime ? formatTime(formatted.departureTime) : ''}
                      </Text>
                    </View>
                  )}

                  {/* Walking step */}
                  {isWalkStep && (
                    <View style={styles.walkSection}>
                      <View style={styles.stepIcon}>
                        <Svg width={12} height={80}>
                          <Line x1={6} y1={0} x2={6} y2={80} stroke="#BEDBFF" strokeWidth={2} />
                        </Svg>
                        <View style={styles.walkIconContainer}>
                          <Text style={styles.walkIcon}>🚶</Text>
                        </View>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.walkDuration}>{formatted.duration} min walk</Text>
                        <Text style={styles.otherOptionsLabel}>Other Options:</Text>
                        <View style={styles.altOptionsRow}>
                          <View style={styles.altOption}>
                            <Text style={styles.altOptionIcon}>🚗</Text>
                            <Text style={styles.altOptionText}>2 min</Text>
                          </View>
                          <View style={styles.altOption}>
                            <Text style={styles.altOptionIcon}>🚴</Text>
                            <Text style={styles.altOptionText}>5 min</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Shuttle boarding stop */}
                  {isShuttleStep && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.shuttleStopRow}>
                        <View style={styles.stepIcon}>
                          <Svg width={12} height={100}>
                            <Line x1={6} y1={0} x2={6} y2={100} stroke="#BEDBFF" strokeWidth={2} />
                          </Svg>
                          <View style={styles.shuttleIconContainer}>
                            <Text style={styles.shuttleIcon}>🚐</Text>
                          </View>
                        </View>
                        <View style={styles.shuttleStopContent}>
                          <Text style={styles.stopName}>{formatted.from}</Text>
                          <Text style={styles.shuttleName}>
                            {routeInfo?.shortName || 'Tesla Shuttle A'}
                          </Text>
                          <View style={styles.shuttleAmenities}>
                            <View style={styles.amenityBadge}>
                              <Text style={styles.amenityIcon}>👥</Text>
                              <Text style={styles.amenityText}>
                                {firstRide ? `${getOccupancyPercentage(firstRide)}% Full` : '65% Full'}
                              </Text>
                            </View>
                            <View style={styles.amenityBadge}>
                              <Text style={styles.amenityIcon}>📶</Text>
                              <Text style={styles.amenityText}>Free Wifi</Text>
                            </View>
                          </View>
                        </View>
                        <Text style={styles.stepTime}>
                          {formatted.departureTime ? formatTime(formatted.departureTime) : ''}
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Shuttle arrival stop (destination) */}
                  {isShuttleStep && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.stepRow}>
                        <View style={styles.stepIcon}>
                          <Svg width={12} height={12}>
                            <Circle cx={6} cy={6} r={4} fill="#007AFF" />
                          </Svg>
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepLocation}>{formatted.to}</Text>
                        </View>
                        <Text style={styles.stepTime}>
                          {formatted.arrivalTime ? formatTime(formatted.arrivalTime) : ''}
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Final destination for walk-only routes */}
                  {isLast && !isShuttleStep && (
                    <View style={styles.stepRow}>
                      <View style={styles.stepIcon}>
                        <Svg width={12} height={12}>
                          <Circle cx={6} cy={6} r={4} fill="#007AFF" />
                        </Svg>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepLocation}>{formatted.to}</Text>
                      </View>
                      <Text style={styles.stepTime}>
                        {formatted.arrivalTime ? formatTime(formatted.arrivalTime) : ''}
                      </Text>
                    </View>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            // Fallback to simple display when no TripShot data
            <>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Svg width={12} height={40}>
                    <Circle cx={6} cy={6} r={4} fill="#007AFF" />
                    <Line x1={6} y1={6} x2={6} y2={40} stroke="#BEDBFF" strokeWidth={2} />
                  </Svg>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepLocation}>Your Location</Text>
                </View>
                <Text style={styles.stepTime}>8:40 AM</Text>
              </View>
              <View style={styles.walkSection}>
                <View style={styles.stepIcon}>
                  <Svg width={12} height={60}>
                    <Line x1={6} y1={0} x2={6} y2={60} stroke="#BEDBFF" strokeWidth={2} />
                  </Svg>
                  <View style={styles.walkIconContainer}>
                    <Text style={styles.walkIcon}>
                      {travelMode === 'shuttle' ? '🚶' : '🚌'}
                    </Text>
                  </View>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.walkDuration}>
                    {travelMode === 'shuttle'
                      ? '10 min walk to shuttle stop'
                      : '15 min bus ride'}
                  </Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Svg width={12} height={12}>
                    <Circle cx={6} cy={6} r={4} fill="#007AFF" />
                  </Svg>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepLocation}>{destinationName}</Text>
                </View>
                <Text style={styles.stepTime}>9:30 AM</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.reportRow}>
          <Text style={styles.reportText}>See something off? </Text>
          <GHTouchableOpacity onPress={onReportIssue}>
            <Text style={styles.reportLink}>Report it</Text>
          </GHTouchableOpacity>
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
        {travelMode === 'shuttle' && (
          <GHTouchableOpacity
            style={styles.altRow}
            onPress={() => {}}
          >
            <Text style={styles.altText}>Tesla Shuttle B</Text>
            <Text style={styles.altTime}>55 min</Text>
          </GHTouchableOpacity>
        )}
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => onSetTravelMode('transit')}
        >
          <Text style={styles.altText}>Public Transit</Text>
          <Text style={styles.altTime}>{modeTimes.transit || '1h 10m'}</Text>
        </GHTouchableOpacity>
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => onSetTravelMode('car')}
        >
          <Text style={styles.altText}>Drive (view parking)</Text>
          <Text style={styles.altTime}>{modeTimes.car || '30m'}</Text>
        </GHTouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    backgroundColor: '#FCFCFC',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    overflow: 'hidden',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  routeTitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#1C1C1C',
    textTransform: 'capitalize',
  },
  routeSub: { 
    fontSize: 12, 
    color: '#1A9C30', 
    marginTop: 6,
  },
  routeSubDelayed: { 
    color: '#FF9500',
  },
  etaBadge: { 
    alignItems: 'flex-end',
  },
  etaText: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#1C1C1C',
    textTransform: 'capitalize',
  },
  etaSub: { 
    fontSize: 12, 
    color: '#1C1C1C', 
    marginTop: 2,
  },
  divider: { 
    height: 1, 
    backgroundColor: '#D9D9D9', 
    marginHorizontal: 20,
  },
  routeDetails: { 
    padding: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6A6A6A',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepIcon: {
    width: 26,
    alignItems: 'center',
    position: 'relative',
  },
  stepContent: { 
    flex: 1, 
    marginLeft: 6,
  },
  stepLocation: {
    fontSize: 12,
    fontWeight: '400',
    color: '#1C1C1C',
  },
  stepTime: { 
    fontSize: 12, 
    color: '#1C1C1C',
    marginLeft: 8,
  },
  walkSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  walkIconContainer: {
    position: 'absolute',
    top: 20,
    left: -7,
    width: 26,
    height: 26,
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkIcon: {
    fontSize: 16,
  },
  walkDuration: {
    fontSize: 12,
    fontWeight: '400',
    color: '#1C1C1C',
    marginBottom: 8,
  },
  otherOptionsLabel: {
    fontSize: 12,
    color: '#1C1C1C',
    marginBottom: 6,
  },
  altOptionsRow: { 
    flexDirection: 'row', 
    gap: 15,
  },
  altOption: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  altOptionIcon: { 
    fontSize: 15,
    marginRight: 8,
  },
  altOptionText: { 
    fontSize: 12, 
    color: '#1C1C1C',
  },
  shuttleStopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  shuttleIconContainer: {
    position: 'absolute',
    top: 40,
    left: -7,
    width: 26,
    height: 26,
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuttleIcon: {
    fontSize: 16,
  },
  shuttleStopContent: {
    flex: 1,
    marginLeft: 6,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1C',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  shuttleName: {
    fontSize: 12,
    color: '#1C1C1C',
    marginBottom: 12,
  },
  shuttleAmenities: {
    flexDirection: 'row',
    gap: 15,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
  },
  amenityIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#1C1C1C',
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  reportText: { 
    fontSize: 12, 
    color: '#1C1C1C',
  },
  reportLink: { 
    fontSize: 12,
    color: '#1C1C1C',
    textDecorationLine: 'underline',
  },
  actionRow: { 
    padding: 20, 
    paddingTop: 0,
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600',
  },
  footerLinks: { 
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6A6A6A',
    marginBottom: 12,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  altText: { 
    fontSize: 12, 
    color: '#1C1C1C',
  },
  altTime: { 
    fontSize: 12, 
    color: '#1C1C1C',
  },
});