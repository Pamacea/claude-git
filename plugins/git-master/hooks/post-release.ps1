# Aureus - Post-Release Hook for Windows PowerShell
# Runs after a release is created to update changelog and notify
#
# Usage: ./post-release.sh <tag-name>

param(
    [Parameter(Mandatory=$false)]
    [string]$TagName
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

# Check if we're in a git repository
try {
    $null = git rev-parse --git-dir 2>$null
} catch {
    Write-ColorOutput "Not in a git repository" $Colors.Red
    exit 1
}

# Get tag name if not provided
if (-not $TagName) {
    try {
        $TagName = git describe --tags --abbrev=0 2>$null
    } catch {
        Write-ColorOutput "No tags found" $Colors.Yellow
        exit 0
    }
}

if (-not $TagName) {
    Write-ColorOutput "No tag name provided or found" $Colors.Yellow
    exit 0
}

# Remove 'v' prefix for version number
$Version = $TagName -replace '^v', ''

Write-ColorOutput "Post-release hook triggered for $TagName" $Colors.Blue

# ============================================================================
# UPDATE CHANGELOG
# ============================================================================

$ChangelogFile = "CHANGELOG.md"

if (Test-Path $ChangelogFile) {
    Write-ColorOutput "Updating $ChangelogFile..." $Colors.Yellow

    # Get commits since last tag
    try {
        $PreviousTag = git describe --tags --abbrev=0 "$TagName^" 2>$null
        $CommitRange = "$PreviousTag..$TagName"
    } catch {
        $CommitRange = $TagName
    }

    # Get commits in Versioned Release Convention format
    $Commits = git log $CommitRange --pretty=format:"%s" 2>$null

    if ($Commits) {
        # Parse commits by type
        $Releases = @()
        $Updates = @()
        $Patches = @()

        foreach ($commit in $Commits -split "`n") {
            if ($commit -match "^RELEASE: (.+) - v[0-9.]+") {
                $Releases += $matches[1]
            } elseif ($commit -match "^UPDATE: (.+) - v[0-9.]+") {
                $Updates += $matches[1]
            } elseif ($commit -match "^PATCH: (.+) - v[0-9.]+") {
                $Patches += $matches[1]
            }
        }

        # Generate changelog entry
        $Date = Get-Date -Format "yyyy-MM-dd"
        $ChangelogEntry = @"

## [$Version] - $Date

"@

        if ($Releases.Count -gt 0) {
            $ChangelogEntry += "`n### Breaking Changes`n"
            foreach ($item in $Releases) {
                $ChangelogEntry += "- $item`n"
            }
        }

        if ($Updates.Count -gt 0) {
            $ChangelogEntry += "`n### Features`n"
            foreach ($item in $Updates) {
                $ChangelogEntry += "- $item`n"
            }
        }

        if ($Patches.Count -gt 0) {
            $ChangelogEntry += "`n### Bug Fixes`n"
            foreach ($item in $Patches) {
                $ChangelogEntry += "- $item`n"
            }
        }

        # Prepend to changelog
        $CurrentContent = Get-Content $ChangelogFile -Raw
        $NewContent = $CurrentContent -replace "(## \[Unreleased\]|# Changelog)", "`$1$ChangelogEntry"
        Set-Content $ChangelogFile $NewContent -NoNewline

        Write-ColorOutput "  OK Updated $ChangelogFile" $Colors.Green
    }
} else {
    Write-ColorOutput "  No $ChangelogFile found, skipping" $Colors.Yellow
}

# ============================================================================
# NOTIFY
# ============================================================================

Write-ColorOutput ""
Write-ColorOutput "Release $TagName created successfully!" $Colors.Green
Write-ColorOutput "Don't forget to:" $Colors.Yellow
Write-ColorOutput "  1. Push changes: git push && git push --tags" $Colors.White
Write-ColorOutput "  2. Create GitHub release (if configured)" $Colors.White
Write-ColorOutput "  3. Update documentation" $Colors.White

exit 0
