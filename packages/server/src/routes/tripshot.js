import express from 'express';

const router = express.Router();

router.post('/commutePlan', (req, res) => {
  const {
    day,
    time,
    timezone,
    startLat,
    startLng,
    startName,
    endLat,
    endLng,
    endName,
  } = req.query;
  
  //validate required fields
  if (!day || !time || !startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'missing parameters' });
  }

  //some data fields only not all , just for simple mock test purposes
  res.status(200).json({
    startPoint: {
      location: { lg: Number(startLng), lt: Number(startLat) },
      name: startName || 'Start',
      stop: null,
    },
    endPoint: {
      location: { lg: Number(endLng), lt: Number(endLat) },
      name: endName || 'End',
      stop: null,
    },
    options: [
      {
        arrivalStopId: 'mock-arrival-stop-id',
        departureStopId: 'mock-departre-stop-id',
      },
    ],
  });
});

router.post('/liveStatus', (req, res) => {
  const { rideIds } = req.query;

  if (!rideIds) {
    return res.status(400).json({ error: 'need rideIds' });
  }

  //some data fields only not all , just for simple mock test purposes
  res.status(200).json({
    rides: [
      {
        rideId: 'mock-ride-001',
        routeId: 'mock-route-001',
        stopStatus: 'Awaiting',
        lastETAUpdate: new Date().toISOString(),
      },
    ],
  });
});

export default router;
