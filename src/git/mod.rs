//! Git operations using git2

#[cfg(test)]
use anyhow::Context;

pub mod executor;
pub mod hooks;
pub mod diff;
pub mod status;

pub use executor::{add_files, create_commit, get_last_commit, get_tags, is_repo, amend_last_commit, create_tag};
pub use status::{get_status, get_status_summary, StatusSummary, FileStatus};
pub use diff::{get_diff, get_staged_files};

use crate::cli::CommitType;

/// Get the repository path from current directory
#[cfg(test)]
pub fn get_repo_path() -> Result<std::path::PathBuf, anyhow::Error> {
    std::env::current_dir().context("Cannot get current directory")
}

/// Get the current version from git tags
pub fn get_current_version(repo_path: &std::path::Path) -> Option<String> {
    let tags = get_tags(repo_path).ok()?;
    let version_tags: Vec<_> = tags.iter()
        .filter(|t| t.starts_with('v'))
        .filter_map(|t| crate::convention::version::parse_version(t).ok())
        .collect();

    version_tags.into_iter().max_by(|a, b| a.cmp(b)).map(|v| v.to_string())
}

/// Determine next version based on last commit and changes
pub fn determine_next_version(
    _repo_path: &std::path::Path,
    commit_type: CommitType,
    current_version: Option<&str>,
) -> String {
    let base = current_version
        .and_then(|v| crate::convention::version::parse_version(v).ok())
        .unwrap_or(crate::convention::version::Version::new(0, 0, 0));

    base.bump(commit_type).to_string()
}
