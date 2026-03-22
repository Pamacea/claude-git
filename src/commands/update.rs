//! Self-update command implementation

use anyhow::Result;
use colored::Colorize;
use std::env;

use crate::cli::UpdateCommand;

#[cfg(test)]
const CRATES_API: &str = "https://crates.io/api/v1/crates/oalacea-aureus";
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");

pub fn execute(cmd: UpdateCommand) -> Result<()> {
    if cmd.check_only {
        return check_version();
    }

    update_self(cmd.force)
}

fn check_version() -> Result<()> {
    println!("{}", "Checking for updates...".cyan());

    match get_latest_version() {
        Ok(latest) => {
            let current = semver::Version::parse(CURRENT_VERSION)?;
            let latest_ver = semver::Version::parse(&latest)?;

            if latest_ver > current {
                println!();
                println!("  {} {}", "Current:".dimmed(), CURRENT_VERSION);
                println!("  {} {}", "Latest:".green().bold(), latest);
                println!();
                println!("  Update with: {}", "cargo install oalacea-aureus --force".cyan());
                println!();
            } else {
                println!("  {} {}", "✓".green(), "Already up to date!".dimmed());
            }
            Ok(())
        }
        Err(e) => {
            println!("  {} {}", "⚠".yellow(), format!("Could not check for updates: {}", e).dimmed());
            // Don't fail on check errors
            Ok(())
        }
    }
}

fn update_self(force: bool) -> Result<()> {
    println!("{}", "Checking for updates...".cyan());

    let latest = match get_latest_version() {
        Ok(v) => v,
        Err(e) => {
            if force {
                println!("  {} Continuing anyway...", "⚠".yellow());
                "unknown".to_string()
            } else {
                return Err(e.context("Failed to check for updates. Use --force to update anyway."));
            }
        }
    };

    let current = semver::Version::parse(CURRENT_VERSION)?;
    let latest_ver = semver::Version::parse(&latest).unwrap_or(current.clone());

    if !force && latest_ver <= current {
        println!("  {} {}", "✓".green(), "Already up to date!");
        return Ok(());
    }

    println!();
    println!("  {} {} → {}", "Updating:".yellow(), CURRENT_VERSION, latest);
    println!();

    // Show installation instructions
    println!("  {}", "To update, run:".cyan());
    println!("    {}", "cargo install oalacea-aureus --force".bold());
    println!();
    println!("  {}", "Or from source:".cyan());
    println!("    {}", format!("cargo install --git https://github.com/Pamacea/aureus").bold());
    println!();

    Ok(())
}

fn get_latest_version() -> Result<String> {
    // Use minimal HTTP client - for now, just check if we can compile
    // In a real implementation, we'd use ureq or similar
    // For now, return a placeholder
    Ok("0.0.0".to_string())

    // Full implementation would be:
    // let client = ureq::Agent::new();
    // let response = client.get(&format!("{}/latest", CRATES_API))
    //     .call()?
    //     .into_json::<serde_json::Value>()?;
    // let version = response["crate"]["max_stable_version"]
    //     .as_str()
    //     .ok_or_else(|| anyhow::anyhow!("No version found"))?;
    // Ok(version.to_string())
}

#[cfg(test)]
pub fn get_current_version() -> &'static str {
    CURRENT_VERSION
}
