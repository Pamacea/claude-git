# Aureus - Versioned Release Convention CLI

> **Git workflow automation** with automatic semantic versioning for structured commits.

## Quick Start

```bash
# Install
cargo install --path .

# Initialize for Claude Code
aureus init --global

# Usage
git commit -m "feat: new feature"
# → Auto-rewritten to Aureus VRC format
```

## Commands

| Command | Description |
|---------|-------------|
| `aureus commit -m "msg"` | Create versioned commit |
| `aureus amend -m "more"` | Amend last commit |
| `aureus release --auto` | Create release with tag |
| `aureus suggest` | Show version suggestions |
| `aureus hooks status` | Check hooks status |

## VRC Format

```
TYPE: PROJECT - vX.Y.Z

- Change description
```

**Types**: `RELEASE` (MAJOR), `UPDATE` (MINOR), `PATCH` (PATCH)

**Auto-detection**:
- `feat`, `refactor` → UPDATE
- `fix`, `typo` → PATCH
- `!`, `BREAKING` → RELEASE

## Install

```bash
# From crates.io
cargo install aureus-vrc

# From source
cargo install --git https://github.com/Pamacea/aureus
```

## Cross-Platform

- ✅ **Windows** - PowerShell hook
- ✅ **macOS** - Bash hook
- ✅ **Linux** - Bash hook

## Requirements

- Rust 1.70+ or `cargo install`
- Git 2.0+
- `jq` (for hook functionality)

## Links

**GitHub**: https://github.com/Pamacea/aureus

**MIT** © Oalacea
