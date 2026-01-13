import 'dotenv/config';
import express from 'express';
import dummyRoutes from './routes/dummy.js';
import mapsRoutes from './routes/maps.js';
import redisRoutes from './routes/redis.js';
import { startParkingMonitor } from './jobs/parkingMonitor.js';
import tripshotRoutes from './routes/tripshot.js';
import adminsRoutes from './routes/admins.js'
import usersRoutes from './routes/users.js'
import parkingsRoutes from './routes/parkings.js'

const app = express();

app.use(express.json());
app.use('/api/users', dummyRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/redis', redisRoutes);
app.use('/tripshot', tripshotRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/parkings', parkingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = 3000;

startParkingMonitor();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
