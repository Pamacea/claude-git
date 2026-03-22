//! CLI interface definitions using clap derive macros

use clap::{Parser, Subcommand, ValueEnum, Args};

#[derive(Parser)]
#[command(name = "aureus")]
#[command(about = "Aureus - Versioned Release Convention CLI", long_about = None)]
#[command(version = "0.12.0")]
#[command(author = "Oalacea <oalacea@proton.me>")]
#[command(propagate_version = true)]
pub struct CliArgs {
    /// Verbosity level (-v, -vv, -vvv)
    #[arg(short, long, action = clap::ArgAction::Count, global = true)]
    pub verbose: u8,

    /// Quiet mode (no output except errors)
    #[arg(short, long, global = true)]
    pub quiet: bool,

    /// Repository path (defaults to current directory)
    #[arg(short, long, global = true)]
    pub repo: Option<String>,

    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand)]
pub enum Command {
    /// Create a versioned commit (generates VRC format automatically)
    Commit(CommitCommand),

    /// Amend last commit (keeps same version, adds to body)
    Amend(AmendCommand),

    /// Create a release with tag and CHANGELOG
    Release(ReleaseCommand),

    /// Suggest next version based on current state
    Suggest(SuggestCommand),

    /// Manage git hooks
    Hooks(HooksCommand),

    /// Manage Aureus configuration
    Config(ConfigCommand),

    /// Initialize Aureus for Claude Code integration
    Init(InitCommand),

    /// Show commit and release statistics
    Stats(StatsCommand),

    /// Show repository status
    Status(StatusCommand),

    /// Show diff of changes
    Diff(DiffCommand),

    /// Manage repository tracking
    Repo(RepoCommand),

    /// Update Aureus to latest version
    Update(UpdateCommand),

    /// Generate shell completion scripts
    Completion(CompletionCommand),
}

#[derive(Args, Clone)]
pub struct CommitCommand {
    /// Commit message (will be parsed for type detection)
    #[arg(short, long)]
    pub message: Option<String>,

    /// Force specific commit type (auto-detected if not specified)
    #[arg(long, value_enum)]
    pub r#type: Option<CommitType>,

    /// Project name (defaults to config or directory name)
    #[arg(short, long)]
    pub project: Option<String>,

    /// Version (defaults to auto-bumped version)
    #[arg(short, long)]
    pub version: Option<String>,

    /// Allow empty commit
    #[arg(long)]
    pub allow_empty: bool,

    /// Skip hooks
    #[arg(long)]
    pub no_verify: bool,

    /// Add all changed files
    #[arg(short, long)]
    pub all: bool,
}

#[derive(Args, Clone)]
pub struct AmendCommand {
    /// Additional message to append
    #[arg(short, long)]
    pub message: Option<String>,

    /// Add all changed files
    #[arg(short, long)]
    pub all: bool,
}

#[derive(Args, Clone)]
pub struct ReleaseCommand {
    /// Version to release (auto-detected if not specified)
    #[arg(short, long)]
    pub version: Option<String>,

    /// Create annotated tag
    #[arg(long)]
    pub annotated: bool,

    /// Push tag to remote
    #[arg(long)]
    pub push: bool,

    /// Update CHANGELOG.md
    #[arg(long)]
    pub changelog: bool,

    /// Auto-determine version from commit history
    #[arg(long)]
    pub auto: bool,
}

#[derive(Args, Clone)]
pub struct SuggestCommand {
    /// Show version bump for each type
    #[arg(long)]
    pub all: bool,

    /// Output format (text, json)
    #[arg(short, long, value_enum, default_value_t = OutputFormat::Text)]
    pub format: OutputFormat,
}

#[derive(Args, Clone)]
pub struct HooksCommand {
    #[command(subcommand)]
    pub action: HooksAction,
}

#[derive(Subcommand, Clone)]
pub enum HooksAction {
    /// Install git hooks for VRC validation
    Install {
        /// Install globally (uses template directory)
        #[arg(long)]
        global: bool,
    },

    /// Uninstall git hooks
    Uninstall {
        /// Uninstall globally
        #[arg(long)]
        global: bool,
    },

