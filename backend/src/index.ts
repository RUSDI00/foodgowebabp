import app from './app';
import { config } from './config';
import { seedDatabase } from './db/seed';

const startServer = async () => {
  try {
    // Seed database with initial data
    await seedDatabase();

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📝 API documentation: http://localhost:${config.port}/api/health`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 