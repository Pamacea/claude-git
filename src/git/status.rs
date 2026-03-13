//! Git status operations

use anyhow::{Context, Result};
use git2::{Repository, StatusOptions, Status as GitStatus};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusEntry {
    pub path: String,
    pub status: FileStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FileStatus {
    Modified,
    Added,
    Deleted,
    Renamed,
    Copied,
    Ignored,
    Untracked,
    Conflicted,
}

impl FileStatus {
    pub fn emoji(&self) -> &'static str {
        match self {
            Self::Modified => "✏️",
            Self::Added => "✅",
            Self::Deleted => "❌",
            Self::Renamed => "➡️",
            Self::Copied => "📋",
            Self::Ignored => "🙈",
            Self::Untracked => "❓",
            Self::Conflicted => "⚠️",
        }
    }

    pub fn from_git_status(status: GitStatus) -> Vec<Self> {
        let mut result = Vec::new();

        if status.is_index_new() || status.is_wt_new() {
            result.push(Self::Added);
        }
        if status.is_index_modified() || status.is_wt_modified() {
            result.push(Self::Modified);
        }
        if status.is_index_deleted() || status.is_wt_deleted() {
            result.push(Self::Deleted);
        }
        if status.is_index_renamed() || status.is_wt_renamed() {
            result.push(Self::Renamed);
        }
        if status.is_conflicted() {
            result.push(Self::Conflicted);
        }
        if status.is_wt_new() {
            result.push(Self::Untracked);
        }
        if status.is_ignored() {
            result.push(Self::Ignored);
        }

        result
    }
}

/// Get repository status
pub fn get_status(repo_path: &Path) -> Result<Vec<StatusEntry>> {
    let repo = Repository::discover(repo_path)
        .context("Not a git repository")?;

    let mut options = StatusOptions::new();
    options.include_untracked(true);
    options.recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut options))?;

    let mut entries = Vec::new();

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("").to_string();
        let status = FileStatus::from_git_status(entry.status());

        // Get primary status
        let primary = status.first().copied().unwrap_or(FileStatus::Modified);

        entries.push(StatusEntry {
            path,
            status: primary,
        });
    }

    Ok(entries)
}

/// Get status summary
pub fn get_status_summary(repo_path: &Path) -> Result<StatusSummary> {
    let entries = get_status(repo_path)?;

    let mut counts: HashMap<String, usize> = HashMap::new();

    for entry in &entries {
        let status_str = format!("{:?}", entry.status);
        *counts.entry(status_str).or_insert(0) += 1;
    }

    Ok(StatusSummary { entries, counts })
}

#[derive(Debug, Clone)]
pub struct StatusSummary {
    pub entries: Vec<StatusEntry>,
    pub counts: HashMap<String, usize>,
}

impl StatusSummary {
    pub fn has_changes(&self) -> bool {
        !self.entries.is_empty()
    }

    #[cfg(test)]
    pub fn staged_count(&self) -> usize {
        self.entries.iter()
            .filter(|e| matches!(e.status, FileStatus::Added | FileStatus::Modified | FileStatus::Renamed))
            .count()
    }
}
