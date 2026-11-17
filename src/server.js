import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Appointment API running on port ${PORT}`);
  console.log(`📚 Swagger OpenAPI Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
