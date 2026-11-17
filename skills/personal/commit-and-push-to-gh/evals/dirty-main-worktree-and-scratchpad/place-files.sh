#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
pwsh -NoProfile -File ./build-sandbox.ps1 -Case dirty-main-worktree-and-scratchpad -Root ./sandbox
mkdir -p outputs
