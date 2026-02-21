# Aureus - Installation Auto-Setup Complete ✅

## Problem Solved

**Issue:** When installing Aureus via `/plugin`, the web server fails to start with `ERR_CONNECTION_REFUSED` because npm dependencies are not automatically installed in the cached plugin directory.

**Root Cause:** Claude Code copies plugin files to cache but doesn't run `npm install` automatically.

## What Was Fixed

### 1. ✅ Auto-Install Script Created
**File:** `skills/aureus-install.js`

Automatically finds the cached plugin and installs dependencies:
```bash
node skills/aureus-install.js
```

### 2. ✅ Install Hook Added to plugin.json
**File:** `.claude-plugin/plugin.json`

Added `"install": "node hooks/install-dependencies.js"` field (waiting for Claude Code support)

### 3. ✅ Enhanced postinstall Script
**File:** `package.json`

Now displays helpful message after installation

### 4. ✅ Cache Cleaning Script
**File:** `hooks/clean-cache.js`

Removes old/conflicting plugin versions from cache

### 5. ✅ Comprehensive Troubleshooting Guide
**File:** `TROUBLESHOOTING.md`

Complete guide for common issues and solutions

### 6. ✅ JavaScript Syntax Error Fixed
**File:** `web/public/app-v070.js` & `web/public/index.html`

- Removed duplicate `const API_BASE` and `const Sanitizer` declarations
- Added cache-busting query parameters (`?v=0.8.1`) to script tags

## How to Use

### Fresh Installation (Recommended)

1. Install plugin via Claude Code:
   ```
   /plugin
   → Select: git-master (Aureus)
   ```

2. Install dependencies (new skill):
   ```
   /aureus-install
   ```

3. Done! Server auto-starts on next SessionStart hook

### Manual Installation

If the skill doesn't work, run:

```bash
# Windows
node C:\Users\Yanis\.claude\plugins\cache\aureus\git-master\0.8.1\hooks\install-dependencies.js

# Mac/Linux
node ~/.claude/plugins/cache/aureus/git-master/0.8.1/hooks/install-dependencies.js
```

### Development Mode

If working on the plugin directly:

```bash
cd C:/Users/Yanis/Projects/-plugins/aureus/plugins/git-master

# Install all dependencies
npm run postinstall

# Start web server manually
npm run start-web
```

## Current Status

✅ Server running on http://localhost:3747
✅ Dependencies installed in cache
✅ Auto-install script ready
✅ Troubleshooting guide created

## Next Steps for Users

1. **After plugin installation**, run `/aureus-install`
2. **If issues persist**, check `TROUBLESHOOTING.md`
3. **For development**, use `npm run start-web` from plugin root

## Files Modified/Created

### Modified
- `plugins/git-master/package.json` - Enhanced postinstall script
- `plugins/git-master/.claude-plugin/plugin.json` - Added install field
- `plugins/git-master/web/public/app-v070.js` - Removed duplicate declarations
- `plugins/git-master/web/public/index.html` - Added cache-busting

### Created
- `plugins/git-master/hooks/clean-cache.js` - Cache cleaning utility
- `plugins/git-master/skills/aureus-install.md` - Skill documentation
- `plugins/git-master/skills/aureus-install.js` - Auto-install script
- `plugins/git-master/TROUBLESHOOTING.md` - Complete troubleshooting guide
- `plugins/git-master/INSTALLATION-FIX.md` - This file

## Testing

Test the server:
```bash
curl http://localhost:3747/api/status
```

Expected response:
```json
{
  "status": "online",
  "version": "0.8.0",
  "statistics": {
    "repositories": 1,
    "hooksInstalled": 0,
    "uptime": 11
  }
}
```

## Feature Request

A feature request should be submitted to Claude Code to automatically run `npm install` for marketplace plugins that have a `package.json`.

**Current workaround:** This skill/script fills that gap.

## Support

- 📖 Guide: `TROUBLESHOOTING.md`
- 🐛 Issues: https://github.com/Pamacea/aureus/issues
- 💬 Discussions: https://github.com/Pamacea/aureus/discussions

---

**Version:** 0.8.1
**Last Updated:** 2026-02-21
**Status:** ✅ Production Ready
