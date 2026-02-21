import express from 'express';

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
    routeId:         '5eebffb5-1000-557f-0f0b-96b22d3f5fd5',
    name:            'Palo Alto - Santa Clara/Sunnyvale/Mountain View',
    shortName:       'Palo Alto - Santa Clara/Sunnyvale/Mountain View',
    color:           '#0761E0',
    boardingStopId:  'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
    alightingStopId: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
    rideIds: [
      '62f21225-34a9-4214-b3ec-7961ec8f3833',
      '73a32336-45b0-5325-c4fd-8072fd9f4944',
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

  return null;
}

/** Convert ms timestamp to TripShot ISO format */
const toIso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, '.000000000000Z');

/**
 * Build 2 shuttle departure options matching real TripShot response shape.
 * Options spaced ~25 min apart, both relative to now.
 */
function buildOptions(routeKey, day, startLat, startLng, startName, endLat, endLng, endName, travelMode) {
  const route = ROUTES[routeKey];
  const now   = Date.now();

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
  const options = buildOptions(routeKey, day, sLat, sLng, sName, eLat, eLng, eName, travelMode);

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

router.post('/liveStatus', (req, res) => {
  let { rideIds } = req.query;

  if (!rideIds) {
    return res.status(400).json({ error: 'rideIds parameter required' });
  }

  if (!Array.isArray(rideIds)) {
    rideIds = [rideIds];
  }

  return res.status(200).json({
    rides: rideIds.map((rideId) => ({
      rideId,
      routeId:          '4ddaeeb4-0fff-446e-9e3a-85a11c2f4ec4',
      routeName:        'Palo Alto - Deer Creek | 3000 Hanover | Page Mill',
      shortName:        'Palo Alto - Deer Creek | 3000 Hanover | Page Mill',
      vehicleName:      '24039 / 8751045',
      vehicleShortName: '24039',
      color:            '#BF40BF',
      state:            { Accepted: [] },
      lateBySec:        0,
      riderCount:       8,
      vehicleCapacity:  24,
      lastEtaUpdate:     new Date().toISOString(),
      lastMonitorUpdate: new Date().toISOString(),
      stopStatus: [
        {
          Awaiting: {
            stopId:                 '7f4580bb-f504-4ef4-80fc-eae036ea82cb',
            expectedArrivalTime:    new Date(Date.now() + 5 * 60000).toISOString(),
            scheduledDepartureTime: new Date(Date.now() + 5 * 60000).toISOString(),
            riderStatus: 'OnTime',
          },
        },
        {
          Awaiting: {
            stopId:                 '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
            expectedArrivalTime:    new Date(Date.now() + 20 * 60000).toISOString(),
            scheduledDepartureTime: new Date(Date.now() + 20 * 60000).toISOString(),
            riderStatus: 'OnTime',
          },
        },
      ],
    })),
    timestamp: new Date().toISOString(),
  });
});

export default router;