    /// Show hook status
    Status,

    /// Validate commit message (called by git commit-msg hook)
    ValidateCommit {
        /// Path to commit message file
        file: String,
    },

    /// Run pre-commit checks (called by git pre-commit hook)
    PreCommit,
}

#[derive(Args, Clone)]
pub struct ConfigCommand {
    #[command(subcommand)]
    pub action: ConfigAction,
}

#[derive(Subcommand, Clone)]
pub enum ConfigAction {
    /// Get a config value
    Get {
        /// Config key (e.g., project.name, commit.types.RELEASE)
        key: String,
    },

    /// Set a config value
    Set {
        /// Config key
        key: String,
        /// Config value
        value: String,
    },

    /// List all config
    List {
        /// Show all including defaults
        #[arg(long)]
        all: bool,
    },

    /// Edit config file in $EDITOR
    Edit,

    /// Reset to defaults
    Reset {
        /// Reset specific key only
        key: Option<String>,
    },
}

#[derive(Args, Clone)]
pub struct InitCommand {
    /// Initialize globally (for Claude Code)
    #[arg(short, long)]
    pub global: bool,

    /// Skip hook installation
    #[arg(long)]
    pub no_hooks: bool,

    /// Force overwrite existing files
    #[arg(long)]
    pub force: bool,
}

#[derive(Args, Clone)]
pub struct StatsCommand {
    /// Show stats for specific time period
    #[arg(short, long, value_enum)]
    pub period: Option<StatsPeriod>,

    /// Output format
    #[arg(short, long, value_enum, default_value_t = OutputFormat::Text)]
    pub format: OutputFormat,
}

#[derive(Args, Clone)]
pub struct UpdateCommand {
    /// Force update even if already on latest version
    #[arg(long)]
    pub force: bool,

    /// Don't install, just show latest version
    #[arg(long)]
    pub check_only: bool,
}

#[derive(Args, Clone)]
pub struct CompletionCommand {
    /// Shell type (bash, zsh, fish, powershell, elvish)
    pub shell: String,
}

#[derive(Args, Clone)]
pub struct StatusCommand {
    /// Show short format
    #[arg(short, long)]
    pub short: bool,

    /// Show porcelain format (machine-readable)
    #[arg(long)]
    pub porcelain: bool,
}

#[derive(Args, Clone)]
pub struct DiffCommand {
    /// Show staged changes only
    #[arg(short, long)]
    pub cached: bool,

    /// Show name-status format
    #[arg(long)]
    pub name_status: bool,

    /// Output format (unified, name-only)
    #[arg(short, long)]
    pub format: Option<String>,
}

#[derive(Args, Clone)]
pub struct RepoCommand {
    #[command(subcommand)]
    pub action: RepoAction,
}

#[derive(Subcommand, Clone)]
pub enum RepoAction {
    /// Track a repository
    Track {
        /// Repository name
        name: String,
    },

    /// Untrack a repository
    Untrack,

    /// List tracked repositories
    List,

    /// Show current repository info
    Info,
}

/// Commit types for Versioned Release Convention
#[derive(ValueEnum, Clone, Copy, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum CommitType {
    /// Major release - Breaking changes (MAJOR bump)
    Release,

    /// Minor update - New features (MINOR bump)
    Update,

    /// Patch - Bug fixes (PATCH bump)
    Patch,
}

impl CommitType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Release => "RELEASE",
            Self::Update => "UPDATE",
            Self::Patch => "PATCH",
        }
    }

    #[cfg(test)]
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "RELEASE" => Some(Self::Release),
            "UPDATE" => Some(Self::Update),
            "PATCH" => Some(Self::Patch),
            _ => None,
        }
    }
}

impl std::fmt::Display for CommitType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// Output format for commands
#[derive(ValueEnum, Clone, Copy, Debug, PartialEq, Eq)]
pub enum OutputFormat {
    Text,
    Json,
}

/// Time period for statistics
#[derive(ValueEnum, Clone, Copy, Debug, PartialEq, Eq)]
pub enum StatsPeriod {
    Today,
    Week,
    Month,
    Year,
    All,
}
