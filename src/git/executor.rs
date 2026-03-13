//! Git operations using git2 crate

use anyhow::{Context, Result, anyhow};
use git2::{
    Repository, Signature, Commit,
};
use std::path::Path;

#[cfg(test)]
use std::path::PathBuf;

/// Open repository, searching upwards from given path
pub fn get_repo(path: &Path) -> Result<Repository> {
    Repository::discover(path)
        .context("Not a git repository (or any parent)")
}

/// Get the current repository path
#[cfg(test)]
pub fn get_repo_path(repo: &Repository) -> Result<PathBuf> {
    repo.workdir()
        .map(|p| p.to_path_buf())
        .context("Cannot get repository workdir")
}

/// Get all tags in the repository
pub fn get_tags(repo_path: &Path) -> Result<Vec<String>> {
    let repo = get_repo(repo_path)?;
    let tag_names = repo.tag_names(None)?;

    let mut tags = Vec::new();
    for name in tag_names.iter().flatten() {
        tags.push(name.to_string());
    }

    Ok(tags)
}

/// Get current branch name
#[cfg(test)]
pub fn get_current_branch(repo_path: &Path) -> Result<String> {
    let repo = get_repo(repo_path)?;
    let head = repo.head()?;
    let name = head.shorthand()
        .context("HEAD is detached")?;
    Ok(name.to_string())
}

/// Get the last commit
pub fn get_last_commit(repo_path: &Path) -> Result<CommitInfo> {
    let repo = get_repo(repo_path)?;
    let head = repo.head()?;
    let commit = head.peel_to_commit()?;

    // Extract all owned values before commit is dropped
    let id = commit.id().to_string();
    let message = commit.message().unwrap_or("").to_string();
    let author = commit.author().name().unwrap_or("").to_string();
    let summary = commit.summary().unwrap_or("").to_string();
    let time = commit.time().seconds();

    Ok(CommitInfo {
        id,
        message,
        author,
        summary,
        time,
    })
}

#[allow(dead_code)]
pub struct CommitInfo {
    pub id: String,
    pub message: String,
    pub author: String,
    pub summary: String,
    pub time: i64,
}

/// Stage files for commit
pub fn add_files(repo_path: &Path, files: &[String]) -> Result<()> {
    let repo = get_repo(repo_path)?;
    let mut index = repo.index()?;

    if files.contains(&"*".to_string()) || files.contains(&".".to_string()) {
        // Add all
        let mut builder = git2::StatusOptions::new();
        builder.include_untracked(true);

        for entry in repo.statuses(Some(&mut builder))?.iter() {
            if let Some(path) = entry.path() {
                index.add_path(Path::new(path))?;
            }
        }
    } else {
        for file in files {
            index.add_path(Path::new(file))?;
        }
    }

    index.write()?;
    Ok(())
}

/// Create a commit with the given message
pub fn create_commit(
    repo_path: &Path,
    message: &str,
    allow_empty: bool,
) -> Result<String> {
    let repo = get_repo(repo_path)?;
    let mut index = repo.index()?;

    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;

    let sig = signature()?;

    let parent_commit = match repo.head() {
        Ok(head) => Some(head.peel_to_commit()?),
        Err(_) => None, // Initial commit
    };

    if !allow_empty {
        if let Some(ref parent) = parent_commit {
            let parent_tree = parent.tree()?;
            if tree.id() == parent_tree.id() {
                return Err(anyhow!("No changes to commit"));
            }
        }
    }

    let parents: Vec<&Commit> = parent_commit.as_ref().into_iter().collect();

    let oid = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        message,
        &tree,
        &parents,
    )?;

    Ok(oid.to_string())
}

/// Amend the last commit
pub fn amend_last_commit(
    repo_path: &Path,
    new_message: Option<&str>,
) -> Result<String> {
    let repo = get_repo(repo_path)?;
    let head = repo.head()?;
    let commit = head.peel_to_commit()?;
    let sig = signature()?;

    let mut index = repo.index()?;
    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;

    let oid = commit.amend(
        Some("HEAD"),
        Some(&sig),
        Some(&sig),
        new_message,
        None,
        Some(&tree),
    )?;

    Ok(oid.to_string())
}

/// Create a tag
pub fn create_tag(
    repo_path: &Path,
    name: &str,
    message: Option<&str>,
    annotated: bool,
) -> Result<String> {
    let repo = get_repo(repo_path)?;
    let head = repo.head()?;
    let target = head.peel_to_commit()?;

    let sig = signature()?;

    let oid = if annotated {
        repo.tag(
            name,
            &target.into_object(),
            &sig,
            message.unwrap_or(""),
            false,
        )?
    } else {
        repo.tag_lightweight(name, &target.into_object(), false)?
    };

    Ok(oid.to_string())
}

/// Get signature from git config
pub fn signature() -> Result<git2::Signature<'static>> {
    let name = std::env::var("GIT_AUTHOR_NAME")
        .or_else(|_| std::env::var("USER"))
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "Unknown".to_string());

    let email = std::env::var("GIT_AUTHOR_EMAIL")
        .or_else(|_| {
            std::env::var("USER").map(|u| format!("{}@example.com", u))
        })
        .unwrap_or_else(|_| "unknown@example.com".to_string());

    Signature::now(&name, &email).context("Failed to create signature")
}

/// Check if path is inside a git repository
pub fn is_repo(path: &Path) -> bool {
    get_repo(path).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_signature() {
        std::env::set_var("GIT_AUTHOR_NAME", "Test User");
        std::env::set_var("GIT_AUTHOR_EMAIL", "test@example.com");

        let sig = signature().unwrap();
        assert_eq!(sig.name(), Some("Test User"));
        assert_eq!(sig.email(), Some("test@example.com"));
    }
}
