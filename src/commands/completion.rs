//! Shell completion generation

use anyhow::Result;
use std::fmt::Write as _;


pub fn execute(shell: String) -> Result<()> {
    let shell_lower = shell.to_lowercase();
    let script = match shell_lower.as_str() {
        "bash" => bash_completion(),
        "zsh" => zsh_completion(),
        "fish" => fish_completion(),
        "powershell" | "pwsh" => powershell_completion(),
        "elvish" => elvish_completion(),
        _ => {
            return Err(anyhow::anyhow!(
                "Unsupported shell: {}. Supported: bash, zsh, fish, powershell, elvish",
                shell
            ))
        }
    };

    println!("{}", script);
    Ok(())
}

fn bash_completion() -> String {
    let mut buf = String::new();

    writeln!(buf, "# bash completion for aureus").unwrap();
    writeln!(buf, "_aureus_vrc_completion() {{").unwrap();
    writeln!(buf, "    local cur prev words cword").unwrap();
    writeln!(buf, "    _init_completion || return").unwrap();
    writeln!(buf).unwrap();

    writeln!(buf, "    case $prev in").unwrap();
    writeln!(buf, "        commit)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"-m --message -t --type -p --project -V --version -a --all --allow-empty --no-verify\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        amend)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"-m --message -a --all\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        release)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"-v --version -a --annotated -p --push -c --changelog --auto\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        init)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"-g --global --no-hooks -f --force\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        config)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"get set list edit reset\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        hooks)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"install uninstall status\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        update)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"--force --check-only\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        completion)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"bash zsh fish powershell elvish\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        *)").unwrap();
    writeln!(buf, "            COMPREPLY=($(compgen -W \"commit amend release suggest hooks config init stats update completion -h --help -V --version\" -- \"$cur\"))").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "    esac").unwrap();
    writeln!(buf, "}}").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "complete -F _aureus_vrc_completion aureus").unwrap();
    writeln!(buf, "complete -F _aureus_vrc_completion aureus").unwrap();

    buf
}

fn zsh_completion() -> String {
    let mut buf = String::new();

    writeln!(buf, "# zsh completion for aureus").unwrap();
    writeln!(buf, "_aureus_vrc() {{").unwrap();
    writeln!(buf, "    local -a commands").unwrap();
    writeln!(buf, "    commands=(").unwrap();
    writeln!(buf, "        'commit:Create a versioned commit'").unwrap();
    writeln!(buf, "        'amend:Amend last commit'").unwrap();
    writeln!(buf, "        'release:Create a release'").unwrap();
    writeln!(buf, "        'suggest:Suggest next version'").unwrap();
    writeln!(buf, "        'hooks:Manage git hooks'").unwrap();
    writeln!(buf, "        'config:Manage configuration'").unwrap();
    writeln!(buf, "        'init:Initialize for Claude Code'").unwrap();
    writeln!(buf, "        'stats:Show statistics'").unwrap();
    writeln!(buf, "        'update:Update to latest version'").unwrap();
    writeln!(buf, "        'completion:Generate completion script'").unwrap();
    writeln!(buf, "    )").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "    if (( CURRENT == 1 )); then").unwrap();
    writeln!(buf, "        _describe -V commands commands").unwrap();
    writeln!(buf, "        return").unwrap();
    writeln!(buf, "    fi").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "    case $words[2] in").unwrap();
    writeln!(buf, "        commit)").unwrap();
    writeln!(buf, "            _arguments '-m[Commit message]:message:' \\").unwrap();
    writeln!(buf, "                '-t[Commit type]:type:(RELEASE UPDATE PATCH)' \\").unwrap();
    writeln!(buf, "                '-p[Project name]:name:' \\").unwrap();
    writeln!(buf, "                '--allow-empty[Allow empty commit]'").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        init)").unwrap();
    writeln!(buf, "            _arguments '--global[Initialize globally]' \\").unwrap();
    writeln!(buf, "                '--no-hooks[Skip hook installation]' \\").unwrap();
    writeln!(buf, "                '--force[Force overwrite]'").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "        completion)").unwrap();
    writeln!(buf, "            _arguments '::shell:(bash zsh fish powershell elvish)'").unwrap();
    writeln!(buf, "            ;;").unwrap();
    writeln!(buf, "    esac").unwrap();
    writeln!(buf, "}}").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "compdef _aureus_vrc aureus").unwrap();
    writeln!(buf, "compdef _aureus_vrc aureus").unwrap();

    buf
}

