// packages/mobile/src/components/RouteDetailView.tsx

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { TouchableOpacity } from 'react-native';
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
  hasShuttleOptions,
} from '../services/tripshot';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToShuttle, unsubscribeFromShuttle } from '../services/users';

interface RouteDetailViewProps {
  travelMode: TravelMode;
  destinationName: string;
  onOpenInGoogleMaps: () => void;
  onSetTravelMode: (mode: TravelMode) => void;
  onBack?: () => void; // called when user leaves shuttle route (unsubscribes)
  modeTimes: ModeTimes;
  onReportIssue: () => void;
  tripshotData?: CommutePlanResponse | null;
  liveStatus?: LiveStatusResponse | null;
  googleMapsRoute?: any; // Google Maps Directions API response for transit mode
}

export function RouteDetailView({
  travelMode,
  destinationName,
  onOpenInGoogleMaps,
  onSetTravelMode,
  onBack,
  modeTimes,
  onReportIssue,
  tripshotData,
  liveStatus,
  googleMapsRoute,
}: RouteDetailViewProps) {
  const { activeTheme } = useTheme();
  const { userId } = useAuth();

  // Extract rideId from first shuttle option for subscription
  const rideId = (() => {
    const step = tripshotData?.options?.[0]?.steps?.find(
      (s: any) => 'OnRouteScheduledStep' in s
    ) as any;
    return step?.OnRouteScheduledStep?.rideId ?? null;
  })();

  const handleStart = async () => {
    if (userId && rideId) {
      try {
        await subscribeToShuttle(userId, rideId);
      } catch (err) {
        console.error('Failed to subscribe to shuttle:', err);
      }
    }
    onOpenInGoogleMaps();
  };

  const handleBack = async () => {
    if (userId && rideId) {
      try {
        await unsubscribeFromShuttle(userId, rideId);
      } catch (err) {
        console.error('Failed to unsubscribe from shuttle:', err);
      }
    }
    onBack?.();
  };
  const c = activeTheme.colors;

  // Parse TripShot data if available (for shuttle)
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
        <View
          style={[styles.routeCard, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={styles.routeHeader}>
            <View>
              <Text style={[styles.routeTitle, { color: c.text.primary }]}>Bike Route</Text>
              <Text style={[styles.routeSub]}>Fastest option</Text>
            </View>
            <View style={styles.etaBadge}>
              <Text style={[styles.etaText, { color: c.text.primary }]}>{modeTimes.bike || '30 min'}</Text>
              <Text style={[styles.etaSub, { color: c.text.secondary }]}>ETA</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={onOpenInGoogleMaps}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <Text style={[styles.footerTitle, { color: c.text.secondary }]}>OTHER OPTIONS</Text>
          <TouchableOpacity
            style={[styles.altRow, { borderBottomColor: c.border }]}
            onPress={() => onSetTravelMode('shuttle')}
          >
            <Text style={[styles.altText, { color: c.text.primary }]}>Tesla Shuttle</Text>
            <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.shuttle || '50 min'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.altRow, { borderBottomColor: c.border }]}
            onPress={() => onSetTravelMode('transit')}
          >
            <Text style={[styles.altText, { color: c.text.primary }]}>Public Transit</Text>
            <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.transit || '1h 10m'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.altRow, { borderBottomColor: c.border }]}
            onPress={() => onSetTravelMode('car')}
          >
            <Text style={[styles.altText, { color: c.text.primary }]}>Drive (view parking)</Text>
            <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.car || '30m'}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // No-shuttles guard — show a placeholder card instead of an empty route breakdown
  if (travelMode === 'shuttle' && !hasShuttleOptions(tripshotData)) {
    return (
      <>
        <View
          style={[styles.routeCard, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={styles.routeHeader}>
            <View>
              <Text style={[styles.routeTitle, { color: c.text.primary }]}>Tesla Shuttle</Text>
              <Text style={[styles.routeSub]}>No shuttles available</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🚌</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text.primary, marginBottom: 6 }}>
              No Shuttles Right Now
            </Text>
            <Text style={{ fontSize: 13, color: c.text.secondary, textAlign: 'center' }}>
              There are no shuttle routes from your location at this time. Check back later or try another option.
            </Text>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <Text style={[styles.footerTitle, { color: c.text.secondary }]}>OTHER OPTIONS</Text>
          <TouchableOpacity
            style={[styles.altRow, { borderBottomColor: c.border }]}
            onPress={() => onSetTravelMode('transit')}
          >
            <Text style={[styles.altText, { color: c.text.primary }]}>Public Transit</Text>
            <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.transit || '1h 10m'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.altRow, { borderBottomColor: c.border }]}
            onPress={() => onSetTravelMode('bike')}
          >
            <Text style={[styles.altText, { color: c.text.primary }]}>Bike</Text>
            <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.bike || '30 min'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.altRow, { borderBottomColor: c.border }]}
            onPress={() => onSetTravelMode('car')}
          >
            <Text style={[styles.altText, { color: c.text.primary }]}>Drive (view parking)</Text>
            <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.car || '30m'}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Render shuttle steps using TripShot data
  const renderShuttleSteps = () => {
    if (steps.length === 0) return null;

    return steps.map((step, index) => {
      const formatted = formatTripStepWithContext(step, tripshotData || null);
      const isFirst = index === 0;
      const isLast = index === steps.length - 1;
      const isShuttleStep = formatted.type === 'shuttle';
      const isWalkStep = formatted.type === 'walk';

      return (
        <React.Fragment key={index}>
          {/* Starting location */}
          {isFirst && (
            <>
              <View style={styles.stepRow}>
                <View style={styles.stepIconColumn}>
                  <Svg width={12} height={20} style={styles.svgLine}>
                    <Circle cx={6} cy={6} r={5} fill="#007AFF" />
                    <Line x1={6} y1={11} x2={6} y2={20} stroke="#BEDBFF" strokeWidth={2} />
                  </Svg>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLocation, { color: c.text.primary }]}>{formatted.from}</Text>
                </View>
                <Text style={[styles.stepTime, { color: c.text.primary }]}>
                  {formatted.departureTime ? formatTime(formatted.departureTime) : ''}
                </Text>
              </View>
            </>
          )}

          {/* Walking step */}
          {isWalkStep && (
            <>
              <View style={styles.stepRow}>
                <View style={styles.stepIconColumn}>
                  <Svg width={12} height={80} style={styles.svgLine}>
                    <Line x1={6} y1={0} x2={6} y2={80} stroke="#BEDBFF" strokeWidth={2} />
                  </Svg>
                  <View style={[styles.iconContainer, { backgroundColor: c.card }]}>
                    <Image 
                      source={require('../assets/icons/new/PersonSimpleWalk.png')} 
                      style={[styles.stepIconImage, { tintColor: c.text.primary }]}
                    />
                  </View>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.walkDuration, { color: c.text.primary }]}>{formatted.duration} min walk</Text>
                  <Text style={[styles.otherOptionsLabel, { color: c.text.primary }]}>Other Options:</Text>
                  <View style={styles.altOptionsRow}>
                    <View style={[styles.altOption, { backgroundColor: c.backgroundAlt, borderColor: c.border }]}>
                      <Image 
                        source={require('../assets/icons/new/newCar.png')} 
                        style={[styles.altOptionIcon, { tintColor: c.text.primary }]}
                      />
                      <Text style={[styles.altOptionText, { color: c.text.primary }]}>2 min</Text>
                    </View>
                    <View style={[styles.altOption, { backgroundColor: c.backgroundAlt, borderColor: c.border }]}>
                      <Image 
                        source={require('../assets/icons/new/newBike.png')} 
                        style={[styles.altOptionIcon, { tintColor: c.text.primary }]}
                      />
                      <Text style={[styles.altOptionText, { color: c.text.primary }]}>5 min</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />
            </>
          )}

          {/* Shuttle boarding stop */}
          {isShuttleStep && (
            <>
              <View style={styles.stepRow}>
                <View style={styles.stepIconColumn}>
                  <Svg width={12} height={140} style={styles.svgLine}>
                    <Line x1={6} y1={0} x2={6} y2={140} stroke="#BEDBFF" strokeWidth={2} />
                  </Svg>
                  <View style={[styles.iconContainer, { backgroundColor: c.card }]}>
                    <Image 
                      source={require('../assets/icons/new/newShuttle.png')} 
                      style={[styles.stepIconImage, { tintColor: c.text.primary }]}
                    />
                  </View>
                </View>
                <View style={styles.shuttleStopContent}>
                  <Text style={[styles.stopName, { color: c.text.primary }]}>{formatted.from}</Text>
                  <Text style={[styles.shuttleName, { color: c.text.secondary }]}>
                    {routeInfo?.shortName || 'Tesla Shuttle A'}
                  </Text>
                  <View style={styles.shuttleAmenities}>
                    <View style={[styles.amenityBadge, { borderColor: c.border, backgroundColor: c.card }]}>
                      <Image 
                        source={require('../assets/icons/new/double.png')} 
                        style={[styles.amenityIconImage, { tintColor: c.text.primary }]}
                      />
                      <Text style={[styles.amenityText, { color: c.text.primary }]}>
                        {firstRide ? `${getOccupancyPercentage(firstRide)}% Full` : '65% Full'}
                      </Text>
                    </View>
                    <View style={[styles.amenityBadge, { borderColor: c.border, backgroundColor: c.card }]}>
                      <Image 
                        source={require('../assets/icons/new/Wifi.png')} 
                        style={[styles.amenityIconImage, { tintColor: c.text.primary }]}
                      />
                      <Text style={[styles.amenityText, { color: c.text.primary }]}>Free Wifi</Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.stepTime, { color: c.text.primary }]}>
                  {formatted.departureTime ? formatTime(formatted.departureTime) : ''}
                </Text>
              </View>
              <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />
            </>
          )}

          {/* Shuttle arrival stop (destination) */}
          {isShuttleStep && (
            <>
              <View style={styles.stepRow}>
                <View style={styles.stepIconColumn}>
                  <Svg width={12} height={20} style={styles.svgLine}>
                    <Line x1={6} y1={0} x2={6} y2={9} stroke="#BEDBFF" strokeWidth={2} />
                    <Circle cx={6} cy={14} r={5} fill="#007AFF" />
                    <Line x1={6} y1={19} x2={6} y2={20} stroke="#BEDBFF" strokeWidth={2} />
                  </Svg>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLocation, { color: c.text.primary }]}>{formatted.to}</Text>
                </View>
                <Text style={[styles.stepTime, { color: c.text.primary }]}>
                  {formatted.arrivalTime ? formatTime(formatted.arrivalTime) : ''}
                </Text>
              </View>
            </>
          )}

          {/* Final destination for walk-only routes */}
          {isLast && !isShuttleStep && (
            <>
              <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />
              <View style={styles.stepRow}>
                <View style={styles.stepIconColumn}>
                  <Svg width={12} height={20} style={styles.svgLine}>
                    <Line x1={6} y1={0} x2={6} y2={9} stroke="#BEDBFF" strokeWidth={2} />
                    <Circle cx={6} cy={14} r={5} fill="#007AFF" />
                  </Svg>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLocation, { color: c.text.primary }]}>{formatted.to}</Text>
                </View>
                <Text style={[styles.stepTime, { color: c.text.primary }]}>
                  {formatted.arrivalTime ? formatTime(formatted.arrivalTime) : ''}
                </Text>
              </View>
            </>
          )}
        </React.Fragment>
      );
    });
  };

  // Render transit steps - parse Google Maps API response
  const renderTransitSteps = () => {
    // Parse Google Maps transit route if available
    if (googleMapsRoute?.steps && googleMapsRoute.steps.length > 0) {
      return googleMapsRoute.steps.map((step: any, index: number) => {
        const isFirst = index === 0;
        const isLast = index === googleMapsRoute.steps.length - 1;
        const isWalkStep = step.travel_mode === 'WALKING';
        const isTransitStep = step.travel_mode === 'TRANSIT';
        
        // TRANSIT steps have departure_time/arrival_time; WALKING steps don't
        // For transit steps, Google puts times inside transit_details
        const departureTime = step.transit_details?.departure_time?.text
          || step.departure_time?.text
          || '';
        const arrivalTime = step.transit_details?.arrival_time?.text
          || step.arrival_time?.text
          || '';
        const duration = Math.round(step.duration?.value / 60) || 0;

        return (
          <React.Fragment key={index}>
            {/* Starting location */}
            {isFirst && (
              <View style={styles.stepRow}>
                <View style={styles.stepIconColumn}>
                  <Svg width={12} height={20} style={styles.svgLine}>
                    <Circle cx={6} cy={6} r={5} fill="#007AFF" />
                    <Line x1={6} y1={11} x2={6} y2={20} stroke="#BEDBFF" strokeWidth={2} />
                  </Svg>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLocation, { color: c.text.primary }]}>Your Location</Text>
                </View>
                <Text style={[styles.stepTime, { color: c.text.primary }]}>
                  {isFirst ? (googleMapsRoute?.departure_time || departureTime) : departureTime}
                </Text>
              </View>
            )}

            {/* Walk step */}
            {isWalkStep && (
              <>
                <View style={styles.stepRow}>
                  <View style={styles.stepIconColumn}>
                    <Svg width={12} height={60} style={styles.svgLine}>
                      <Line x1={6} y1={0} x2={6} y2={60} stroke="#BEDBFF" strokeWidth={2} />
                    </Svg>
                    <View style={[styles.iconContainer, { backgroundColor: c.card }]}>
                      <Image 
                        source={require('../assets/icons/new/PersonSimpleWalk.png')} 
                        style={[styles.stepIconImage, { tintColor: c.text.primary }]}
                      />
                    </View>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.walkDuration, { color: c.text.primary }]}>
                      {duration} min walk{!isLast && ' to station'}
                    </Text>
                  </View>
                </View>
                {!isLast && <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />}
              </>
            )}

            {/* Transit step */}
            {isTransitStep && (
              <>
                <View style={styles.stepRow}>
                  <View style={styles.stepIconColumn}>
                    <Svg width={12} height={140} style={styles.svgLine}>
                      <Line x1={6} y1={0} x2={6} y2={140} stroke="#BEDBFF" strokeWidth={2} />
                    </Svg>
                    <View style={[styles.iconContainer, { backgroundColor: c.card }]}>
                      <Image 
                        source={step.transit_details?.line?.vehicle?.type === 'BUS' 
                          ? require('../assets/icons/new/newBus.png')
                          : require('../assets/icons/new/newShuttle.png')} 
                        style={[styles.stepIconImage, { tintColor: c.text.primary }]}
                      />
                    </View>
                  </View>
                  <View style={styles.shuttleStopContent}>
                    <Text style={[styles.stopName, { color: c.text.primary }]}>
                      {step.transit_details?.departure_stop?.name || 'Transit Stop'}
                    </Text>
                    <Text style={[styles.shuttleName, { color: c.text.secondary }]}>
                      {step.transit_details?.line?.short_name || step.transit_details?.line?.name || 'Transit'}
                      {step.transit_details?.headsign && ` - ${step.transit_details.headsign}`}
                    </Text>
                    <View style={styles.shuttleAmenities}>
                      <View style={[styles.amenityBadge, { borderColor: c.border, backgroundColor: c.card }]}>
                        <Text style={styles.amenityIcon}>🕐</Text>
                        <Text style={[styles.amenityText, { color: c.text.primary }]}>{duration} min ride</Text>
                      </View>
                      {step.transit_details?.num_stops && (
                        <View style={[styles.amenityBadge, { borderColor: c.border, backgroundColor: c.card }]}>
                          <Text style={styles.amenityIcon}>🛑</Text>
                          <Text style={[styles.amenityText, { color: c.text.primary }]}>
                            {step.transit_details.num_stops} stops
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.stepTime, { color: c.text.primary }]}>{departureTime}</Text>
                </View>
                <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />
                <View style={styles.stepRow}>
                  <View style={styles.stepIconColumn}>
                    <Svg width={12} height={20} style={styles.svgLine}>
                      <Line x1={6} y1={0} x2={6} y2={9} stroke="#BEDBFF" strokeWidth={2} />
                      <Circle cx={6} cy={14} r={5} fill="#007AFF" />
                      {!isLast && <Line x1={6} y1={19} x2={6} y2={20} stroke="#BEDBFF" strokeWidth={2} />}
                    </Svg>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLocation, { color: c.text.primary }]}>
                      {step.transit_details?.arrival_stop?.name || 'Arrival Station'}
                    </Text>
                  </View>
                  <Text style={[styles.stepTime, { color: c.text.primary }]}>{arrivalTime}</Text>
                </View>
              </>
            )}

            {/* Final destination */}
            {isLast && isWalkStep && (
              <>
                <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />
                <View style={styles.stepRow}>
                  <View style={styles.stepIconColumn}>
                    <Svg width={12} height={20} style={styles.svgLine}>
                      <Line x1={6} y1={0} x2={6} y2={9} stroke="#BEDBFF" strokeWidth={2} />
                      <Circle cx={6} cy={14} r={5} fill="#007AFF" />
                    </Svg>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLocation, { color: c.text.primary }]}>{destinationName}</Text>
                  </View>
                  <Text style={[styles.stepTime, { color: c.text.primary }]}>{arrivalTime}</Text>
                </View>
              </>
            )}
          </React.Fragment>
        );
      });
    }

    // Fallback to placeholder data if no Google Maps data
    return (
      <>
        <View style={styles.stepRow}>
          <View style={styles.stepIconColumn}>
            <Svg width={12} height={20} style={styles.svgLine}>
              <Circle cx={6} cy={6} r={5} fill="#007AFF" />
              <Line x1={6} y1={11} x2={6} y2={20} stroke="#BEDBFF" strokeWidth={2} />
            </Svg>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepLocation, { color: c.text.primary }]}>Your Location</Text>
          </View>
          <Text style={[styles.stepTime, { color: c.text.primary }]}>8:40 AM</Text>
        </View>

        {/* Walk to station */}
        <View style={styles.stepRow}>
          <View style={styles.stepIconColumn}>
            <Svg width={12} height={60} style={styles.svgLine}>
              <Line x1={6} y1={0} x2={6} y2={60} stroke="#BEDBFF" strokeWidth={2} />
            </Svg>
            <View style={[styles.iconContainer, { backgroundColor: c.card }]}>
              <Image 
                source={require('../assets/icons/new/PersonSimpleWalk.png')} 
                style={[styles.stepIconImage, { tintColor: c.text.primary }]}
              />
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.walkDuration, { color: c.text.primary }]}>5 min walk to station</Text>
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />

        {/* Transit ride */}
        <View style={styles.stepRow}>
          <View style={styles.stepIconColumn}>
            <Svg width={12} height={140} style={styles.svgLine}>
              <Line x1={6} y1={0} x2={6} y2={140} stroke="#BEDBFF" strokeWidth={2} />
            </Svg>
            <View style={[styles.iconContainer, { backgroundColor: c.card }]}>
              <Image 
                source={require('../assets/icons/new/newBus.png')} 
                style={[styles.stepIconImage, { tintColor: c.text.primary }]}
              />
            </View>
          </View>
          <View style={styles.shuttleStopContent}>
            <Text style={[styles.stopName, { color: c.text.primary }]}>Mountain View Station</Text>
            <Text style={[styles.shuttleName, { color: c.text.secondary }]}>Caltrain Northbound</Text>
            <View style={styles.shuttleAmenities}>
              <View style={[styles.amenityBadge, { borderColor: c.border, backgroundColor: c.card }]}>
                <Text style={styles.amenityIcon}>🕐</Text>
                <Text style={[styles.amenityText, { color: c.text.primary }]}>15 min ride</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.stepTime, { color: c.text.primary }]}>8:50 AM</Text>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />

        {/* Arrival */}
        <View style={styles.stepRow}>
          <View style={styles.stepIconColumn}>
            <Svg width={12} height={20} style={styles.svgLine}>
              <Line x1={6} y1={0} x2={6} y2={9} stroke="#BEDBFF" strokeWidth={2} />
              <Circle cx={6} cy={14} r={5} fill="#007AFF" />
              <Line x1={6} y1={19} x2={6} y2={20} stroke="#BEDBFF" strokeWidth={2} />
            </Svg>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepLocation, { color: c.text.primary }]}>Palo Alto Station</Text>
          </View>
          <Text style={[styles.stepTime, { color: c.text.primary }]}>9:05 AM</Text>
        </View>

        {/* Walk to destination */}
        <View style={styles.stepRow}>
          <View style={styles.stepIconColumn}>
            <Svg width={12} height={60} style={styles.svgLine}>
              <Line x1={6} y1={0} x2={6} y2={60} stroke="#BEDBFF" strokeWidth={2} />
            </Svg>
            <View style={[styles.iconContainer, { backgroundColor: c.card }]}>
              <Image 
                source={require('../assets/icons/new/PersonSimpleWalk.png')} 
                style={[styles.stepIconImage, { tintColor: c.text.primary }]}
              />
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.walkDuration, { color: c.text.primary }]}>8 min walk</Text>
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: c.border }]} />

        <View style={styles.stepRow}>
          <View style={styles.stepIconColumn}>
            <Svg width={12} height={20} style={styles.svgLine}>
              <Line x1={6} y1={0} x2={6} y2={9} stroke="#BEDBFF" strokeWidth={2} />
              <Circle cx={6} cy={14} r={5} fill="#007AFF" />
            </Svg>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepLocation, { color: c.text.primary }]}>{destinationName}</Text>
          </View>
          <Text style={[styles.stepTime, { color: c.text.primary }]}>9:15 AM</Text>
        </View>
      </>
    );
  };

  return (
    <>
      <View
        style={[styles.routeCard, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <View style={styles.routeHeader}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={[styles.routeTitle, { color: c.text.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {travelMode === 'shuttle'
                ? routeInfo?.shortName || 'Tesla Shuttle A'
                : 'Public Transit'}
            </Text>
            {travelMode === 'shuttle' && (
              <Text
                style={[
                  styles.routeSub,
                  firstRide && isRideDelayed(firstRide) && styles.routeSubDelayed,
                ]}
              >
                {getStatusText()}
              </Text>
            )}
          </View>
          <View style={styles.etaBadge}>
            <Text style={[styles.etaText, { color: c.text.primary }]}>
              {travelMode === 'shuttle' 
                ? `${totalDuration} Min` 
                : modeTimes.transit || '1h 10m'}
            </Text>
            <Text style={[styles.etaSub, { color: c.text.secondary }]}>
              {travelMode === 'shuttle'
                ? `${etaTime} ETA`
                : googleMapsRoute?.arrival_time
                  ? `${googleMapsRoute.arrival_time} ETA`
                  : 'ETA'}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={styles.routeDetails}>
          <Text style={[styles.sectionTitle, { color: c.text.secondary }]}>ROUTE DETAILS</Text>

          {/* Render appropriate steps based on travel mode */}
          {travelMode === 'shuttle' ? renderShuttleSteps() : renderTransitSteps()}
        </View>

        <View style={styles.reportRow}>
          <Text style={[styles.reportText, { color: c.text.primary }]}>See something off? </Text>
          <TouchableOpacity onPress={onReportIssue}>
            <Text style={[styles.reportLink, { color: c.text.primary }]}>Report it</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={travelMode === 'shuttle' ? handleStart : onOpenInGoogleMaps}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerLinks}>
        <Text style={[styles.footerTitle, { color: c.text.secondary }]}>OTHER OPTIONS</Text>
        {travelMode === 'shuttle' && (
          <TouchableOpacity
            style={[styles.altRow, { borderBottomColor: c.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.altText, { color: c.text.primary }]}>Tesla Shuttle B</Text>
            <Text style={[styles.altTime, { color: c.text.primary }]}>55 min</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.altRow, { borderBottomColor: c.border }]}
          onPress={() => onSetTravelMode('transit')}
        >
          <Text style={[styles.altText, { color: c.text.primary }]}>Public Transit</Text>
          <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.transit || '1h 10m'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.altRow, { borderBottomColor: c.border }]}
          onPress={() => onSetTravelMode('car')}
        >
          <Text style={[styles.altText, { color: c.text.primary }]}>Drive (view parking)</Text>
          <Text style={[styles.altTime, { color: c.text.primary }]}>{modeTimes.car || '30m'}</Text>
        </TouchableOpacity>
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
  sectionDivider: {
    height: 1,
    backgroundColor: '#D9D9D9',
    marginLeft: 46,
    marginRight: 20,
    marginVertical: 12,
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
  },
  stepIconColumn: {
    width: 26,
    alignItems: 'center',
    position: 'relative',
  },
  svgLine: {
    position: 'absolute',
    top: 0,
    left: 7,
  },
  iconContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    width: 26,
    height: 26,
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
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
    width: 16,
    height: 16,
    marginRight: 8,
    resizeMode: 'contain',
  },
  altOptionText: { 
    fontSize: 12, 
    color: '#1C1C1C',
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
  amenityIconImage: {
    width: 16,
    height: 16,
    marginRight: 8,
    resizeMode: 'contain',
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