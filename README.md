# TrustworkX Website

Static marketing website (plain HTML/CSS, no build step).

- **Live:** https://www.trustworkx.de/ — deployed automatically from `main`
- **Staging:** https://www-staging.trustworkx.de/ (password-protected) — every
  pull request deploys here automatically

## How changes are made

The marketing team chats with Claude Code (phone or web) on this repo. Claude
makes each change on a branch, opens a PR (→ staging preview), and merges only
after explicit approval (→ live). Rules live in [CLAUDE.md](CLAUDE.md).

## Server

Deploys are rsync-over-SSH from GitHub Actions to the Hetzner server.
Provisioning details: [docs/server-setup.md](docs/server-setup.md).
