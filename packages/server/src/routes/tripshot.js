import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ─── STOP REGISTRY ───────────────────────────────────────────────────────────
const STOPS = {
  '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f': {
    name: 'Deer Creek',
    location: { lt: 37.3954979967232, lg: -122.150074914944 },
  },
  '7f4580bb-f504-4ef4-80fc-eae036ea82cb': {
    name: 'Page Mill Building 2',
    location: { lt: 37.413075, lg: -122.149138 },
  },
  'b4a1ee48-d3b1-4e37-b7ce-1f39ffe10a0b': {
    name: 'Page Mill Building 5U',
    location: { lt: 37.411152, lg: -122.146866 },
  },
  '966fa040-b651-461e-9a74-0867142c1938': {
    name: '3000 Hanover',
    location: { lt: 37.4158642, lg: -122.1457757 },
  },
  '792624a3-6a80-4dc1-ae9b-8101acf4d3e0': {
    name: 'Page Mill Building 1',
    location: { lt: 37.4160600, lg: -122.1454541 },
  },
  'f1a2b3c4-d5e6-7890-abcd-ef1234567890': {
    name: 'Mountain View Caltrain',
    location: { lt: 37.394358, lg: -122.076307 },
  },

  // COMMENT THIS IN IF YOU WANT THE SF SHUTTLE TO SHOW FOR TESTING PURPOSES SINCE XCODE LOCATION IS IN SF
  
  // SF shuttle stops
  'sf001-4abc-1234-abcd-sf0000000001': {
    name: 'SF Caltrain Station',
    location: { lt: 37.776400, lg: -122.394800 },
  },
  'sf002-4abc-1234-abcd-sf0000000002': {
    name: 'Union Square / Powell St',
    location: { lt: 37.787990, lg: -122.407437 },
  },
};

