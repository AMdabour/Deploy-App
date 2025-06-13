import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from 'express-session';
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { connectDB } from "./db";
import router from './routes/index';
import { aiServiceFactory, autoSelectAIProvider } from './services/ai-factory';
import { aiConfig, validateAIConfig } from './config/ai-config';
import cors from 'cors';

const app = express();

// ✅ Enhanced CORS configuration for Replit
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    // Add Replit domains
    if (process.env.REPLIT_DEV_DOMAIN) {
      allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPL_SLUG) {
      allowedOrigins.push(`https://${process.env.REPL_SLUG}.replit.dev`);
      allowedOrigins.push(`https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`);
    }

    // Allow any replit.dev or repl.co domain
    if (origin.includes('.replit.dev') || origin.includes('.repl.co')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// ✅ Enhanced session configuration for Replit
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: false,
  },
  proxy: true, // Trust proxy headers in Replit
}));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ✅ Health check endpoint for Replit
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    replit: {
      domain: process.env.REPLIT_DEV_DOMAIN,
      slug: process.env.REPL_SLUG,
      owner: process.env.REPL_OWNER
    }
  });
});

// API routes
app.use('/api', router);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ 
    success: false,
    error: message 
  });
});

// Initialize AI services
async function initializeAI() {
  console.log('🤖 Initializing AI services...');

  try {
    const configValidation = validateAIConfig();
    if (!configValidation.valid) {
      console.error('❌ AI Configuration validation failed:');
      configValidation.errors.forEach(error => console.error(`  - ${error}`));
      // Don't exit in Replit, just continue with limited functionality
      return;
    }

    if (aiConfig.features.autoSwitch) {
      console.log('🤖 Auto-selecting optimal AI provider...');
      const selectedProvider = await autoSelectAIProvider();
      console.log(`✅ Selected AI provider: ${selectedProvider}`);
    } else {
      console.log(`🤖 Using configured AI provider: ${aiConfig.provider}`);
    }

    const testResults = await aiServiceFactory.testProviders();
    console.log('📊 AI Provider Test Results:', testResults);

  } catch (error) {
    console.error('❌ Failed to initialize AI services:', error);
    // Continue without AI features in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️ Continuing without AI features...');
    }
  }
}

// ✅ Single server startup for Replit
async function start() {
  try {
    console.log('🚀 Starting Scheduling App...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Replit Domain: ${process.env.REPLIT_DEV_DOMAIN || 'localhost'}`);

    // Initialize database
    console.log('🔄 Connecting to database...');
    const dbConnected = await connectDB();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    console.log('✅ Database connected');

    // Initialize storage layer
    console.log('🔄 Initializing storage layer...');
    const storageInitialized = await storage.initialize();
    if (!storageInitialized) {
      console.error('❌ Failed to initialize storage layer');
      process.exit(1);
    }
    console.log('✅ Storage layer initialized');

    // Initialize AI services
    await initializeAI();

    const server = createServer(app);

    // ✅ Serve frontend based on environment
    if (process.env.NODE_ENV === "production") {
      console.log('📦 Serving static files...');
      serveStatic(app);
    } else {
      console.log('🔄 Setting up Vite development server...');
      await setupVite(app, server);
    }

    // ✅ Replit-friendly port configuration
    const port = process.env.PORT || 3000;

    server.listen(Number(port), '0.0.0.0', () => {
      console.log('🎉 Server started successfully!');
      console.log(`🚀 Server running on 0.0.0.0:${port}`);
      console.log(`📊 Database connected and synchronized`);
      console.log(`🔗 API endpoints available at http://0.0.0.0:${port}/api`);
      console.log(`🌐 Frontend available at http://0.0.0.0:${port}`);

      if (process.env.REPLIT_DEV_DOMAIN) {
        console.log(`🌍 Public URL: https://${process.env.REPLIT_DEV_DOMAIN}`);
      }

      if (process.env.REPL_SLUG) {
        console.log(`🌍 Replit URL: https://${process.env.REPL_SLUG}.replit.dev`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
start();

export default app;