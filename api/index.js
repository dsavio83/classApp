const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Import the comprehensive router with all routes
const apiRoutes = require('./routes');

dotenv.config();

const app = express();

// Middleware - comprehensive setup
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection cache
let dbConnected = false;

const connectToDatabase = async () => {
    if (dbConnected) return;
    
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
        dbConnected = true;
        console.log('✓ MongoDB Connected Successfully');
    } catch (error) {
        console.error('✗ MongoDB Connection Error:', error.message);
        throw error;
    }
};

// Use the comprehensive API router
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await connectToDatabase();
        const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        res.json({ 
            status: 'healthy', 
            database: dbState,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'My Class Content Browser API',
        version: '1.0.0',
        status: 'running'
    });
});

// Server startup for direct Node.js execution
const startServer = async () => {
    try {
        await connectToDatabase();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`✓ API Server running on port ${PORT}`);
            console.log(`✓ Health check available at http://localhost:${PORT}/health`);
            console.log(`✓ API endpoints available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

// Main serverless function handler
const serverlessHandler = async (req, res) => {
    try {
        await connectToDatabase();
        app(req, res);
    } catch (error) {
        res.status(500).json({
            error: 'Database connection failed',
            message: error.message
        });
    }
};

// Start server if run directly (not as serverless function)
if (require.main === module) {
    startServer();
}

module.exports = { app, serverlessHandler };