// ─── ROUTE REGISTRY ──────────────────────────────────────────────────────────
const ROUTES = {
  'deer-creek-page-mill': {
    routeId:         '4ddaeeb4-0fff-446e-9e3a-85a11c2f4ec4',
    name:            'Palo Alto - Deer Creek | 3000 Hanover | Page Mill',
    shortName:       'Palo Alto - Deer Creek | 3000 Hanover | Page Mill',
    color:           '#BF40BF',
    boardingStopId:  '7f4580bb-f504-4ef4-80fc-eae036ea82cb',
    alightingStopId: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
    rideIds: [
      '9fbfcff7-0ac0-4739-baac-5ef191e6094e',
      '1c4e4fb8-8f79-438e-bcd4-06197533ba17',
    ],
  },
  'mountain-view': {
    routeId:         '6163d847-fb80-442f-a0e1-551dcf8f3001',
    name:            'Palo Alto - Santa Clara/Sunnyvale/Mountain View',
    shortName:       'Palo Alto - Santa Clara/Sunnyvale/Mountain View',
    color:           '#0000FF',
    boardingStopId:  'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
    alightingStopId: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
    rideIds: [
      '62f21225-34a9-4214-b3ec-7961ec8f3833',
      'a8d4e991-12c3-4f56-b789-0e1234567890',
    ],
  },
  'sf-palo-alto': {
    routeId:         'a1b2c3d4-e5f6-7890-abcd-sf1234567890',
    name:            'San Francisco - Palo Alto Express',
    shortName:       'SF - Palo Alto Express',
    color:           '#FF9500',
    boardingStopId:  'sf001-4abc-1234-abcd-sf0000000001',
    alightingStopId: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
    rideIds: [
      'b1c2d3e4-f5a6-7890-bcde-sf2345678901',
      'c2d3e4f5-a6b7-8901-cdef-sf3456789012',
    ],
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Determine which shuttle route services the given origin/destination pair.
 * Returns null if no route exists (triggers no-route response).
 */
function resolveRoute(startLat, startLng, endLat, endLng) {
  const isPageMill  = (lat, lng) => lat > 37.41 && lat < 37.42 && lng > -122.16 && lng < -122.14;
  const isDeerCreek = (lat, lng) => lat > 37.39 && lat < 37.40 && lng > -122.16 && lng < -122.14;
  const isMtnView   = (lat, lng) => lat > 37.38 && lat < 37.41 && lng > -122.09 && lng < -122.06;

  if (
    (isPageMill(startLat, startLng) && isDeerCreek(endLat, endLng)) ||
    (isDeerCreek(startLat, startLng) && isPageMill(endLat, endLng))
  ) {
    return 'deer-creek-page-mill';
  }

  if (
    (isPageMill(startLat, startLng) && isMtnView(endLat, endLng)) ||
    (isMtnView(startLat, startLng) && isDeerCreek(endLat, endLng))
  ) {
    return 'mountain-view';
  }

  // COMMENT THIS IN IF YOU WANT THE SF SHUTTLE TO SHOW FOR TESTING PURPOSES SINCE XCODE LOCATION IS IN SF

  // SF area (covers Union Square, SoMa, Mission, Caltrain station)
  const isSF = (lat, lng) => lat > 37.75 && lat < 37.81 && lng > -122.43 && lng < -122.38;

  if (
    (isSF(startLat, startLng) && isDeerCreek(endLat, endLng)) ||
    (isDeerCreek(startLat, startLng) && isSF(endLat, endLng)) ||
    (isSF(startLat, startLng) && isPageMill(endLat, endLng)) ||
    (isPageMill(startLat, startLng) && isSF(endLat, endLng))
  ) {
    return 'sf-palo-alto';
  }

  return null;
}

/** Convert ms timestamp to TripShot ISO format */
const toIso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, '.000000000000Z');

/**
 * Build 2 shuttle departure options matching real TripShot response shape.
 * Options spaced ~25 min apart, both relative to now.
 */
function parseTimeToMs(timeStr) {
  // Parse "10:30 AM" or "9:45 PM" into a ms timestamp for today
  if (!timeStr) return Date.now();
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Date.now();
  let hour = parseInt(match[1]);
  const min = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  // If parsed time is in the past, it means they want today at that time
  return d.getTime();
}

function buildOptions(routeKey, day, startLat, startLng, startName, endLat, endLng, endName, travelMode, requestedTime) {
  const route = ROUTES[routeKey];
  // Use requested departure time as base, or now if not provided / in the past
  const parsedMs = parseTimeToMs(requestedTime);
  const now = parsedMs > Date.now() ? parsedMs : Date.now();

  const boardingStop  = STOPS[route.boardingStopId];
  const alightingStop = STOPS[route.alightingStopId];

  const walkToStopMs   = 8 * 60 * 1000;  // 8 min walk/drive to boarding stop
  const rideMs         = 10 * 60 * 1000; // 10 min shuttle ride
  const walkFromStopMs = 6 * 60 * 1000;  // 6 min walk to final destination

  return [0, 25].map((offsetMin, i) => {
    const travelStartMs   = now + offsetMin * 60 * 1000;
    const shuttleDepartMs = travelStartMs + walkToStopMs;
    const shuttleArriveMs = shuttleDepartMs + rideMs;
    const finalArriveMs   = shuttleArriveMs + walkFromStopMs;

    const rideId = `${route.rideIds[i]}:${day}`;

    return {
      arrivalStopId:    route.alightingStopId,
      departureStopId:  route.boardingStopId,
      earliestToArrive: toIso(finalArriveMs),
      latestToDepart:   toIso(travelStartMs),
      optionKey:        i,
      travelStart:      toIso(travelStartMs),
      travelEnd:        toIso(finalArriveMs),
      toArrivalTimeSec:   Math.round(walkFromStopMs / 1000),
      toDepartureTimeSec: Math.round(walkToStopMs / 1000),
      steps: [
        {
          OffRouteStep: {
            travelMode,
            departureTime: toIso(travelStartMs),
            arrivalTime:   toIso(shuttleDepartMs),
            legRef:        `D:${route.boardingStopId}`,
            departFrom: {
              location: { lt: startLat, lg: startLng },
              name: startName,
              stop: null,
            },
            arriveAt: {
              location: boardingStop.location,
              name:     boardingStop.name,
              stop:     route.boardingStopId,
            },
          },
        },
        {
          OnRouteScheduledStep: {
            departureStopId: route.boardingStopId,
            arrivalStopId:   route.alightingStopId,
            departureTime:   toIso(shuttleDepartMs),
            arrivalTime:     toIso(shuttleArriveMs),
            rideId,
            routeId: route.routeId,
          },
        },
        {
          OffRouteStep: {
            travelMode:    'Walking',
            departureTime: toIso(shuttleArriveMs),
            arrivalTime:   toIso(finalArriveMs),
            legRef:        `D:${route.alightingStopId}`,
            departFrom: {
              location: alightingStop.location,
              name:     alightingStop.name,
              stop:     route.alightingStopId,
            },
            arriveAt: {
              location: { lt: endLat, lg: endLng },
              name: endName,
              stop: null,
            },
          },
        },
      ],
    };
  });
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

router.post('/commutePlan', (req, res) => {
  const {
    day,
    time,
    startLat,
    startLng,
    startName,
    endLat,
    endLng,
    endName,
    travelMode = 'Walking',
  } = req.query;

  if (!day || !time || !startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const sLat  = Number(startLat);
  const sLng  = Number(startLng);
  const eLat  = Number(endLat);
  const eLng  = Number(endLng);
  const sName = startName || 'Start Location';
  const eName = endName   || 'End Location';

  const routeKey = resolveRoute(sLat, sLng, eLat, eLng);

  // No shuttle services this pair — return no-route shape (matches no-route.json)
  if (!routeKey) {
    return res.status(200).json({
      directOnly:  false,
      startPoint:  { location: { lt: sLat, lg: sLng }, name: sName, stop: null },
      endPoint:    { location: { lt: eLat, lg: eLng }, name: eName, stop: null },
      options:     [],
      routes:      [],
      stops:       [],
      legMap:      {},
      parkingReservations: [],
      reservationStatuses: [],
      reservations:        [],
      retrieved_at: new Date().toISOString(),
    });
  }

  const route   = ROUTES[routeKey];
  const options = buildOptions(routeKey, day, sLat, sLng, sName, eLat, eLng, eName, travelMode, time);

  const stops = [route.boardingStopId, route.alightingStopId].map((stopId) => {
    const stop = STOPS[stopId];
    return {
      stopId,
      name:        stop.name,
      location:    stop.location,
      address:     { address: `${stop.location.lt}, ${stop.location.lg}`, tags: [] },
      description: '',
      geofence:    { Circle: 20 },
      hasParking:  false,
      onDemand:    false,
      terminal:    false,
      yard:        false,
      tags:        [],
      deleted:     null,
      groupParent: null,
      gtfsId:      null,
      parentId:    null,
      photoIds:    [],
      regionId:    'ca558ddc-d7f2-4b48-9cac-deea1134f820',
      ttsStopName: null,
    };
  });

  return res.status(200).json({
    directOnly:  false,
    startPoint:  { location: { lt: sLat, lg: sLng }, name: sName, stop: null },
    endPoint:    { location: { lt: eLat, lg: eLng }, name: eName, stop: null },
    options,
    routes: [{
      routeId:     route.routeId,
      name:        route.name,
      shortName:   route.shortName,
      color:       route.color,
      announcedAs: route.name,
      description: '',
      headsign:    route.name,
      publicName:  `🚐${route.name}`,
      routeType:   'Bus',
      tags:        ['Circulator'],
      groupId:     '8f283b9e-8bfd-4532-8230-0459ced57ea7',
      regionId:    'ca558ddc-d7f2-4b48-9cac-deea1134f820',
      enableReservationsPrepurchasePasses: false,
      lateNoticeWarnTimeSec: 1200,
      nominalHeadwayTime: null,
      gtfsId:      null,
      routeUrl:    null,
      fareClassId: null,
    }],
    stops,
    legMap:      {},
    parkingReservations: [],
    reservationStatuses: [],
    reservations:        [],
    retrieved_at: new Date().toISOString(),
  });
});

router.get('/liveStatus', (req, res) => {
  // Serves static mock data from get-live-status.json in the same directory.
  // In production, replace this with a proxy to TripShot's region-wide liveStatus endpoint:
  // GET /api/tripshot/liveStatus with Authorization: Bearer <token>
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'get-live-status.json'), 'utf8')
    );
    return res.status(200).json(data);
  } catch (err) {
    console.error('Failed to read get-live-status.json:', err);
    return res.status(500).json({ error: 'Failed to load live status data' });
  }
});

