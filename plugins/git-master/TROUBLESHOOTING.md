# Aureus - Troubleshooting Guide

## Server Not Starting (ERR_CONNECTION_REFUSED)

### Problem
```
http://localhost:3747/ - Ce site est inaccessible
ERR_CONNECTION_REFUSED
```

### Root Cause
When Aureus is installed via `/plugin`, the plugin files are copied to Claude's cache directory but **npm dependencies are NOT automatically installed**.

### Solution 1: Automatic (Recommended)

After installing Aureus via `/plugin`, run this command to install dependencies:

```bash
node ~/.claude/plugins/cache/aureus/git-master/0.8.1/hooks/install-dependencies.js
```

**Or use the skill** (if available):
```
/aureus-install
```

### Solution 2: Manual Installation

1. Find your cached plugin location:
   - Windows: `%USERPROFILE%\.claude\plugins\cache\aureus\git-master\0.8.1`
   - Mac/Linux: `~/.claude/plugins/cache/aureus/git-master/0.8.1`

2. Install dependencies manually:
   ```bash
   cd ~/.claude/plugins/cache/aureus/git-master/0.8.1/web
   npm install

   cd ../mcp
   npm install
   ```

3. Restart Claude Code or trigger SessionStart hook

### Solution 3: Development Mode

If you're working on the plugin directly:

```bash
cd C:/Users/Yanis/Projects/-plugins/aureus/plugins/git-master

# Install all dependencies
npm run postinstall

# Start web server manually
npm run start-web
```

## Verification

Check if server is running:

```bash
# Check if port 3747 is in use
netstat -ano | findstr :3747   # Windows
lsof -i :3747                    # Mac/Linux

# Test API endpoint
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

## Common Issues

### Issue: "Cannot find module 'express'"
**Cause:** Dependencies not installed in cached plugin
**Fix:** Run Solution 1 or Solution 2 above

### Issue: Server starts but web UI shows errors
**Cause:** JavaScript errors in browser (check DevTools console)
**Fix:** Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Old plugin version in cache
**Cause:** Claude didn't clean old versions when updating
**Fix:**
```bash
node C:/Users/Yanis/Projects/-plugins/aureus/plugins/git-master/hooks/clean-cache.js
```

Then reinstall plugin via `/plugin`

## Prevention

To avoid this issue in future installations, the plugin should:

1. ✅ Have `install` field in plugin.json pointing to install script
2. ✅ Include postinstall hook in package.json
3. ⚠️ **WAIT:** Claude Code doesn't automatically run npm install for marketplace plugins

**Current workaround:** Manually run the install script after plugin installation

## Status

- [x] Automatic dependency installation on plugin install - **NOT SUPPORTED by Claude Code yet**
- [x] Manual install script available - **WORKING**
- [x] Troubleshooting guide - **THIS DOCUMENT**
- [ ] Feature request submitted to Claude Code for automatic npm install on marketplace plugins

## Getting Help

If you're still having issues:

1. Check server logs: `~/.git-flow-master/server.log`
2. Check plugin cache: `~/.claude/plugins/cache/aureus/`
3. Open an issue: https://github.com/Pamacea/aureus/issues
