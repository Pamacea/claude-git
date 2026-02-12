#!/usr/bin/env node

/**
 * Git Flow Master - Background Server Starter
 * Starts the web server in the background (for Claude Code integration)
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 3747;
const PID_FILE = path.join(require('os').homedir(), '.git-flow-master', 'server.pid');
const LOG_FILE = path.join(require('os').homedir(), '.git-flow-master', 'server.log');

function getServerDir() {
  return path.join(__dirname, '..', 'web');
}

async function isServerRunning() {
  // First check if PID file exists and process is running
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));

    if (os.platform() === 'win32') {
      // Windows: use tasklist command
      return new Promise((resolve) => {
        exec(`tasklist /FI "PID eq ${pid}" /NH`, (err, stdout) => {
          if (stdout.includes(pid.toString())) {
            resolve(true); // Process is running
          } else {
            fs.unlinkSync(PID_FILE);
            resolve(false); // Process not running
          }
        });
      });
    } else {
      // Unix: use signal 0 to check process
      try {
        process.kill(pid, 0); // 0 = signal check only, doesn't kill
        return true;
      } catch {
        fs.unlinkSync(PID_FILE);
        return false;
      }
    }
  }
  return false;
}

async function startServer() {
  // Check if already running
  if (await isServerRunning()) {
    console.log('✓ Git Flow Master server already running at http://localhost:3747');
    return;
  }

  const serverDir = getServerDir();
  const logDir = path.dirname(LOG_FILE);

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Start server in background
  const logOut = fs.openSync(LOG_FILE, 'a');
  const logErr = fs.openSync(LOG_FILE, 'a');

  const server = spawn('node', ['server.js'], {
    cwd: serverDir,
    detached: true,
    stdio: ['ignore', logOut, logErr],
    windowsHide: true
  });

  server.unref();

  // Save PID
  fs.writeFileSync(PID_FILE, server.pid.toString());

  // Wait for server to start
  let attempts = 0;
  while (attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (await isServerRunning()) {
      console.log('✓ Git Flow Master server started at http://localhost:3747');
      return;
    }
    attempts++;
  }

  console.log('⚠ Server may not have started correctly. Check logs at:', LOG_FILE);
}

async function stopServer() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('No PID file found. Server may not be running.');
    return;
  }

  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));

  try {
    process.kill(pid, 'SIGTERM');
    fs.unlinkSync(PID_FILE);
    console.log('✓ Git Flow Master server stopped');
  } catch (error) {
    console.log('Failed to stop server:', error.message);
  }
}

async function getStatus() {
  const running = await isServerRunning();
  if (running) {
    console.log('✓ Server is running at http://localhost:3747');
  } else {
    console.log('✗ Server is not running');
  }
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'start':
    startServer();
    break;
  case 'stop':
    stopServer();
    break;
  case 'status':
    getStatus();
    break;
  case 'restart':
    stopServer().then(() => setTimeout(startServer, 1000));
    break;
  default:
    startServer();
}
