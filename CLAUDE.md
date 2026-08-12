# TrustworkX Website — Rules for Claude sessions

This repo is the TrustworkX marketing website. It is edited by the marketing
team through Claude Code chat sessions. Follow these rules in every session,
without exception.

## Deployment model (how your changes reach the website)

- `main` branch = the live website at https://www.trustworkx.de/
- Every pull request automatically deploys to the staging preview at
  https://www-staging.trustworkx.de/ (password-protected; the marketing team
  has the password).
- Deploys are done by GitHub Actions. You never SSH to any server and never
  deploy manually.

## Workflow — follow this for every change request

1. Create a new branch from `main` (e.g. `update-hero-headline`).
2. Make the requested change and push the branch.
3. Open a pull request. This automatically deploys the change to staging.
4. Tell the user: what you changed, and that they can preview it at
   https://www-staging.trustworkx.de/ (it can take ~1 minute to appear).
5. Wait. Only merge the PR after the user explicitly approves with words like
   "publish", "go live", or "put it on the live site". A positive comment
   ("looks nice") is NOT approval — ask if they want it published.
6. If they want adjustments, keep committing to the same branch/PR; staging
   updates automatically.

## Hard rules

- NEVER commit or push directly to `main`. All changes go through a PR.
- NEVER merge a PR without the user's explicit approval in this conversation.
- NEVER modify anything under `.github/` — the deploy pipeline is off-limits.
- Plain HTML, CSS, and vanilla JavaScript only. Do NOT add frameworks,
  build tools, npm/package.json, or preprocessors. The site must stay
  static files that work by just being copied to a server.
- Use relative or root-relative URLs for internal links and assets
  (e.g. `css/style.css` or `/css/style.css`). Never hardcode
  `https://www.trustworkx.de` into internal links — the same files are
  served on staging and live.
- Forms may submit to the external API via JS (XHR/fetch), but this repo
  contains no backend code.

## Communication

- Address the user informally with "du" (never the formal "Sie"), in German,
  in every session. The user explicitly asked for this permanently.

## Style

- Keep the site fast and dependency-free: no external fonts/CDNs unless the
  user explicitly asks.
- Keep HTML semantic and accessible (alt text on images, proper headings).
