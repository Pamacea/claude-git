# Git Flow Master - Commit Message Hook (SECURED) for Windows PowerShell
# Validates commit messages against Versioned Release Convention
#
# Format: TYPE: PROJECT NAME - vVERSION
# - RELEASE: Project Name - v1.0.0 (Major)
# - UPDATE: Project Name - v1.1.0 (Minor)
# - PATCH: Project Name - v1.1.1 (Patch)
#
# Security Features:
# - Safe config parsing with validation
# - Input validation for commit message file
# - Safe string handling

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMsgFile
)

$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Default values (secure defaults)
$ValidateEnabled = $true
$SubjectMax = 100
$MaxMsgSize = 65536  # 64KB max message size
$RequireVersion = $true
$RequireProjectName = $true
$AllowAmend = $true

# ============================================================================
# INPUT VALIDATION
# ============================================================================

# Verify commit message file argument
if (-not $CommitMsgFile) {
    Write-ColorOutput "Error: No commit message file provided" $Colors.Red
    exit 1
}

# Verify file exists
if (-not (Test-Path $CommitMsgFile)) {
    Write-ColorOutput "Error: Commit message file does not exist: $CommitMsgFile" $Colors.Red
    exit 1
}

# Check file size
$fileInfo = Get-Item $CommitMsgFile
if ($fileInfo.Length -gt $MaxMsgSize) {
    Write-ColorOutput "Error: Commit message file too large" $Colors.Red
    exit 1
}

# Read commit message safely
$CommitMsg = Get-Content $CommitMsgFile -Raw

# ============================================================================
# SAFE CONFIG PARSING
# ============================================================================

function Parse-ConfigSafe {
    param([string]$ConfigFile)

    if (-not (Test-Path $ConfigFile)) {
        return $false
    }

    # Verify file size is reasonable (< 1MB)
    $fileInfo = Get-Item $ConfigFile
    if ($fileInfo.Length -gt 1048576) {
        return $false
    }

    try {
        $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json

        # Safely extract values with validation
        $commit = $config.commit
        $hooks = $config.hooks
        $commitMsg = $null
        if ($hooks) { $commitMsg = $hooks.commitMsg }
        $rules = $null
        if ($commit) { $rules = $commit.rules }

        # Validate and extract integer with bounds
        if ($rules -and $rules.subjectMaxLength) {
            $subjectMax = [int]$rules.subjectMaxLength
            if ($subjectMax -ge 10 -and $subjectMax -le 200) {
                $script:SubjectMax = $subjectMax
            }
        }

        # Version and project name requirements
        if ($rules) {
            if ($null -ne $rules.requireVersion) {
                $script:RequireVersion = [bool]$rules.requireVersion
            }
            if ($null -ne $rules.requireProjectName) {
                $script:RequireProjectName = [bool]$rules.requireProjectName
            }
        }

        # Amend settings
        if ($commitMsg -and $null -ne $commitMsg.allowAmend) {
            $script:AllowAmend = [bool]$commitMsg.allowAmend
        }

        if ($commitMsg -and $null -ne $commitMsg.validate) {
            $script:ValidateEnabled = [bool]$commitMsg.validate
        }

        return $true
    } catch {
        # Use defaults on error
        return $false
    }
}

# Load config if exists
$ConfigFile = ".git-flow-config.json"
if (Test-Path $ConfigFile) {
    Parse-ConfigSafe $ConfigFile
}

# ============================================================================
# SKIP CONDITIONS
# ============================================================================

# Skip validation for merge, revert, squash commits
if ($CommitMsg -match "^(merge |revert |squash )") {
    exit 0
}

# Skip if validation disabled
if (-not $ValidateEnabled) {
    exit 0
}

# ============================================================================
# VALIDATION
# ============================================================================

Write-ColorOutput "Validating commit message..." $Colors.Yellow

# Get first line safely
$Subject = ($CommitMsg -split "`n")[0].Trim()

# Versioned Release Convention Pattern
# Format: TYPE: PROJECT NAME - vVERSION
# Types: RELEASE, UPDATE, PATCH
# Version: v1.0.0, v1.1.0, v1.1.1, etc.
$Pattern = "^(RELEASE|UPDATE|PATCH): [A-Za-z0-9_ -]+ - v[0-9]+\.[0-9]+\.[0-9]+.*$"

