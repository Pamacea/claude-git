#!/usr/bin/env node

/**
 * Bundle MCP Server - Creates a truly standalone ESM bundle
 * Uses esbuild to bundle everything into a single file
 */

import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  console.log('🔨 Bundling MCP Server (standalone ESM)...');

  // Save original if not exists
  const originalPath = join(__dirname, 'server.original.js');
  if (!existsSync(originalPath)) {
    const currentServer = readFileSync(join(__dirname, 'server.js'), 'utf-8');
    if (!currentServer.includes('Smart Loader')) {
      writeFileSync(originalPath, currentServer);
    } else {
      throw new Error('Cannot find original server source. Restore from git.');
    }
  }

  // Clean previous build
  const distDir = join(__dirname, 'dist');
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
  }
  mkdirSync(distDir, { recursive: true });

  // Bundle with esbuild - use ESM format with platform: neutral
  // Then we can use it as a true ESM module
  await esbuild.build({
    entryPoints: [originalPath],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm', // Use ESM format for proper import.meta support
    outfile: join(distDir, 'server.bundle.mjs'),
    external: [], // Bundle everything
    banner: {
      js: '// Bundled with esbuild - standalone ESM bundle\n',
    },
    minify: false,
    sourcemap: false,
    allowOverwrite: true,
    // Preserve Node built-ins
    mainFields: ['module', 'main'],
    // Inject __dirname and __filename shims for ESM
    inject: [join(__dirname, 'esm-shim.js')],
  });

  // Create a simple loader that imports the bundled ESM
  const esmWrapper = `#!/usr/bin/env node

/**
 * Aureus - MCP Server (Standalone Bundle)
 * This file is self-contained with no external dependencies
 */

import './dist/server.bundle.mjs';
`;

  writeFileSync(join(__dirname, 'server.js'), esmWrapper);

  console.log('✓ MCP Server bundled successfully');
  console.log('  - dist/server.bundle.mjs: Standalone ESM bundle');
  console.log('  - server.js: Simple loader');
  console.log('  - server.original.js: Original source (development)');
}

build().catch(err => {
  console.error('✗ Build failed:', err);
  process.exit(1);
});
