#!/usr/bin/env node

/**
 * Git Flow Master - Web Interface Server (SECURED)
 * Local HTTP server for managing Git conventions, hooks, and repositories
 *
 * Security Features:
 * - Command injection prevention (spawn instead of execSync)
 * - Path traversal prevention (whitelist + validation)
 * - Rate limiting
 * - Security headers (Helmet)
 * - Input sanitization
 * - Error message sanitization
 */

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const helmet = require('helmet');

const app = express();
const PORT = 3747; // Git Flow

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

// Allowed base paths for repository access (whitelist)
const ALLOWED_BASE_PATHS = [
  os.homedir(),
  '/home',
  '/Users',
  '/workspace',
  '/projects',
  'C:\\Users',
  'D:\\Projects',
  process.cwd()
].filter(Boolean);

// Rate limiting configuration
const RATE_LIMITS = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; //1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// CSRF tokens
const CSRF_TOKENS = new Map();
const CSRF_TOKEN_EXPIRY_MS = 3600000; //1 hour

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Body parser with limits
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb

// Helmet security headers (MUST be before static files)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: false, // localhost doesn't need HSTS
}));

// Static files (AFTER Helmet so CSP headers apply)
app.use(express.static('public'));

// ============================================================================
// DATA DIRECTORY
// ============================================================================

const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
