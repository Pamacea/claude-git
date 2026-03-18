//! Init command implementation

use anyhow::{Context, Result};
use colored::Colorize;
use std::fs;

use crate::cli::InitCommand;

const AUREUS_MD: &str = r#"# Aureus VRC Integration

> **Note**: Add this to your project's CLAUDE.md:
> ```markdown
> See \`~/.claude/AUREUS.md\` for Versioned Release Convention (VRC) details.
> ```

Aureus VRC provides **Versioned Release Convention** for Git workflows.

## Quick Start

```bash
# Create a versioned commit
git commit -m "feat: new feature"
# → Automatically rewritten to: aureus-vrc commit

# Suggest versions
aureus-vrc suggest

# Create a release
aureus-vrc release --auto
```

## Convention Configuration

### Commit Format

```
TYPE: PROJECT - vX.Y.Z

- Change description
```

### Commit Types

| Type | SemVer | Trigger Keywords | Usage |
|------|--------|------------------|-------|
| **RELEASE** | MAJOR (X.0.0) | `!`, `BREAKING`, `breaking` | Breaking changes |
| **UPDATE** | MINOR (0.X.0) | `feat`, `refactor`, `add` | New features |
| **PATCH** | PATCH (0.0.X) | `fix`, `bug`, `patch` | Bug fixes |

### Auto-Detection Rules

When you run `git commit -m "..."`, Aureus auto-detects the type:

```bash
git commit -m "feat: add authentication"
# → UPDATE: MyProject - v1.1.0

git commit -m "fix: login bug"
# → PATCH: MyProject - v1.1.1

git commit -m "BREAKING: change API"
# → RELEASE: MyProject - v2.0.0
```

### Customizing Convention

Edit this file to customize keywords:

```markdown
## Aureus Custom Convention

### Release Keywords
! BREAKING breaking major refactor API-change

### Update Keywords
feat feature added new refactor enhance improve

### Patch Keywords
fix bugfix patch corrected hotfix typo
```

### Project Name Detection

1. **Config**: Set in `~/.aureus-vrc/config.toml`:
   ```toml
   [project]
   name = "MyProject"
   ```

2. **Auto**: Falls back to directory name

3. **Override**: Use `aureus-vrc commit --project CustomName`

## Commands Reference

| Command | Description |
|---------|-------------|
| `aureus-vrc commit -m "msg"` | Create versioned commit |
| `aureus-vrc amend -m "more info"` | Amend last commit (same version) |
| `aureus-vrc release --auto` | Create release with tag |
| `aureus-vrc suggest` | Show version suggestions |
| `aureus-vrc config set project.name X` | Set project name |
| `aureus-vrc hooks status` | Check hooks status |

## Hook Behavior

The `PreToolUse` hook (Node.js module) intercepts:
- `git commit -m "message"` → `aureus-vrc commit -m "message"`
- `git commit` (no message) → `aureus-vrc commit` (prompts for message)
- `git commit --amend` → `aureus-vrc commit --amend`

To bypass: `git commit --no-verify` or use `aureus-vrc commit` directly.

## Hook File

Hook location: `~/.claude/hooks/aureus-rewrite.cjs`

This Node.js module integrates with Claude Code's hook system to transparently
rewrite git commands to aureus-vrc commands.

## Token Savings

Using Aureus saves tokens by:
- ✅ No MCP server overhead (native CLI)
- ✅ Auto-formatting commit messages
- ✅ Version auto-detection from keywords
- ✅ Single binary (~3MB RAM vs ~50MB for Node.js)
- ✅ Lightweight Node.js hook (minimal overhead)
"#;

const HOOK_SCRIPT_NODE: &str = r#"/**
 * Aureus VRC Auto-Rewrite Hook for Claude Code
 * Transparently rewrites git commit → aureus-vrc commit
 */

const { execSync } = require('child_process');

