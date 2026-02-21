# Aureus Install Dependencies

Installs npm dependencies for Aureus plugin in the cached plugin directory.

## When to Use

After installing Aureus via `/plugin`, if the web server doesn't start automatically with `ERR_CONNECTION_REFUSED`.

## What This Does

1. Finds the Aureus plugin in Claude's cache
2. Installs npm dependencies for both web server and MCP server
3. Verifies installation was successful
4. Displays next steps

## Usage

Simply invoke this skill after installing Aureus:

```
/aureus-install
```

The skill will:
- Detect your platform (Windows/Mac/Linux)
- Locate the cached plugin
- Run npm install in both web/ and mcp/ directories
- Confirm success or show errors

## Expected Output

```
📦 Installing Aureus dependencies...
📦 Installing Web Interface dependencies...
added 69 packages
✓ Web dependencies installed

📦 Installing MCP Server dependencies...
added 93 packages
✓ MCP dependencies installed

✓ All dependencies installed successfully

Next steps:
1. Restart Claude Code, OR
2. Visit http://localhost:3747 (server should auto-start)

If server still doesn't start, check:
- ~/.git-flow-master/server.log
- Run: curl http://localhost:3747/api/status
```

## Troubleshooting

**Q: Skill can't find the plugin cache**
A: Make sure you've installed Aureus via `/plugin` first

**Q: npm install fails**
A: Check your internet connection and npm registry access:
```bash
npm config get registry
npm ping
```

**Q: Server still won't start after install**
A: See TROUBLESHOOTING.md in the plugin directory
