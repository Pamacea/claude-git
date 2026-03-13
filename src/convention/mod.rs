//! Versioned Release Convention (VRC) parsing and generation
//!
//! ## VRC Format
//!
//! ```text
//! TYPE: PROJECT NAME - vX.Y.Z
//!
//! - Change 1
//! - Change 2
//! ```
//!
//! ## Types
//!
//! - **RELEASE**: Major version bump (breaking changes)
//! - **UPDATE**: Minor version bump (new features)
//! - **PATCH**: Patch version bump (bug fixes)

pub mod parser;
pub mod version;
pub mod detect;

pub use parser::{parse_message, generate_message};
// Public API exports - may generate unused warning in bin but are library API
pub use version::{Version, VersionSuggestions, bump_version, parse_version};
pub use detect::detect_commit_type;
pub use crate::cli::CommitType;
