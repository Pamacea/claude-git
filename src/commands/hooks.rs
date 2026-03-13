//! Hooks command implementation

use anyhow::{Context, Result};
use colored::Colorize;

use crate::cli::HooksCommand;
use crate::git::hooks as git_hooks;

pub fn execute(cmd: HooksCommand) -> Result<()> {
    match cmd.action {
        crate::cli::HooksAction::Install { global } => {
            install(global)
        }
        crate::cli::HooksAction::Uninstall { global } => {
            uninstall(global)
        }
        crate::cli::HooksAction::Status => {
            status()
        }
        crate::cli::HooksAction::ValidateCommit { file } => {
            validate_commit(file)
        }
        crate::cli::HooksAction::PreCommit => {
            pre_commit()
        }
    }
}

fn install(_global: bool) -> Result<()> {
    let repo_path = std::env::current_dir()
        .context("Cannot get current directory")?;

    println!("\n{}", "Installing Aureus hooks...".bold().cyan());

    let result = git_hooks::install_hooks(&repo_path)?;

    if result.installed.is_empty() {
        println!("  {}", "No hooks installed (already present)".yellow());
    } else {
        for hook in &result.installed {
            println!("  ✓ {}", hook.green());
        }
    }

    if result.has_failures() {
        println!();
        for (hook, error) in &result.failed {
            println!("  ✗ {}: {}", hook.red(), error.dimmed());
        }
    }

    println!();
    println!("✓ {}", "Hooks installed successfully!".green());

    Ok(())
}

fn uninstall(_global: bool) -> Result<()> {
    let repo_path = std::env::current_dir()
        .context("Cannot get current directory")?;

    println!("\n{}", "Uninstalling Aureus hooks...".bold().cyan());

    let result = git_hooks::uninstall_hooks(&repo_path)?;

    if result.installed.is_empty() {
        println!("  {}", "No hooks to remove".dimmed());
    } else {
        for hook in &result.installed {
            println!("  ✓ {}", format!("Removed {}", hook).green());
        }
    }

    println!();
    println!("✓ {}", "Hooks uninstalled!".green());

    Ok(())
}

fn status() -> Result<()> {
    let repo_path = std::env::current_dir()
        .context("Cannot get current directory")?;

    let status = git_hooks::hooks_status(&repo_path)?;

    println!("\n{}", "Git Hooks Status:".bold().cyan());
    println!();

    if status.installed.is_empty() {
        println!("  {}", "No Aureus hooks installed".dimmed());
    } else {
        for hook in &status.installed {
            println!("  ✓ {}", hook.green());
        }
    }

    // Show current branch info
    if let Ok(branch) = git_hooks::get_current_branch(&repo_path) {
        let suggested = git_hooks::suggest_commit_type_for_branch(&branch);
        println!();
        println!("  Branch: {}", branch.cyan());
        if let Some(suggestion) = suggested {
            println!("  Suggested: {}", format!("→ {}", suggestion).green());
        }
    }

    println!();

    Ok(())
}

fn validate_commit(file: String) -> Result<()> {
    let msg_path = std::path::PathBuf::from(file);

    // Read commit message
    let content = std::fs::read_to_string(&msg_path)
        .context("Failed to read commit message file")?;

    // Get current branch for context
    let repo_path = std::env::current_dir()
        .context("Cannot get current directory")?;
    let branch_info = git_hooks::get_current_branch(&repo_path)
        .ok()
        .map(|b| {
            let suggested = git_hooks::suggest_commit_type_for_branch(&b);
            (b, suggested)
        });

    // Parse message
    match crate::convention::parse_message(&content) {
        Some(parsed) if parsed.valid => {
            // Valid VRC message
            println!("{}", "✓ Valid VRC message".green());
            println!("  Type: {}", parsed.commit_type.to_string().cyan());
            println!("  Project: {}", parsed.project.cyan());
            println!("  Version: {}", parsed.version.cyan());

            // Check branch suggestion if available
            if let Some((branch, Some(suggested))) = &branch_info {
                let current_type = parsed.commit_type.as_str();
                if *suggested != current_type {
                    println!();
                    println!("  {} Branch {} suggests {}, but using {}",
                        "⚠".yellow(),
                        branch.cyan(),
                        suggested.green(),
                        current_type.yellow()
                    );
                }
            }

            Ok(())
        }
        _ => {
            // Invalid VRC message - show helpful error
            eprintln!("{}", "✗ Invalid VRC message format".red());
            eprintln!();
            eprintln!("Expected format:");
            eprintln!("  {}", "TYPE: PROJECT_NAME - vVERSION".cyan());
            eprintln!();
            eprintln!("Types:");
            eprintln!("  {}", "RELEASE  - Major version (breaking changes)".green());
            eprintln!("  {}", "UPDATE   - Minor version (new features)".cyan());
            eprintln!("  {}", "PATCH    - Patch version (bug fixes)".dimmed());
            eprintln!();

            // Show branch suggestion
            if let Some((branch, Some(suggested))) = &branch_info {
                eprintln!("  Branch {} suggests: {}",
                    branch.cyan(),
                    suggested.green()
                );
                eprintln!("  Try: {}",
                    format!("{}: <project> - v0.1.0", suggested).cyan()
                );
            }

            std::process::exit(1);
        }
    }
}

fn pre_commit() -> Result<()> {
    let repo_path = std::env::current_dir()
        .context("Cannot get current directory")?;

    // Run pre-commit checks
    let result = git_hooks::run_pre_commit_checks(&repo_path)?;

    if result.passed {
        println!("{}", "✓ Pre-commit checks passed".green());
    } else {
        eprintln!("{}", "✗ Pre-commit checks failed".red());
        for warning in &result.warnings {
            eprintln!("  {}", warning.yellow());
        }
        std::process::exit(1);
    }

    Ok(())
}
