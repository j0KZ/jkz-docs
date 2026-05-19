# Runbook -- WG-06 Sanitizer CI Workflow + Daily Sync

This runbook covers the operator-side setup for the two workflows
introduced in `chore/wg-06-sanitizer-ci`:

- `.github/workflows/sanitizer-recheck.yml` -- defense-in-depth sanitizer
  pass on every PR that touches `**/*.md`.
- `.github/workflows/sanitizer-sync.yml` -- daily mirror of the
  sanitizer source from the private `j0KZ/jkz_Multi-Agent_System` repo
  into `vendored/sanitizers/` of this public repo.

No branch-protection or secret-provisioning changes are executed by the
PR itself. All actions below are **manual** and must be run by an
operator with the appropriate permissions.

---

## 1. Provision `WIKI_BOT_TOKEN`

The sync workflow reads the private repo and writes back to this public
repo. It needs a fine-grained personal-access token stored as the
repository secret `WIKI_BOT_TOKEN` on `j0KZ/jkz-docs`.

Required scopes (GitHub fine-grained PAT):

| Repository                          | Permission          | Access  |
|-------------------------------------|---------------------|---------|
| `j0KZ/jkz_Multi-Agent_System`       | Contents            | Read    |
| `j0KZ/jkz_Multi-Agent_System`       | Metadata            | Read    |
| `j0KZ/jkz-docs`                     | Contents            | Write   |
| `j0KZ/jkz-docs`                     | Metadata            | Read    |
| `j0KZ/jkz-docs`                     | Workflows           | Write   |

- Expiration: **90 days**. Calendar the renewal on the operator's
  schedule -- the workflow will start failing on the first sync run
  after expiry, and the failure surfaces via the Telegram alert step.
- Owner: tie the PAT to a bot account if possible. If the PAT lives on
  a human account, document the owner in the secret description.

Set the secret on the public repo:

```bash
# Run from any directory; `gh` resolves the repo via the flag.
gh secret set WIKI_BOT_TOKEN \
  --repo j0KZ/jkz-docs \
  --body "<paste-fine-grained-pat>"
```

Verify it landed:

```bash
gh secret list --repo j0KZ/jkz-docs | grep WIKI_BOT_TOKEN
```

## 2. Provision `WIKI_TELEGRAM_WEBHOOK`

Both workflows post a Telegram alert on failure. The webhook URL is
read from the repository secret `WIKI_TELEGRAM_WEBHOOK`. If this is
already set (the existing `build-trigger.yml` uses the same secret),
nothing new is required.

Format expected by `curl --data-urlencode "text=..."`: any HTTP endpoint
that accepts an `application/x-www-form-urlencoded` POST with a `text`
field. In jkz this is the project's Hermes/Telegram bridge.

If absent, both workflows degrade gracefully (the alert step logs and
exits 0); the workflow still fails because the prior step failed, but
no Telegram message is emitted.

## 3. Add `sanitizer-recheck` to required status checks on `main`

This is the gate that makes the recheck a merge blocker.

> Important: GitHub's branch-protection v1 endpoint replaces the entire
> `required_status_checks.contexts` array. Read first, append, then
> write -- never PUT a partial array, you will silently remove other
> checks.

Step 1 -- read current protection (capture the existing contexts):

```bash
gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/j0KZ/jkz-docs/branches/main/protection/required_status_checks \
  > /tmp/jkz-docs-rsc.json
cat /tmp/jkz-docs-rsc.json
```

Step 2 -- append `sanitizer-recheck` to the contexts array and PUT it
back. The endpoint
`PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts`
accepts an additive array; using it avoids the full-replace foot-gun:

```bash
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/j0KZ/jkz-docs/branches/main/protection/required_status_checks/contexts \
  -f 'contexts[]=sanitizer-recheck'
```

(`POST` to that subroute is GitHub's documented "add" verb; it is
idempotent -- re-adding the same context returns the existing array.)

Step 3 -- verify:

```bash
gh api \
  /repos/j0KZ/jkz-docs/branches/main/protection/required_status_checks \
  --jq '.contexts'
```

The output should include `"sanitizer-recheck"`.

If the repo does not yet have branch protection, set it up first via
`PUT /repos/{owner}/{repo}/branches/{branch}/protection` -- that
configuration is out of scope for this runbook because the existing
protection (if any) likely already covers required reviews,
linear-history, etc.

## 4. Acceptance test (manual)

The acceptance criterion is: "a PR with an injected secret fails CI in
under 2 minutes." Run this once after the workflow lands on `main`:

1. Create a throwaway branch from `main`:

   ```bash
   git checkout -b test/wg-06-sanitizer-trip
   ```

2. Add a markdown file containing a tripwire secret. Use a
   well-known fake that the sanitizer's `secret_sanitizer` will hit
   (an `AKIA`-prefixed AWS key, a `ghp_`-prefixed GitHub token, etc.).
   Example:

   ```bash
   mkdir -p tmp-sanitizer-test
   cat > tmp-sanitizer-test/secret.md <<'EOF'
   # Sanitizer trip test

   This file is part of WG-06 acceptance and MUST trigger sanitizer-recheck.

   Fake AWS access key (do not use): AKIAIOSFODNN7EXAMPLE
   EOF
   git add tmp-sanitizer-test/secret.md
   git commit -m "test: WG-06 sanitizer trip test (delete after)"
   git push -u origin test/wg-06-sanitizer-trip
   ```

3. Open a PR against `main`:

   ```bash
   gh pr create --base main --head test/wg-06-sanitizer-trip \
     --title "test(wg-06): sanitizer trip test (DO NOT MERGE)" \
     --body "WG-06 acceptance gate -- expected to FAIL on sanitizer-recheck."
   ```

4. Observe `sanitizer-recheck` go red within 2 min. Check the job log
   for the line `sanitize-md: SECRET DETECTED in 1/1 file(s)`.

5. Close the PR without merging and delete the branch:

   ```bash
   gh pr close <N> --delete-branch
   ```

## 5. Operational notes

- **Sync drift detection**: the sync workflow commits with the source
  SHA in the message (`chore(sanitizer-sync): vendor sanitizer @
  <12-char SHA>`). To audit drift, compare the latest sync commit's
  SHA against `j0KZ/jkz_Multi-Agent_System` HEAD on
  `skills/wiki-generator/src/sanitizers/`. Drift should never exceed
  24 h once the cron is healthy.
- **Manual sync trigger**: run
  `gh workflow run sanitizer-sync.yml --repo j0KZ/jkz-docs` to force a
  sync (e.g. immediately after a sanitizer fix lands in the private
  repo and a public PR is blocked on stale rules).
- **Disabling the recheck temporarily**: do **not** unprotect the
  branch. Instead, fix-forward in the private repo and run the manual
  sync (above) to ship the corrected ruleset.
- **CLI shim location**: the shim is at `vendored/sanitize-md.mjs`
  (parent of `vendored/sanitizers/`). It is intentionally outside the
  rsync mirror target so the daily sync's `--delete` does not wipe it.
