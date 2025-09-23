#!/usr/bin/env node

/**
 * Standalone development server for Fabric workload APIs
 * This server runs alongside Vite and provides the custom API endpoints
 * that were previously handled by Webpack dev server middleware.
 */

const express = require('express');
const cors = require('cors');
const { registerDevServerApis } = require('./devServer');

const app = express();
const port = 60007; // Different port from Vite dev server

// Enable CORS for all routes
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: "*"
}));

// Parse JSON bodies
app.use(express.json());

// Register the manifest API endpoints
registerDevServerApis(app);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Fabric Dev API Server' });
});

app.listen(port, '127.0.0.1', () => {
    console.log('*********************************************************************');
    console.log(`****        Fabric Dev API Server listening on port ${port}        ****`);
    console.log('*********************************************************************');
});