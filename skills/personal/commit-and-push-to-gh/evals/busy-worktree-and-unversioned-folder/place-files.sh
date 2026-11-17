#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
pwsh -NoProfile -File ./build-sandbox.ps1 -Case busy-worktree-and-unversioned-folder -Root ./sandbox
mkdir -p outputs
