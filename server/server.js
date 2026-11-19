import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { resumeInterruptedJobs } from './src/services/scraper.service.js';

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled Rejection caught (process kept alive):', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.warn('Uncaught Exception caught (process kept alive):', err?.message || err);
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Outreach Tracker API server running on port ${PORT}`);
    resumeInterruptedJobs().catch((err) =>
      console.warn('Auto-recovery error:', err.message)
    );
  });
});

