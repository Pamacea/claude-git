# Git Flow Master - MCP Server

Model Context Protocol server for Claude Code integration.

## Overview

This MCP server provides Git Flow Master tools and resources directly to Claude Code, enabling native Git automation with Conventional Commits.

## Installation

```bash
cd mcp
npm install
```

## Available Tools

### Commit Tools

| Tool | Description |
|------|-------------|
| `git_smart_commit` | Analyze changes and create a Conventional Commit |
| `git_validate_message` | Validate a commit message against Conventional Commits |
| `git_generate_message` | Generate a Conventional Commit message from parameters |

### Repository Tools

| Tool | Description |
|------|-------------|
| `git_get_status` | Get repository status (branch, staged, unstaged) |
| `git_get_log` | Get recent commit history |
| `git_get_branch` | Get current branch and all branches |
| `git_get_diff` | Get diff of staged or unstaged changes |

### Release Tools

| Tool | Description |
|------|-------------|
| `git_create_release` | Create a release with version bump and tag |
| `git_get_tags` | Get all tags sorted by version |

### Config Tools

| Tool | Description |
|------|-------------|
| `git_get_config` | Get Git Flow Master configuration |
| `git_update_config` | Update Git Flow Master configuration |

### Hooks Tools

| Tool | Description |
|------|-------------|
| `git_install_hooks` | Install Git hooks for a repository |
| `git_uninstall_hooks` | Uninstall Git hooks from a repository |
| `git_get_tracked_repos` | Get all tracked repositories |

### Analysis Tools

| Tool | Description |
|------|-------------|
| `git_analyze_commits` | Analyze commits for SemVer bump recommendation |
| `git_suggest_type` | Suggest commit type based on file changes |

## Available Resources

| Resource | Description |
|----------|-------------|
| `git-flow://config` | Current configuration (types, scopes, rules) |
| `git-flow://state` | Tracked repositories and active hooks |
| `git-flow://conventions` | Complete Git conventions reference |

## Usage in Claude Code

Once the MCP server is configured, Claude Code can use the tools directly:

```
User: "Commit my changes with a message about adding authentication"
Claude: [Uses git_smart_commit tool]
```

```
User: "What's the status of my repository?"
Claude: [Uses git_get_status tool]
```

```
User: "Analyze my commits since the last release"
Claude: [Uses git_analyze_commits tool]
```

## Configuration

The MCP server is configured via `.claude-plugin/.mcp.json`:

```json
{
  "mcpServers": {
    "git-flow-master": {
      "type": "stdio",
      "command": "${CLAUDE_PLUGIN_ROOT}/mcp/server.js"
    }
  }
}
```

**Important:** After installing the plugin, run `npm install` in the `mcp/` directory to install the MCP SDK dependencies:

```bash
cd plugins/git-master/mcp
npm install
```

## Tool Examples

### git_smart_commit

```json
{
  "repoPath": "/path/to/repo",
  "type": "feat",
  "scope": "auth",
  "description": "add OAuth2 login",
  "breaking": false
}
```

### git_validate_message

```json
{
  "message": "feat(auth): add OAuth2 login"
}
```

### git_get_status

```json
{
  "repoPath": "/path/to/repo"
}
```

### git_analyze_commits

```json
{
  "repoPath": "/path/to/repo",
  "since": "v1.2.0"
}
```

## Integration with Web Interface

The MCP server shares data with the web interface:
- Configuration is stored in `~/.git-flow-master/config.json`
- State is stored in `~/.git-flow-master/state.json`
- Changes in web UI are immediately available to MCP tools

## Development

```bash
# Run directly
node server.js

# Debug mode
DEBUG=* node server.js
```

## License

MIT © Yanis
