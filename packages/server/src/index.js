import 'dotenv/config';
import express from 'express';
import dummyRoutes from './routes/dummy.js';
import mapsRoutes from './routes/maps.js';
import redisRoutes from './routes/redis.js';
import dbRoutes from './routes/db.js';

const app = express();

app.use(express.json());
app.use('/api/users', dummyRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/redis', redisRoutes);
app.use('/api/db', dbRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
