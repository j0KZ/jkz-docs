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

Step 2 -- append `sanitizer-recheck` to the contexts array via the
additive `POST` subroute. The endpoint
`POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts`
is GitHub's documented "Add status check contexts" verb -- it appends to
the existing list rather than replacing it, which avoids the
full-replace foot-gun of `PUT` on the same subroute:

```bash
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/j0KZ/jkz-docs/branches/main/protection/required_status_checks/contexts \
  -f 'contexts[]=sanitizer-recheck'
```

(`POST` on this subroute is additive and idempotent -- re-adding the
same context returns the existing array. `PUT` on the same subroute
replaces the full list; do not substitute the verbs. Reference:
GitHub REST API docs, "Branch protection -- Add status check contexts"
endpoint. The URL is intentionally not inlined because the vendored
sanitizer treats inline URLs as redactable content; search the GitHub
docs for the endpoint name to land on the canonical page.)

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
   The literal is constructed at runtime from two halves so this
   runbook itself does not trip `sanitizer-recheck` on its own commits.

   ```bash
   mkdir -p tmp-sanitizer-test
   # Reconstruct the canonical AWS docs example key at runtime.
   # First half is the AWS access-key prefix + 4 padding chars;
   # second half completes the 20-char literal.
   KEY_PREFIX='AKIA'
   KEY_BODY='IOSFODNN7EXAMPLE'
   AWS_FAKE="${KEY_PREFIX}${KEY_BODY}"
   cat > tmp-sanitizer-test/secret.md <<EOF
   # Sanitizer trip test

   This file is part of WG-06 acceptance and MUST trigger sanitizer-recheck.

   Fake AWS access key (do not use): ${AWS_FAKE}
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

## 6. Sync workflow: PR + auto-merge (not direct push)

The sync workflow lands its commit through a PR with auto-merge enabled,
not via a direct `git push origin HEAD:main`. The branch protection rule
on `main` requires the `recheck` status check (see section 3), and
`recheck` only runs on PRs. A direct push will always be rejected with:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: - Required status check "recheck" is expected.
```

The flow inside `.github/workflows/sanitizer-sync.yml` is:

1. Create a unique branch keyed on `<SHORT_SHA>-<run_id>` for auditable
   provenance + collision-safe re-runs.
2. Push the vendored sanitizer to that branch.
3. `gh pr create` against `main`.
4. `gh pr merge --auto --squash --delete-branch`.

`recheck` runs on the PR and gates auto-merge. The defense-in-depth from
WG-06 is preserved.

The workflow needs `permissions.pull-requests: write` (in addition to
`contents: write`) for `gh pr create` and `--auto`. The repo also needs
two one-time settings enabled (Settings → General → Pull Requests):

| Setting                        | Required | Why |
|--------------------------------|----------|-----|
| Allow auto-merge               | yes      | `gh pr merge --auto` fails on repos where this is off |
| Automatically delete head branches | yes  | The sync workflow no longer passes `--delete-branch` (incompatible with `--auto` when a merge queue is configured), so the repo-level setting handles cleanup of `sanitizer-sync/auto-*` branches |

CLI equivalents (one-time, idempotent):

```bash
gh api -X PATCH repos/j0KZ/jkz-docs \
  -F allow_auto_merge=true \
  -F delete_branch_on_merge=true
```

Verify:

```bash
gh api repos/j0KZ/jkz-docs --jq '{allow_auto_merge, delete_branch_on_merge}'
```

If either flag is `false` when the sync workflow runs, the workflow will
fail at the `gh pr merge --auto` step (auto-merge disabled) or leave
`sanitizer-sync/auto-*` branches behind (auto-delete disabled).

Historical note: this behavior changed on 2026-05-24 after the original
direct-push flow failed 5 consecutive daily runs (2026-05-19 → 2026-05-23,
all with the GH006 error above). The original assumption was that
`persist-credentials: true` on the public checkout was sufficient to push
to `main`; the branch protection requirement was not accounted for. The
root cause was branch protection, not auth or schema.
