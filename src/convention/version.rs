//! Semantic version parsing and bumping

use crate::cli::CommitType;
use serde::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl Version {
    pub const fn new(major: u32, minor: u32, patch: u32) -> Self {
        Self { major, minor, patch }
    }

    /// Bump version according to commit type
    pub fn bump(&self, commit_type: CommitType) -> Version {
        match commit_type {
            CommitType::Release => Version::new(self.major + 1, 0, 0),
            CommitType::Update => Version::new(self.major, self.minor + 1, 0),
            CommitType::Patch => Version::new(self.major, self.minor, self.patch + 1),
        }
    }

    /// Get suggestions for all bump types
    pub fn suggestions(&self) -> VersionSuggestions {
        VersionSuggestions {
            current: *self,
            release: self.bump(CommitType::Release),
            update: self.bump(CommitType::Update),
            patch: self.bump(CommitType::Patch),
        }
    }
}

impl std::fmt::Display for Version {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "v{}.{}.{}", self.major, self.minor, self.patch)
    }
}

impl FromStr for Version {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s.trim().trim_start_matches('v');

        let parts: Vec<&str> = s.split('.').collect();
        if parts.len() != 3 {
            return Err(format!("Invalid version format: {}", s));
        }

        let major = parts[0].parse::<u32>()
            .map_err(|_| format!("Invalid major version: {}", parts[0]))?;
        let minor = parts[1].parse::<u32>()
            .map_err(|_| format!("Invalid minor version: {}", parts[1]))?;
        let patch = parts[2].parse::<u32>()
            .map_err(|_| format!("Invalid patch version: {}", parts[2]))?;

        Ok(Version::new(major, minor, patch))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct VersionSuggestions {
    pub current: Version,
    pub release: Version,
    pub update: Version,
    pub patch: Version,
}

/// Parse a version string (with or without 'v' prefix)
pub fn parse_version(s: &str) -> Result<Version, String> {
    Version::from_str(s)
}

/// Bump a version string according to commit type
pub fn bump_version(version_str: &str, commit_type: CommitType) -> Result<String, String> {
    let version = parse_version(version_str)?;
    Ok(version.bump(commit_type).to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_display() {
        let v = Version::new(1, 2, 3);
        assert_eq!(v.to_string(), "v1.2.3");
    }

    #[test]
    fn test_version_from_str() {
        let v = Version::from_str("v1.2.3").unwrap();
        assert_eq!(v, Version::new(1, 2, 3));

        let v2 = Version::from_str("1.2.3").unwrap();
        assert_eq!(v2, Version::new(1, 2, 3));
    }

    #[test]
    fn test_bump_release() {
        let v = Version::new(1, 2, 3);
        let bumped = v.bump(CommitType::Release);
        assert_eq!(bumped, Version::new(2, 0, 0));
    }

    #[test]
    fn test_bump_update() {
        let v = Version::new(1, 2, 3);
        let bumped = v.bump(CommitType::Update);
        assert_eq!(bumped, Version::new(1, 3, 0));
    }

    #[test]
    fn test_bump_patch() {
        let v = Version::new(1, 2, 3);
        let bumped = v.bump(CommitType::Patch);
        assert_eq!(bumped, Version::new(1, 2, 4));
    }

    #[test]
    fn test_suggestions() {
        let v = Version::new(1, 0, 0);
        let suggestions = v.suggestions();
        assert_eq!(suggestions.current, Version::new(1, 0, 0));
        assert_eq!(suggestions.release, Version::new(2, 0, 0));
        assert_eq!(suggestions.update, Version::new(1, 1, 0));
        assert_eq!(suggestions.patch, Version::new(1, 0, 1));
    }
}
