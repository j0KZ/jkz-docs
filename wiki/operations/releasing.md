---
title: Releasing
description: The manual release process for jkz — moving the changelog, tagging, and pushing, plus the local validation that mirrors what CI checks before the GitHub Release is cut.
---

Releasing jkz is a deliberate, manual process. There is no auto-publish on merge: a release happens when a human decides the `[Unreleased]` changes are ready to ship, picks the next version number according to the [SemVer policy](/operations/semver/), and walks the steps below. The changelog is the spine of the whole process — it is both the human-readable record and the machine-readable input that CI uses to populate the GitHub Release notes.

## Steps

1. **Move `[Unreleased]` items into a new released section.** In `CHANGELOG.md`, replace the empty placeholder under `## [Unreleased]` with a fresh empty skeleton, and create a new section above the previous release using the form `## [vX.Y.Z] — YYYY-MM-DD`. The em-dash (`—`) and the `v` prefix are required: `scripts/validate-changelog.js` matches the section by tag, and a hyphen or a missing prefix will not match.

2. **Commit the changelog update.**

   ```bash
   git commit -m "release: vX.Y.Z"
   ```

3. **Tag the release.**

   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

4. **Push the commit and the tag.**

   ```bash
   git push origin main && git push origin vX.Y.Z
   ```

5. **CI validation and GitHub Release.** The release workflow runs `node scripts/validate-changelog.js vX.Y.Z` to verify the section exists and is non-empty, then `node scripts/extract-changelog-section.js vX.Y.Z` to populate the GitHub Release body from that section.

## Validating locally

Before pushing the tag you can run the same two checks CI will run, so a malformed changelog section is caught on your machine rather than in the release workflow:

```bash
node scripts/validate-changelog.js vX.Y.Z
node scripts/extract-changelog-section.js vX.Y.Z
```

Both should succeed, and the extracted section should match what you expect to appear in the GitHub Release notes. If validation fails, it is almost always the section header — check the em-dash, the `v` prefix, and that the section is non-empty.