function preToolUse(context, toolName, toolInput) {
    // Only process Bash commands
    if (toolName !== 'Bash') {
        return;
    }

    const command = toolInput?.command;
    if (!command || typeof command !== 'string') {
        return;
    }

    // Check if aureus-vrc is available
    let hasAureus = false;
    try {
        execSync('aureus-vrc --version', { stdio: 'ignore' });
        hasAureus = true;
    } catch {
        return; // aureus-vrc not installed
    }

    if (!hasAureus) {
        return;
    }

    // Don't modify if already aureus-vrc
    if (/^aureus-vrc\s+commit/.test(command)) {
        return;
    }

    // Match: git commit [options]
    const gitCommitRegex = /^git\s+commit(\s+.*)?$/;
    if (!gitCommitRegex.test(command.trim())) {
        return;
    }

    // Extract arguments (message, etc.)
    const match = command.match(/^git\s+commit(\s+.*)$/);
    const args = match ? match[1].trim() : '';

    // Rewrite to aureus-vrc
    const rewritten = `aureus-vrc commit${args ? ' ' + args : ''}`;

    return {
        permissionDecision: 'allow',
        permissionDecisionReason: 'Aureus auto-rewrite',
        updatedInput: {
            ...toolInput,
            command: rewritten
        }
    };
}

module.exports = { preToolUse };
"#;

pub fn execute(cmd: InitCommand) -> Result<()> {
    if cmd.global {
        init_global(cmd.force, cmd.no_hooks)
    } else {
        init_local(cmd.force)
    }
}

fn init_global(force: bool, no_hooks: bool) -> Result<()> {
    println!("\n{}", "Initializing Aureus for Claude Code...".bold().cyan());

    let home = dirs::home_dir().context("Cannot determine home directory")?;
    let aureus_dir = home.join(".aureus");
    let claude_dir = home.join(".claude");

    // Create directories
    fs::create_dir_all(&aureus_dir)
        .context("Failed to create .aureus directory")?;

    fs::create_dir_all(&claude_dir.join("hooks"))
        .context("Failed to create .claude/hooks directory")?;

    // Write AUREUS.md
    let aureus_md_path = claude_dir.join("AUREUS.md");
    if !aureus_md_path.exists() || force {
        fs::write(&aureus_md_path, AUREUS_MD)
            .context("Failed to write AUREUS.md")?;
        println!("  ✓ {}", "Created ~/.claude/AUREUS.md".green());
    } else {
        println!("  {}", "~/.claude/AUREUS.md already exists".dimmed());
    }

    // Install hook if not disabled
    if !no_hooks {
        let hook_filename = "aureus-rewrite.cjs";

        let hook_path = claude_dir.join("hooks").join(hook_filename);
        if !hook_path.exists() || force {
            fs::write(&hook_path, HOOK_SCRIPT_NODE)
                .context("Failed to write hook script")?;

            println!("  ✓ {}", format!("Created ~/.claude/hooks/{}", hook_filename).green());
        }

        // Update settings.json - inject hooks without removing existing ones
        match update_settings_json(&claude_dir, hook_filename) {
            Ok(_) => {},
            Err(e) => {
                eprintln!("  {} {}", "✗".red(), format!("Failed to update settings.json: {}", e).red());
                eprintln!("    {}", "Hooks were NOT injected. Please check ~/.claude/settings.json manually.".yellow());
                return Err(e);
            }
        }
    }

    // Update CLAUDE.md to include @AUREUS.md reference
    if let Err(e) = update_claude_md(&claude_dir, force) {
        eprintln!("  {} {}", "⚠".yellow(), format!("Could not update CLAUDE.md: {}", e).yellow());
    }

    println!();
    println!("✓ {}", "Aureus initialized successfully!".green());
    println!();
    println!("{}", "Next steps:".bold());
    println!("  1. Restart Claude Code");
    println!("  2. Try: {}", "git commit -m \"feat: new feature\"".cyan());
    println!("     → Will be rewritten to aureus-vrc commit automatically");

    Ok(())
}

