import express from 'express';

const router = express.Router();

router.post('/commutePlan', (req, res) => {
  const {
    day,
    time,
    timezone = 'Pacific',
    startLat,
    startLng,
    startName,
    endLat,
    endLng,
    endName,
    travelMode = 'Walking',
  } = req.query;
  
  // Validate required fields
  if (!day || !time || !startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Mock data fields - simplified for testing
  res.status(200).json({
    startPoint: {
      location: { lg: Number(startLng), lt: Number(startLat) },
      name: startName || 'Start Location',
      stop: null,
    },
    endPoint: {
      location: { lg: Number(endLng), lt: Number(endLat) },
      name: endName || 'End Location',
      stop: null,
    },
    options: [
      {
        arrivalStopId: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
        departureStopId: 'b4a1ee48-d3b1-4e37-b7ce-1f39ffe10a0b',
        travelStart: `${day}T17:59:06.000Z`,
        travelEnd: `${day}T18:21:12.000Z`,
        steps: [
          {
            OffRouteStep: {
              travelMode,
              departureTime: `${day}T17:59:06.000Z`,
              arrivalTime: `${day}T18:00:00.000Z`,
              departFrom: {
                location: { lg: Number(startLng), lt: Number(startLat) },
                name: startName || 'Start Location',
              },
              arriveAt: {
                location: { lg: -122.146866, lt: 37.411152 },
                name: 'Page Mill Building 5U',
                stop: 'b4a1ee48-d3b1-4e37-b7ce-1f39ffe10a0b',
              },
            },
          },
          {
            OnRouteScheduledStep: {
              departureStopId: 'b4a1ee48-d3b1-4e37-b7ce-1f39ffe10a0b',
              arrivalStopId: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
              departureTime: `${day}T18:00:00.000Z`,
              arrivalTime: `${day}T18:15:00.000Z`,
              rideId: `1ca7a65e-88f0-4505-a28e-fe7130c341a9:${day}`,
              routeId: '4ddaeeb4-0fff-446e-9e3a-85a11c2f4ec4',
            },
          },
          {
            OffRouteStep: {
              travelMode,
              departureTime: `${day}T18:15:00.000Z`,
              arrivalTime: `${day}T18:21:12.000Z`,
              departFrom: {
                location: { lg: -122.150075, lt: 37.395498 },
                name: 'Deer Creek',
                stop: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
              },
              arriveAt: {
                location: { lg: Number(endLng), lt: Number(endLat) },
                name: endName || 'End Location',
              },
            },
          },
        ],
      },
    ],
    routes: [
      {
        routeId: '4ddaeeb4-0fff-446e-9e3a-85a11c2f4ec4',
        name: 'Palo Alto - Deer Creek | 3000 Hanover | Page Mill',
        shortName: 'Tesla HQ Deer Creek Shuttle A',
        color: '#BF40BF',
      },
    ],
  });
});

router.post('/liveStatus', (req, res) => {
  let { rideIds } = req.query;

  if (!rideIds) {
    return res.status(400).json({ error: 'rideIds parameter required' });
  }

  // Handle both single and multiple rideIds
  if (!Array.isArray(rideIds)) {
    rideIds = [rideIds];
  }

  // Mock data fields - simplified for testing
  res.status(200).json({
    rides: rideIds.map((rideId) => ({
      rideId,
      routeId: '4ddaeeb4-0fff-446e-9e3a-85a11c2f4ec4',
      routeName: 'Palo Alto - Deer Creek | 3000 Hanover | Page Mill',
      shortName: 'Tesla HQ Deer Creek Shuttle A',  
      vehicleName: '24039 / 8751045',
      vehicleShortName: '24039',
      color: '#BF40BF',
      state: { Accepted: [] },
      lateBySec: 0,
      riderCount: 8,
      vehicleCapacity: 24,
      lastEtaUpdate: new Date().toISOString(),
      lastMonitorUpdate: new Date().toISOString(),
      stopStatus: [
        {
          Awaiting: {
            stopId: 'b4a1ee48-d3b1-4e37-b7ce-1f39ffe10a0b',
            expectedArrivalTime: new Date(Date.now() + 5 * 60000).toISOString(), // 5 mins from now
            scheduledDepartureTime: new Date(Date.now() + 5 * 60000).toISOString(),
            riderStatus: 'OnTime',
          },
        },
        {
          Awaiting: {
            stopId: '647f900f-9e4b-4d46-96c5-77bd4ddb6c5f',
            expectedArrivalTime: new Date(Date.now() + 20 * 60000).toISOString(), // 20 mins from now
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