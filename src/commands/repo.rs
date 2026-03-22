//! Repository tracking command implementation

use anyhow::{Context, Result};
use colored::Colorize;

use crate::cli::RepoAction;
use crate::git::get_current_version;
use crate::storage::{get_tracked_repo, track_repo, untrack_repo, load_state};

pub fn execute(action: RepoAction) -> Result<()> {
    match action {
        RepoAction::Track { name } => cmd_track(name)?,
        RepoAction::Untrack => cmd_untrack()?,
        RepoAction::List => cmd_list()?,
        RepoAction::Info => cmd_info()?,
    }
    Ok(())
}

fn cmd_track(name: String) -> Result<()> {
    let cwd = std::env::current_dir().context("Cannot get current directory")?;
    let path = cwd.as_path();

    println!("{} {}", "Tracking repository:".cyan(), name);
    println!("  Path: {}", path.display());

    let tracked = track_repo(path, &name)?;
    let first_tracked = tracked.first_tracked.format("%Y-%m-%d %H:%M:%S").to_string();

    println!();
    println!("  {}", "✓ Repository tracked successfully".green());
    println!("  Current version: {}", tracked.current_version.as_ref().map(|s| s.as_str()).unwrap_or("unknown"));
    println!("  First tracked: {}", first_tracked);

    Ok(())
}

fn cmd_untrack() -> Result<()> {
    let cwd = std::env::current_dir().context("Cannot get current directory")?;
    let path = cwd.as_path();

    if let Some(repo) = get_tracked_repo(path)? {
        println!("{} {}", "Untracking repository:".yellow(), repo.name);
        untrack_repo(path)?;

        println!();
        println!("  {}", "✓ Repository untracked".green());
    } else {
        println!("  {}", "Repository is not tracked".dimmed());
    }

    Ok(())
}

fn cmd_list() -> Result<()> {
    let state = load_state()?;

    if state.tracked_repos.is_empty() {
        println!("{}", "No repositories tracked.".dimmed());
        return Ok(());
    }

    println!("{}", "Tracked repositories:".bold());
    println!();

    for (_path, repo) in &state.tracked_repos {
        let version = repo.current_version.as_ref().map(|s| s.as_str()).unwrap_or("unknown");
        println!("  {} {} ({})", repo.name.cyan(), version.dimmed(), repo.path);
        println!("    Commits: {}", repo.commits_count);
        println!("    Hooks: {}", if repo.hooks_enabled { "enabled" } else { "disabled" });
        println!();
    }

    println!("Total: {} repository/repositories", state.tracked_repos.len());

    Ok(())
}

fn cmd_info() -> Result<()> {
    let cwd = std::env::current_dir().context("Cannot get current directory")?;
    let path = cwd.as_path();

    if let Some(repo) = get_tracked_repo(path)? {
        println!("{}", "Repository Information:".bold());
        println!();
        println!("  Name: {}", repo.name);
        println!("  Path: {}", repo.path);
        println!("  Tracked: {}", repo.first_tracked.format("%Y-%m-%d %H:%M:%S").to_string());

        if let Some(version) = &repo.current_version {
            println!("  Version: {}", version);
        }

        if let Some(commit) = &repo.last_commit {
            println!("  Last commit: {}", commit);
        }

        // Get current git version
        if let Some(git_version) = get_current_version(path) {
            println!("  Git version: {}", git_version);
        }

        println!("  Total commits: {}", repo.commits_count);
        println!("  Hooks: {}", if repo.hooks_enabled { "enabled" } else { "disabled" });
    } else {
        println!("  {}", "Repository is not tracked.".yellow());
        println!("  Use {} to track it.", "aureus repo track <name>".cyan());
    }

    Ok(())
}
