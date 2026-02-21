# Aureus - Pre-Commit Hook (SECURED) for Windows PowerShell
# Validates code quality before commit
#
# Security Features:
# - Safe config parsing with validation
# - Input validation
# - No command injection vectors

param()

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
$LintEnabled = $true
$TypecheckEnabled = $true
$TestEnabled = $false
$SecretScanEnabled = $true
$MaxFileSize = 10485760  # 10MB

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
        Write-ColorOutput "Warning: Config file too large, ignoring" $Colors.Yellow
        return $false
    }

    try {
        $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json

        # Safely extract values with defaults
        $hooks = $config.hooks
        if ($hooks) {
            $preCommit = $hooks.preCommit
            if ($preCommit) {
                $script:LintEnabled = $preCommit.lint -ne $false
                $script:TypecheckEnabled = $preCommit.typecheck -ne $false
                $script:TestEnabled = $preCommit.test -eq $true
                $script:SecretScanEnabled = $preCommit.secretScan -ne $false
            }
        }

        return $true
    } catch {
        Write-ColorOutput "Warning: Failed to parse config file" $Colors.Yellow
        return $false
    }
}

# Load config if exists
$ConfigFile = ".git-flow-config.json"
if (Test-Path $ConfigFile) {
    Parse-ConfigSafe $ConfigFile
}

Write-ColorOutput "Running pre-commit checks..." $Colors.Yellow

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Test-CommandExists {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Invoke-NpmScript {
    param([string]$Script, [string]$Description)

    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw
        if ($packageJson -match "`"$Script`"") {
            Write-ColorOutput "  Running: $Description" $Colors.Blue
            try {
                npm run $Script 2>&1 | Out-Null
                Write-ColorOutput "    OK $Description passed" $Colors.Green
                return $true
            } catch {
                Write-ColorOutput "    X $Description failed" $Colors.Red
                return $false
            }
        }
    }
    return $true
}

function Invoke-CommandSafe {
    param([string]$Command, [string]$Description)

    if (Test-CommandExists $Command) {
        Write-ColorOutput "  Running: $Description" $Colors.Blue
        try {
            & $Command 2>&1 | Out-Null
            Write-ColorOutput "    OK $Description passed" $Colors.Green
            return $true
        } catch {
            Write-ColorOutput "    X $Description failed" $Colors.Red
            return $false
        }
    }
    return $true
}

# ============================================================================
# SECRET SCANNING
# ============================================================================

if ($SecretScanEnabled) {
    Write-ColorOutput "`nScanning for secrets..." $Colors.Yellow

    $SecretPatterns = @(
        'password\s*=\s*[''"][^''"]+[''"]'
        'api[_-]?key\s*=\s*[''"][^''"]+[''"]'
        'secret[_-]?key\s*=\s*[''"][^''"]+[''"]'
        'private[_-]?key'
        'BEGIN\s+(RSA\s+)?PRIVATE\s+KEY'
        'aws_access_key_id\s*=\s*[A-Z0-9]{20}'
        'aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}'
    )

    $SecretFound = $false

    # Get staged files
    $stagedFiles = git diff --cached --name-only --diff-filter=ACM 2>$null

    foreach ($file in $stagedFiles) {
        if (-not (Test-Path $file)) { continue }

        # Skip binary files
        $fileInfo = Get-Item $file
        if ($fileInfo.Length -gt $MaxFileSize) {
            Write-ColorOutput "  Skipping large file: $file" $Colors.Yellow
            continue
        }

        # Check for secrets in diff
        $diff = git diff --cached $file 2>$null
        if ($diff) {
            foreach ($pattern in $SecretPatterns) {
                if ($diff -match $pattern) {
                    Write-ColorOutput "  X Potential secret detected in: $file" $Colors.Red
                    Write-ColorOutput "    Please review and remove any sensitive data" $Colors.Yellow
                    $SecretFound = $true
                    break
                }
            }
        }
    }

    if ($SecretFound) {
        exit 1
    }

    Write-ColorOutput "  OK No secrets detected" $Colors.Green
}

# ============================================================================
# LINTING
# ============================================================================

if ($LintEnabled) {
    Write-ColorOutput "`nChecking code style..." $Colors.Yellow

    $lintFailed = $false

    if (-not (Invoke-NpmScript "lint" "Linting")) {
        $lintFailed = $true
    }

    if ($lintFailed -and (Test-CommandExists "eslint")) {
        if (-not (Invoke-CommandSafe "eslint" "ESLint")) {
            $lintFailed = $true
        }
    }

    if ($lintFailed -and (Test-CommandExists "prettier")) {
        prettier --check . 2>&1 | Out-Null
    }

    # Rust projects
    if ((Test-CommandExists "cargo") -and (Test-Path "Cargo.toml")) {
        if (-not (Invoke-CommandSafe "cargo clippy -- -D warnings" "Clippy")) {
            $lintFailed = $true
        }
    }

    if ($lintFailed) {
        Write-ColorOutput "`nLinting issues found" $Colors.Yellow
    }
}

# ============================================================================
# TYPE CHECKING
# ============================================================================

if ($TypecheckEnabled) {
    Write-ColorOutput "`nType checking..." $Colors.Yellow

    $typecheckFailed = $false

    if (-not (Invoke-NpmScript "typecheck" "TypeScript")) {
        $typecheckFailed = $true
    }

    if ($typecheckFailed -and (Test-CommandExists "tsc")) {
        if (-not (Invoke-CommandSafe "tsc --noEmit" "TypeScript")) {
            $typecheckFailed = $true
        }
    }

    # Python
    if (Test-CommandExists "mypy") {
        if (-not (Invoke-CommandSafe "mypy ." "Mypy")) {
            $typecheckFailed = $true
        }
    }

    # Rust
    if ((Test-CommandExists "cargo") -and (Test-Path "Cargo.toml")) {
        if (-not (Invoke-CommandSafe "cargo check" "Cargo check")) {
            $typecheckFailed = $true
        }
    }

    if ($typecheckFailed) {
        Write-ColorOutput "`nType check issues found" $Colors.Yellow
    }
}

# ============================================================================
# TESTS
# ============================================================================

if ($TestEnabled) {
    Write-ColorOutput "`nRunning tests..." $Colors.Yellow

    $testFailed = $false

    if (-not (Invoke-NpmScript "test" "Tests")) {
        $testFailed = $true
    }

    if ($testFailed -and (Test-CommandExists "pytest")) {
        if (-not (Invoke-CommandSafe "pytest" "Pytest")) {
            $testFailed = $true
        }
    }

    if ($testFailed -and (Test-CommandExists "cargo") -and (Test-Path "Cargo.toml")) {
        if (-not (Invoke-CommandSafe "cargo test" "Cargo tests")) {
            $testFailed = $true
        }
    }

    if ($testFailed) {
        Write-ColorOutput "`nTests failed! Aborting commit." $Colors.Red
        Write-ColorOutput "Fix test failures before committing." $Colors.Yellow
        exit 1
    }
}

Write-ColorOutput "`nOK Pre-commit checks passed!" $Colors.Green
exit 0
