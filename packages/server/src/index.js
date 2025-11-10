import 'dotenv/config';
import express from 'express';
import dummyRoutes from './routes/dummy.js';

const app = express();

app.use(express.json());
app.use('/api/users', dummyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