# Check if message matches pattern
if ($Subject -notmatch $Pattern) {
    Write-ColorOutput ""
    Write-ColorOutput "Invalid commit message format!" $Colors.Red
    Write-ColorOutput ""
    Write-ColorOutput "Commit messages must follow Versioned Release Convention:" $Colors.White
    Write-ColorOutput "  TYPE: PROJECT NAME - vVERSION" $Colors.Green
    Write-ColorOutput ""
    Write-ColorOutput "Valid types:" $Colors.Blue
    Write-ColorOutput "  - RELEASE  : Major release (breaking changes) -> v2.0.0"
    Write-ColorOutput "  - UPDATE   : Minor update (new features)     -> v1.1.0"
    Write-ColorOutput "  - PATCH    : Patch (bug fixes)               -> v1.0.1"
    Write-ColorOutput ""
    Write-ColorOutput "Format:" $Colors.Blue
    Write-ColorOutput "  RELEASE: My Project - v1.0.0"
    Write-ColorOutput "  UPDATE: My Project - v1.1.0"
    Write-ColorOutput "  PATCH: My Project - v1.0.1"
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $Colors.Blue
    Write-ColorOutput "  RELEASE: Git Flow Master - v2.0.0"
    Write-ColorOutput "  UPDATE: Git Flow Master - v1.1.0"
    Write-ColorOutput "  PATCH: Git Flow Master - v1.0.1"
    Write-ColorOutput ""
    Write-ColorOutput "After the title, add your changes in the body:" $Colors.Yellow
    Write-ColorOutput "  PATCH: My Project - v1.0.1"
    Write-ColorOutput "  "
    Write-ColorOutput "  - Fixed login validation"
    Write-ColorOutput "  - Updated error messages"
    exit 1
}

# Extract type, project, and version
if ($Subject -match "^(RELEASE|UPDATE|PATCH)") {
    $Type = $matches[1]
} else {
    $Type = "UNKNOWN"
}

if ($Subject -match "v[0-9]+\.[0-9]+\.[0-9]+") {
    $Version = $matches[0]
} else {
    $Version = ""
}

if ($Subject -match "^(?:RELEASE|UPDATE|PATCH): ([A-Za-z0-9_ -]+) - v[0-9]+\.[0-9]+\.[0-9]+") {
    $Project = $matches[1].Trim()
} else {
    $Project = ""
}

# Check subject length
$SubjectLen = $Subject.Length
if ($SubjectLen -gt $SubjectMax) {
    Write-ColorOutput ""
    Write-ColorOutput "Subject line too long!" $Colors.Red
    Write-ColorOutput "Subject: $SubjectLen characters (max: $SubjectMax)"
    Write-ColorOutput ""
    Write-ColorOutput "Please keep the first line under $SubjectMax characters."
    exit 1
}

# Validate version format
if ([string]::IsNullOrEmpty($Version)) {
    Write-ColorOutput ""
    Write-ColorOutput "Version required in commit message!" $Colors.Red
    Write-ColorOutput "Format: TYPE: PROJECT NAME - vVERSION"
    Write-ColorOutput "Example: UPDATE: My Project - v1.1.0"
    exit 1
}

# Validate project name
if ([string]::IsNullOrEmpty($Project) -or ($Project -eq $Subject)) {
    Write-ColorOutput ""
    Write-ColorOutput "Project name required in commit message!" $Colors.Red
    Write-ColorOutput "Format: TYPE: PROJECT NAME - vVERSION"
    Write-ColorOutput "Example: UPDATE: My Project - v1.1.0"
    exit 1
}

# Display parsed info
Write-ColorOutput "  OK Type: $Type" $Colors.Green
Write-ColorOutput "  OK Project: $Project" $Colors.Green
Write-ColorOutput "  OK Version: $Version" $Colors.Green

# Check for body content (encouraged but not required)
$BodyLines = ($CommitMsg -split "`n" | Select-Object -Skip 2 | Where-Object { $_.Trim() -ne "" })
if ($BodyLines.Count -gt 0) {
    Write-ColorOutput "  OK Body content detected" $Colors.Green
} else {
    Write-ColorOutput "  Consider adding changes description in body" $Colors.Yellow
}

# Check if this might be an amend (same version as previous commit)
if ($AllowAmend) {
    try {
        $LastCommit = git log -1 --pretty=%s 2>$null
        if ($LastCommit -match "v[0-9]+\.[0-9]+\.[0-9]+") {
            $LastVersion = $matches[0]
            if ($Version -eq $LastVersion) {
                Write-ColorOutput "  Same version as last commit - consider using amend if adding to same release" $Colors.Yellow
            }
        }
    } catch {
        # Ignore errors
    }
}

Write-ColorOutput ""
Write-ColorOutput "OK Commit message validated!" $Colors.Green
exit 0
