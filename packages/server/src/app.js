import express from 'express';

import dummyRoutes from './routes/dummy.js';
import mapsRoutes from './routes/maps.js';
import redisRoutes from './routes/redis.js';
import tripshotRoutes from './routes/tripshot.js';
import adminsRoutes from './routes/admins.js';
import usersRoutes from './routes/users.js';
import parkingsRoutes from './routes/parkings.js';
import dbRoutes from './routes/db.js';
import alertsRoutes from './routes/shuttleAlertsRoutes.js';
import alerts from './routes/alerts.js'

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/users', dummyRoutes);
  app.use('/api/maps', mapsRoutes);
  app.use('/api/redis', redisRoutes);
  app.use('/api/tripshot', tripshotRoutes);
  app.use('/api/admins', adminsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/parkings', parkingsRoutes);
  app.use('/api/db', dbRoutes);
  app.use('/api/shuttles', alertsRoutes);
  app.use('/api/alerts', alerts)

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  return app;
}

export default createApp();