router.post('/liveStatus', (req, res) => {
  let { rideIds } = req.query;

  if (!rideIds) {
    return res.status(400).json({ error: 'rideIds parameter required' });
  }

  if (!Array.isArray(rideIds)) {
    rideIds = [rideIds];
  }

  // Look up which route each rideId belongs to
  const rideIdToRoute = {};
  for (const [routeKey, route] of Object.entries(ROUTES)) {
    for (const rideId of route.rideIds) {
      rideIdToRoute[rideId] = routeKey;
    }
  }

  return res.status(200).json({
    rides: rideIds.map((rideId) => {
      // Match by UUID prefix (strip the :date suffix)
      const uuidPrefix = rideId.split(':')[0];
      const routeKey = rideIdToRoute[uuidPrefix] || 'deer-creek-page-mill';
      const route = ROUTES[routeKey];

      const isMtnView = routeKey === 'mountain-view';

      return {
        rideId,
        routeId:          route.routeId,
        routeName:        route.name,
        shortName:        route.shortName,
        vehicleName:      isMtnView ? '24041 / 8751047' : '24039 / 8751045',
        vehicleShortName: isMtnView ? '24041' : '24039',
        color:            route.color,
        state:            { Accepted: [] },
        lateBySec:        0,
        riderCount:       isMtnView ? 12 : 8,
        vehicleCapacity:  24,
        lastEtaUpdate:     new Date().toISOString(),
        lastMonitorUpdate: new Date().toISOString(),
        stopStatus: [
          {
            Awaiting: {
              stopId:                 route.boardingStopId,
              expectedArrivalTime:    new Date(Date.now() + 5 * 60000).toISOString(),
              scheduledDepartureTime: new Date(Date.now() + 5 * 60000).toISOString(),
              riderStatus: 'OnTime',
            },
          },
          {
            Awaiting: {
              stopId:                 route.alightingStopId,
              expectedArrivalTime:    new Date(Date.now() + 20 * 60000).toISOString(),
              scheduledDepartureTime: new Date(Date.now() + 20 * 60000).toISOString(),
              riderStatus: 'OnTime',
            },
          },
        ],
      };
    }),
    timestamp: new Date().toISOString(),
  });
});

// Express routes for the TripShot shuttle planning API.
// POST /commutePlan returns shuttle trip options based on origin/destination coordinates.
// GET and POST /liveStatus return real-time ride data for active shuttles.

export default router;