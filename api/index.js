// api/index.js  (ESM) — Vercel-ready, handles both ESM and CommonJS routes
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

dotenv.config();
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploads if folder exists
const uploadsPath = path.join(__dirname, '../uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// DB connection caching for serverless
let dbConnected = false;
const connectToDatabase = async () => {
  if (dbConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined');

  // Use a short server selection timeout so function fails fast in logs
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    // other mongoose options if needed
  });
  dbConnected = true;
  console.log('✓ MongoDB connected');
};

// Robust route loader: try ESM import first, fallback to require (CommonJS)
const loadApiRoutes = async () => {
  // prefer ESM file path
  const esmPath = './routes/index.js';
  const cjsPath = './routes/index.cjs'; // if you renamed
  const cjsIndex = './routes/index.js'; // sometimes index.js is CommonJS

  // If there's an ESM module available, prefer it
  try {
    const mod = await import(esmPath);
    console.log('Loaded routes via ESM:', esmPath);
    return mod.default || mod;
  } catch (e1) {
    // fallback: try to require CommonJS
    try {
      const mod = require(cjsPath);
      console.log('Loaded routes via require:', cjsPath);
      return mod.default || mod;
    } catch (e2) {
      try {
        const mod2 = require(cjsIndex);
        console.log('Loaded routes via require (index.js cjs):', cjsIndex);
        return mod2.default || mod2;
      } catch (e3) {
        console.warn('No routes module found or failed to load:', e1.message, e2 && e2.message, e3 && e3.message);
        // return an empty router so server still responds
        return express.Router();
      }
    }
  }
};

// Mount routes asynchronously before handling requests
let routesMounted = false;
const ensureRoutes = async () => {
  if (routesMounted) return;
  const apiRoutes = await loadApiRoutes();
  app.use('/api', apiRoutes);
  routesMounted = true;
};

// Health and helth endpoints (both because you previously used /api/helth)
app.get('/health', async (req, res) => {
  try {
    await connectToDatabase();
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ status: 'healthy', database: dbState, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Health error:', err && (err.stack || err));
    res.status(500).json({ status: 'unhealthy', error: String(err), timestamp: new Date().toISOString() });
  }
});
app.get('/helth', async (req, res) => { // keep old misspelled route
  return app._router.handle(req, res, () => {}); // redirect to express handling (will run health above)
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'My Class Content Browser API', version: '1.0.0', status: 'running' });
});

// start server locally
export const startServer = async () => {
  try {
    await connectToDatabase();
    const PORT = process.env.PORT || 5000;
    // mount routes before starting
    await ensureRoutes();
    app.listen(PORT, () => {
      console.log(`API Server running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err && (err.stack || err));
    process.exit(1);
  }
};

// serverless handler for Vercel
const serverlessHandler = async (req, res) => {
  try {
    await connectToDatabase();
    await ensureRoutes();
    // Delegate to Express
    app(req, res);
  } catch (err) {
    console.error('Serverless handler error:', err && (err.stack || err));
    // Return helpful error so logs show reason
    res.status(500).json({ error: 'Server error', message: String(err) });
  }
};

// If run directly: start local server
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  startServer();
}

// Export default for Vercel
export default serverlessHandler;
export { app, serverlessHandler };
