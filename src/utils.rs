//! Shared utility functions

#[cfg(test)]
use std::path::Path;

#[cfg(test)]
use anyhow::{Context, Result};

/// Truncate string to max length with ellipsis
#[cfg(test)]
pub fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        return s.to_string();
    }

    format!("{}...", &s[..max.saturating_sub(3)])
}

/// Strip ANSI escape codes from string
#[cfg(test)]
pub fn strip_ansi(s: &str) -> String {
    let re = regex::Regex::new(r"\x1b\[[0-9;]*m").unwrap();
    re.replace_all(s, "").to_string()
}

/// Get current git repository path
#[cfg(test)]
pub fn get_repo_path_cwd() -> Result<std::path::PathBuf> {
    let cwd = std::env::current_dir()
        .context("Cannot get current directory")?;

    find_repo_root(&cwd)
}

/// Find repository root by searching upwards
#[cfg(test)]
pub fn find_repo_root(path: &Path) -> Result<std::path::PathBuf> {
    let mut current = Some(path.to_path_buf());

    while let Some(curr) = current {
        let git_dir = curr.join(".git");

        if git_dir.exists() {
            return Ok(curr);
        }

        current = curr.parent().map(|p| p.to_path_buf());
    }

    anyhow::bail!("Not in a git repository")
}

/// Detect project type from files
#[cfg(test)]
#[derive(Debug, Clone, PartialEq)]
pub enum ProjectType {
    Rust,
    Node,
    Python,
    Go,
    Unknown,
}

#[cfg(test)]
impl ProjectType {
    pub fn detect(path: &Path) -> Self {
        if path.join("Cargo.toml").exists() {
            Self::Rust
        } else if path.join("package.json").exists() {
            Self::Node
        } else if path.join("pyproject.toml").exists()
            || path.join("setup.py").exists()
            || path.join("requirements.txt").exists() {
            Self::Python
        } else if path.join("go.mod").exists() {
            Self::Go
        } else {
            Self::Unknown
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            Self::Rust => "Rust",
            Self::Node => "Node.js",
            Self::Python => "Python",
            Self::Go => "Go",
            Self::Unknown => "Unknown",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_truncate() {
        assert_eq!(truncate("hello", 10), "hello");
        assert_eq!(truncate("hello world", 8), "hello...");
    }

    #[test]
    fn test_strip_ansi() {
        let colored = "\x1b[31mRed text\x1b[0m";
        assert_eq!(strip_ansi(colored), "Red text");
    }
}