fn init_local(force: bool) -> Result<()> {
    let cwd = std::env::current_dir()
        .context("Cannot get current directory")?;

    let aureus_md_path = cwd.join("AUREUS.md");

    if !aureus_md_path.exists() || force {
        fs::write(&aureus_md_path, AUREUS_MD)
            .context("Failed to write AUREUS.md")?;
        println!("✓ {}", "Created AUREUS.md".green());
    } else {
        println!("{}", "AUREUS.md already exists".dimmed());
    }

    Ok(())
}

fn update_claude_md(claude_dir: &std::path::Path, force: bool) -> Result<()> {
    let claude_md_path = claude_dir.join("CLAUDE.md");

    // Only add if CLAUDE.md exists
    if !claude_md_path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&claude_md_path)?;

    // Count existing @AUREUS.md references
    let aureus_count = content.matches("@AUREUS.md").count();

    // Already has exactly one reference and not forcing
    if aureus_count == 1 && !force {
        println!("  {}", "@AUREUS.md already referenced in CLAUDE.md".dimmed());
        return Ok(());
    }

    // If forcing, remove all duplicates first
    let cleaned_content = if aureus_count > 0 {
        content.lines()
            .filter(|line| *line != "@AUREUS.md")
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        content.clone()
    };

    // Add @AUREUS.md reference at the beginning (after any existing @ references)
    let aureus_reference = "@AUREUS.md";

    let new_content = if cleaned_content.contains("@RTK.md") {
        // Insert after @RTK.md
        cleaned_content.replace("@RTK.md", &format!("@RTK.md\n{}", aureus_reference))
    } else if cleaned_content.lines().any(|l| l.starts_with('@')) {
        // Find the last @ reference and insert after it
        let lines: Vec<&str> = cleaned_content.lines().collect();
        let mut new_lines = Vec::new();
        let mut inserted = false;
        let mut last_at_index = 0;

        // Find the last @ reference
        for (i, line) in lines.iter().enumerate() {
            if line.starts_with('@') {
                last_at_index = i;
            }
        }

        for (i, line) in lines.iter().enumerate() {
            new_lines.push(*line);
            if !inserted && i == last_at_index {
                // Insert after this line (at the end of the @ section)
                // Check if next line is also an @ reference
                if i < lines.len() - 1 && !lines[i + 1].starts_with('@') {
                    new_lines.push(aureus_reference);
                    inserted = true;
                } else if i == lines.len() - 1 {
                    new_lines.push(aureus_reference);
                    inserted = true;
                }
            }
        }

        // If no suitable position found, prepend
        if !inserted {
            new_lines.insert(0, aureus_reference);
        }

        new_lines.join("\n")
    } else {
        // No @ references, add at the end before the version line
        if cleaned_content.contains("*Version:") {
            cleaned_content.replace("*Version:", &format!("{}\n\n*Version:", aureus_reference))
        } else {
            format!("{}\n\n{}", cleaned_content.trim(), aureus_reference)
        }
    };

    fs::write(&claude_md_path, new_content)
        .context("Failed to update CLAUDE.md")?;
    println!("  ✓ {}", "Added @AUREUS.md reference to CLAUDE.md".green());

    Ok(())
}

