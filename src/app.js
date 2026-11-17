import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './docs/swagger.js';
import servicesRoutes from './routes/services.routes.js';
import specialistsRoutes from './routes/specialists.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Request logger for development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Base System Health Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Appointment & Consultation Booking Platform API is active and operational',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      services: '/api/services',
      specialists: '/api/specialists',
      bookings: '/api/bookings'
    }
  });
});

// Mount Domain API Routes
app.use('/api/services', servicesRoutes);
app.use('/api/specialists', specialistsRoutes);
app.use('/api/bookings', bookingsRoutes);

// Catch-All 404
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