fn fish_completion() -> String {
    let mut buf = String::new();

    writeln!(buf, "# fish completion for aureus").unwrap();
    writeln!(buf, "complete -c aureus -f").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "complete -c aureus -n __fish_use_subcommand -a commit -d 'Create versioned commit'").unwrap();
    writeln!(buf, "complete -c aureus -n '__fish_seen_subcommand_from commit' -l message -s m -d 'Commit message'").unwrap();
    writeln!(buf, "complete -c aureus -n '__fish_seen_subcommand_from commit' -l type -s t -d 'Commit type' -x -a '{{RELEASE UPDATE PATCH}}'").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "complete -c aureus -n __fish_use_subcommand -a amend -d 'Amend last commit'").unwrap();
    writeln!(buf, "complete -c aureus -n '__fish_seen_subcommand_from amend' -l message -s m -d 'Additional message'").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "complete -c aureus -n __fish_use_subcommand -a release -d 'Create release'").unwrap();
    writeln!(buf, "complete -c aureus -n '__fish_seen_subcommand_from release' -l auto -d 'Auto-detect version'").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "complete -c aureus -n __fish_use_subcommand -a init -d 'Initialize for Claude Code'").unwrap();
    writeln!(buf, "complete -c aureus -n '__fish_seen_subcommand_from init' -l global -s g -d 'Initialize globally'").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "complete -c aureus -n __fish_use_subcommand -a update -d 'Update to latest version'").unwrap();
    writeln!(buf, "complete -c aureus -n '__fish_seen_subcommand_from update' -l force -d 'Force update'").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "complete -c aureus -n __fish_use_subcommand -a completion -d 'Generate completion'").unwrap();
    writeln!(buf, "complete -c aureus -n '__fish_seen_subcommand_from completion' -k __fish_seen_subcommand_from -l bash -l zsh -l fish -l powershell -l elvish").unwrap();

    buf
}

fn powershell_completion() -> String {
    let mut buf = String::new();

    writeln!(buf, "# PowerShell completion for aureus").unwrap();
    writeln!(buf, "Register-ArgumentCompleter -Native -CommandName aureus -ScriptBlock {{").unwrap();
    writeln!(buf, "    param($wordToComplete, $commandAst, $cursorPosition)").unwrap();
    writeln!(buf, "    $command = $commandAst.CommandElements[0].Extent.Text").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "    $subCommands = @(").unwrap();
    writeln!(buf, "        {{ Name = 'commit'; Description = 'Create versioned commit' }},").unwrap();
    writeln!(buf, "        {{ Name = 'amend'; Description = 'Amend last commit' }},").unwrap();
    writeln!(buf, "        {{ Name = 'release'; Description = 'Create release' }},").unwrap();
    writeln!(buf, "        {{ Name = 'suggest'; Description = 'Suggest next version' }},").unwrap();
    writeln!(buf, "        {{ Name = 'init'; Description = 'Initialize for Claude Code' }},").unwrap();
    writeln!(buf, "        {{ Name = 'update'; Description = 'Update to latest version' }},").unwrap();
    writeln!(buf, "        {{ Name = 'completion'; Description = 'Generate completion' }}").unwrap();
    writeln!(buf, "    )").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "    if ($commandAst.CommandElements.Count -eq 1) {{").unwrap();
    writeln!(buf, "        $subCommands | Where-Object {{ $_.Name -like \"$wordToComplete*\" }} |").unwrap();
    writeln!(buf, "            ForEach-Object {{ [Management.Automation.CompletionResult]::new($_.Name, $_.Name, 'ParameterValue', $_.Description) }}").unwrap();
    writeln!(buf, "    }}").unwrap();
    writeln!(buf, "}}").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "# Also register for 'aureus' alias").unwrap();
    writeln!(buf, "Register-ArgumentCompleter -Native -CommandName aureus -ScriptBlock $ScriptBlock").unwrap();

    buf
}

fn elvish_completion() -> String {
    let mut buf = String::new();

    writeln!(buf, "# elvish completion for aureus").unwrap();
    writeln!(buf, "edit:completion:command:aureus = [{{ grc }}] {{").unwrap();
    writeln!(buf, "    @cmds = [commit amend release suggest init update completion]").unwrap();
    writeln!(buf).unwrap();
    writeln!(buf, "    if (eq (count $grc) 1) {{").unwrap();
    writeln!(buf, "        put $@cmds | each {{s $$ grc[0]}}").unwrap();
    writeln!(buf, "    }}").unwrap();
    writeln!(buf, "}}").unwrap();

    buf
}