fn update_settings_json(claude_dir: &std::path::Path, hook_filename: &str) -> Result<()> {
    let settings_path = claude_dir.join("settings.json");

    // Read existing settings, preserving ALL content
    let mut settings: serde_json::Value = if settings_path.exists() {
        let content = fs::read_to_string(&settings_path)
            .context("Failed to read settings.json")?;

        // Strip BOM if present (common on Windows)
        let content = content.strip_prefix('\u{feff}').unwrap_or(&content);

        match serde_json::from_str(content) {
            Ok(v) => v,
            Err(e) => {
                // Backup corrupted file instead of silently discarding
                let backup_path = settings_path.with_extension("json.bak");
                let _ = fs::copy(&settings_path, &backup_path);
                eprintln!("  {} {}", "⚠".yellow(),
                    format!("settings.json parse error: {}. Backed up to settings.json.bak", e).yellow());
                return Err(anyhow::anyhow!(
                    "Cannot parse settings.json (backed up). Please fix it manually and re-run init."
                ));
            }
        }
    } else {
        serde_json::json!({})
    };

    // Ensure settings is an object
    if !settings.is_object() {
        return Err(anyhow::anyhow!("settings.json is not a JSON object"));
    }

    // Ensure hooks object exists without overwriting other hook types
    if !settings.get("hooks").map_or(false, |h| h.is_object()) {
        settings["hooks"] = serde_json::json!({});
    }

    // Ensure hooks.PreToolUse array exists without overwriting other arrays
    let hooks_obj = settings["hooks"].as_object_mut()
        .context("hooks is not an object")?;

    if !hooks_obj.get("PreToolUse").map_or(false, |p| p.is_array()) {
        hooks_obj.insert("PreToolUse".to_string(), serde_json::json!([]));
    }

    // Build absolute path for the hook
    let hook_path = claude_dir.join("hooks").join(hook_filename);
    let hook_path_str = hook_path.to_str()
        .context("Invalid hook path")?;

    // Use "node" prefix for cross-platform compatibility
    let hook_command = format!("node {}", hook_path_str.replace('\\', "/"));

    // Matcher should ALWAYS be "Bash" - that's the Claude Code tool name
    let matcher = "Bash";

    // Get the PreToolUse array
    let pre_tool_uses = settings["hooks"]["PreToolUse"].as_array_mut()
        .context("hooks.PreToolUse is not an array")?;

    // Check if aureus hook already exists (deduplicate)
    let has_aureus = pre_tool_uses.iter().any(|entry| {
        entry.get("hooks")
            .and_then(|h| h.as_array())
            .map(|hooks| {
                hooks.iter().any(|h| {
                    h.get("command")
                        .and_then(|c| c.as_str())
                        .map(|c| c.contains("aureus-rewrite"))
                        .unwrap_or(false)
                })
            })
            .unwrap_or(false)
    });

    if has_aureus {
        // Remove existing aureus hooks (to replace with fresh one)
        let filtered: Vec<_> = pre_tool_uses.iter()
            .filter(|entry| {
                !entry.get("hooks")
                    .and_then(|h| h.as_array())
                    .map(|hooks| {
                        hooks.iter().any(|h| {
                            h.get("command")
                                .and_then(|c| c.as_str())
                                .map(|c| c.contains("aureus-rewrite"))
                                .unwrap_or(false)
                        })
                    })
                    .unwrap_or(false)
            })
            .cloned()
            .collect();
        *pre_tool_uses = filtered;
    }

    // Build the aureus hook entry
    let aureus_hook = serde_json::json!({
        "matcher": matcher,
        "hooks": [{
            "type": "command",
            "command": hook_command,
            "timeout": 5000
        }]
    });

    // Find position to insert (before rtk-rewrite if exists, for priority)
    let insert_pos = pre_tool_uses.iter()
        .position(|entry| {
            entry.get("hooks")
                .and_then(|h| h.as_array())
                .map(|hooks| {
                    hooks.iter().any(|h| {
                        h.get("command")
                            .and_then(|c| c.as_str())
                            .map(|c| c.contains("rtk-rewrite"))
                            .unwrap_or(false)
                    })
                })
                .unwrap_or(false)
        });

    if let Some(pos) = insert_pos {
        pre_tool_uses.insert(pos, aureus_hook);
    } else {
        pre_tool_uses.push(aureus_hook);
    }

    // Write back preserving all other settings
    let output = serde_json::to_string_pretty(&settings)?;
    fs::write(&settings_path, &output)
        .context("Failed to write settings.json")?;

    // Verify the hook was actually written
    let verify_content = fs::read_to_string(&settings_path)?;
    if !verify_content.contains("aureus-rewrite") {
        return Err(anyhow::anyhow!("Hook injection verification failed - aureus-rewrite not found in settings.json after write"));
    }

    println!("  ✓ {}", "Updated ~/.claude/settings.json (hooks injected)".green());

    Ok(())
}
